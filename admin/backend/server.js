import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import adminRoutes from './routes/admin.js'
import customersRoutes from './routes/customers.js'
import coursesRoutes from './routes/courses.js'
import categoriesRoutes from './routes/categories.js'
import purchasesRoutes from './routes/purchases.js'
import bookingRoutes from './routes/booking.js'
import uploadRoutes from './routes/upload.js'
import messagesRoutes from './routes/messages.js'
import reviewsRoutes from './routes/reviews.js'
import testEmailRoutes from './routes/test-email.js'
import contactRoutes from './routes/contact.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Set default JWT_SECRET if not defined (for development only)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not defined in .env file')
  console.warn('⚠️  Using a default secret for development. DO NOT use this in production!')
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production-' + Date.now()
}

const app = express()
const PORT = process.env.ADMIN_PORT || 5001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'

// Trust proxy - Required for Vercel and other proxy environments
// This fixes X-Forwarded-For errors and ensures correct IP addresses
app.set('trust proxy', 1)

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      process.env.ADMIN_FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined,
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ].filter(Boolean)
    
    // In Vercel production, allow same-origin requests (frontend and API on same domain)
    if (process.env.VERCEL) {
      return callback(null, true)
    }
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
let isConnected = false
let isConnecting = false
let connectionPromise = null

const connectDB = async () => {
  if (isConnected) {
    return
  }
  
  // If already connecting, wait for that promise
  if (isConnecting && connectionPromise) {
    return connectionPromise
  }
  
  isConnecting = true
  connectionPromise = (async () => {
    try {
      // Increase timeout for Vercel serverless (30 seconds)
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        connectTimeoutMS: 30000, // 30 seconds
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
      })
      isConnected = true
      isConnecting = false
      connectionPromise = null
      console.log('✅ Admin Service: Connected to MongoDB')
    } catch (error) {
      isConnecting = false
      connectionPromise = null
      console.error('❌ Admin Service: MongoDB connection error:', error)
      throw error
    }
  })()
  
  return connectionPromise
}

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  // Skip if already sent response
  if (res.headersSent) {
    return next()
  }
  
  if (!isConnected && !isConnecting) {
    try {
      await connectDB()
    } catch (error) {
      // Only send error if response hasn't been sent
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: 'Database connection failed',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }
      return
    }
  } else if (isConnecting && connectionPromise) {
    // Wait for connection if it's in progress
    try {
      await connectionPromise
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: 'Database connection failed',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }
      return
    }
  }
  
  next()
})

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')))
app.use('/uploads/customers', express.static(path.join(__dirname, 'uploads/customers')))

// Handle OPTIONS requests for CORS preflight - MUST be before rate limiting
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Rate limiting - more lenient for admin panel
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200
})

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs for admin
})

app.use('/api/', generalLimiter)
app.use('/api/admin', adminLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'admin-service',
    timestamp: new Date().toISOString() 
  })
})

// Routes - Admin Service
// IMPORTANT: customersRoutes must come before adminRoutes because it handles /admin/customers
// which would otherwise be caught by /api/admin prefix
app.use('/api', customersRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/purchases', purchasesRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/test-email', testEmailRoutes)
app.use('/api/contact', contactRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Admin Service Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && {
      url: req.url,
      originalUrl: req.originalUrl
    })
  })
})

// Connect and start server (only in local development, not in Vercel)
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Admin Service running on port ${PORT}`)
      })
    })
    .catch((error) => {
      console.error('❌ Admin Service: MongoDB connection error:', error)
      process.exit(1)
    })
}

export default app

