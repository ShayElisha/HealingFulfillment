import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import contactRoutes from './routes/contact.js'
import bookingRoutes from './routes/booking.js'
import blogRoutes from './routes/blog.js'
import adminRoutes from './routes/admin.js'
import coursesRoutes from './routes/courses.js'
import categoriesRoutes from './routes/categories.js'
import purchasesRoutes from './routes/purchases.js'
import uploadRoutes from './routes/upload.js'
import customersRoutes from './routes/customers.js'
import authRoutes from './routes/auth.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Only load .env file in non-Vercel environments
// Vercel uses environment variables from dashboard
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  dotenv.config()
}

// Set default JWT_SECRET if not defined (for development only)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not defined in .env file')
  console.warn('⚠️  Using a default secret for development. DO NOT use this in production!')
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production-' + Date.now()
}

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))
// CORS configuration - allow all origins in production (Vercel handles this)
const corsOptions = {
  origin: process.env.VERCEL === '1' 
    ? true // Allow all origins in Vercel (it handles CORS)
    : [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001', // Admin frontend
        'http://localhost:3000', // Main frontend
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

// Handle OPTIONS requests explicitly for CORS preflight
app.options('*', cors(corsOptions))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files (only in non-serverless environments)
// In Vercel/serverless, files should be served from external storage (S3, Cloudinary, etc.)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
  app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')))
  app.use('/uploads/customers', express.static(path.join(__dirname, 'uploads/customers')))
}

// Rate limiting - more lenient for admin panel
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
})

// More lenient rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs for admin
})

app.use('/api/', generalLimiter)
app.use('/api/admin', adminLimiter)

// MongoDB connection middleware for serverless functions
const ensureMongoConnection = async (req, res, next) => {
  const middlewareStart = Date.now()
  
  // Skip MongoDB connection for health check
  if (req.path === '/health' || req.url === '/health' || req.url.startsWith('/health')) {
    return next()
  }
  
  const connectionState = mongoose.connection.readyState
  console.log(`[MongoDB Middleware] State: ${connectionState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`)
  
  // Already connected - proceed immediately
  if (connectionState === 1) {
    console.log(`[MongoDB Middleware] Already connected, proceeding (${Date.now() - middlewareStart}ms)`)
    return next()
  }
  
  // Currently connecting - wait briefly (max 2 seconds)
  if (connectionState === 2) {
    console.log('[MongoDB Middleware] Connection in progress, waiting...')
    const waitStart = Date.now()
    try {
      await Promise.race([
        new Promise((resolve) => {
          const checkConnection = () => {
            const state = mongoose.connection.readyState
            if (state === 1) {
              resolve()
            } else if (state === 0 || state === 3) {
              // Connection failed or disconnecting, will try to reconnect below
              resolve()
            } else {
              setTimeout(checkConnection, 50) // Check every 50ms
            }
          }
          checkConnection()
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB connection wait timeout')), 2000) // Max 2 seconds
        )
      ])
      if (mongoose.connection.readyState === 1) {
        console.log(`[MongoDB Middleware] Connection completed in ${Date.now() - waitStart}ms`)
        return next()
      }
    } catch (error) {
      console.error(`[MongoDB Middleware] Wait timeout after ${Date.now() - waitStart}ms`)
      // Continue to try connecting below
    }
  }
  
  // Check if MONGODB_URI is set
  if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/healing-fulfillment') {
    console.error('[MongoDB Middleware] URI not configured')
    return res.status(500).json({ 
      message: 'Database connection failed',
      error: 'MONGODB_URI environment variable is not set'
    })
  }
  
  // Clean and fix URI
  let finalUri = MONGODB_URI.trim()
  
  // Validate URI format
  if (!finalUri.startsWith('mongodb://') && !finalUri.startsWith('mongodb+srv://')) {
    console.error('[MongoDB Middleware] Invalid URI format')
    return res.status(500).json({ 
      message: 'Database connection failed',
      error: 'Invalid MongoDB URI format'
    })
  }
  
  // Fix URI if it doesn't have database name
  if (finalUri.endsWith('/')) {
    finalUri = finalUri + 'healing-fulfillment'
  } else if (!finalUri.match(/\/[^\/]+$/)) {
    finalUri = finalUri + '/healing-fulfillment'
  }
  
  console.log('[MongoDB Middleware] Attempting to connect...')
  const connectStart = Date.now()
  
  try {
    // Disconnect if in bad state
    if (mongoose.connection.readyState === 3) {
      await mongoose.disconnect()
    }
    
    // Use very short timeout for serverless
    await Promise.race([
      mongoose.connect(finalUri, {
        serverSelectionTimeoutMS: 2000, // 2 seconds
        socketTimeoutMS: 4000, // 4 seconds
        connectTimeoutMS: 2000, // 2 seconds
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 2000)
      )
    ])
    console.log(`[MongoDB Middleware] Connected in ${Date.now() - connectStart}ms (total: ${Date.now() - middlewareStart}ms)`)
    next()
  } catch (error) {
    console.error(`[MongoDB Middleware] Connection error after ${Date.now() - connectStart}ms:`, error.message)
    return res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message,
      time: Date.now() - middlewareStart
    })
  }
}

// Apply MongoDB connection middleware to all API routes
app.use('/api/', ensureMongoConnection)

// Health check - doesn't require MongoDB connection
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL
  
  // Return immediately without waiting for MongoDB
  res.json({ 
    status: 'ok',
    environment: isVercel ? 'vercel' : 'local',
    timestamp: new Date().toISOString(),
    mongodb: {
      state: mongoState,
      stateName: mongoStates[mongoState] || 'unknown',
      connected: mongoState === 1
    },
    vercel: {
      detected: !!isVercel,
      env: process.env.VERCEL,
      envName: process.env.VERCEL_ENV,
      url: process.env.VERCEL_URL
    }
  })
})

// Routes
app.use('/api/contact', contactRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/blog', blogRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/purchases', purchasesRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api', customersRoutes)
app.use('/api/auth', authRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found'
  })
})

// Connect to MongoDB (only for non-serverless environments)
if (process.env.VERCEL !== '1') {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB')
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
      })
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error)
      process.exit(1)
    })
}

export default app

