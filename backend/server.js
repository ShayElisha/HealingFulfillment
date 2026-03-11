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

// Fix URL path for Vercel serverless functions
// In Vercel, requests to /api/contact come to the function as /contact (via [...path])
// But our routes expect /api/contact, so we need to add /api prefix
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL

app.use((req, res, next) => {
  const originalUrl = req.originalUrl || req.url || ''
  
  // Skip health check
  if (originalUrl === '/health' || originalUrl.startsWith('/health')) {
    return next()
  }
  
  // In Vercel, paths come without /api prefix, so we need to add it
  // In local dev, paths already have /api prefix
  if (isVercel && !originalUrl.startsWith('/api')) {
    const newUrl = '/api' + (originalUrl.startsWith('/') ? originalUrl : '/' + originalUrl)
    // Only modify url properties that can be modified
    req.url = newUrl
    req.originalUrl = newUrl
    // Don't try to modify req.path as it's read-only in Vercel
  }
  
  next()
})

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
  if (mongoose.connection.readyState === 1) {
    return next()
  }
  
  // Check if MONGODB_URI is set
  if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/healing-fulfillment') {
    console.error('MongoDB URI not configured')
    return res.status(500).json({ 
      message: 'Database connection failed',
      error: 'MONGODB_URI environment variable is not set'
    })
  }
  
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    console.log('MongoDB connected successfully')
    next()
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    console.error('MongoDB connection error stack:', error.stack)
    return res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message
    })
  }
}

// Apply MongoDB connection middleware to all API routes
app.use('/api/', ensureMongoConnection)

// Health check
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection.readyState
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL
  
  res.json({ 
    status: mongoState === 1 ? 'ok' : 'degraded',
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

// Routes with logging
console.log('[Server] Registering routes...')

app.use('/api/contact', (req, res, next) => {
  console.log('[Route] /api/contact:', req.method, req.path)
  next()
}, contactRoutes)

app.use('/api/booking', (req, res, next) => {
  console.log('[Route] /api/booking:', req.method, req.path)
  next()
}, bookingRoutes)

app.use('/api/blog', (req, res, next) => {
  console.log('[Route] /api/blog:', req.method, req.path)
  next()
}, blogRoutes)

app.use('/api/admin', (req, res, next) => {
  console.log('[Route] /api/admin:', req.method, req.path)
  next()
}, adminRoutes)

app.use('/api/courses', (req, res, next) => {
  console.log('[Route] /api/courses:', req.method, req.path)
  next()
}, coursesRoutes)

app.use('/api/categories', (req, res, next) => {
  console.log('[Route] /api/categories:', req.method, req.path)
  next()
}, categoriesRoutes)

app.use('/api/purchases', (req, res, next) => {
  console.log('[Route] /api/purchases:', req.method, req.path)
  next()
}, purchasesRoutes)

app.use('/api/upload', (req, res, next) => {
  console.log('[Route] /api/upload:', req.method, req.path)
  next()
}, uploadRoutes)

app.use('/api', (req, res, next) => {
  console.log('[Route] /api (customers):', req.method, req.path)
  next()
}, customersRoutes)

app.use('/api/auth', (req, res, next) => {
  console.log('[Route] /api/auth:', req.method, req.path, 'Full URL:', req.originalUrl)
  next()
}, authRoutes)

console.log('[Server] All routes registered')

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
  console.log('[404 Handler] Route not found:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    headers: req.headers
  })
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
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

