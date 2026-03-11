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

dotenv.config()

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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Fix URL path for Vercel serverless functions
// In Vercel, requests to /api/contact come to the function as /contact (via [...path])
// But our routes expect /api/contact, so we need to add /api prefix
// Check if running in Vercel (either via env var or by checking if we're in a serverless context)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || 
                 (typeof process.env.AWS_LAMBDA_FUNCTION_NAME === 'undefined' && 
                  typeof process.env.VERCEL_URL !== 'undefined')

// Always add middleware, but make it smart about when to modify paths
app.use((req, res, next) => {
  // Only modify paths if we're in Vercel or if the path doesn't start with /api
  // This handles both Vercel (where paths come without /api) and local dev (where they have /api)
  const currentPath = req.path || ''
  const originalUrl = req.originalUrl || req.url || ''
  
  // If we're in Vercel or the path doesn't start with /api (and it's not /health), add /api prefix
  if ((isVercel || !currentPath.startsWith('/api')) && currentPath !== '/health' && !originalUrl.startsWith('/api')) {
    // Add /api prefix to all paths
    const newPath = currentPath.startsWith('/') ? '/api' + currentPath : '/api/' + currentPath
    const newUrl = originalUrl.startsWith('/') ? '/api' + originalUrl : '/api/' + originalUrl
    
    req.url = newUrl
    req.originalUrl = newUrl
    req.path = newPath
  } else if (originalUrl.startsWith('/api') && !currentPath.startsWith('/api')) {
    // If originalUrl has /api but path doesn't, sync them
    req.path = originalUrl.split('?')[0] // Remove query string
  }
  
  if (isVercel) {
    console.log(`[Vercel] Request: ${req.method} ${req.path} (original: ${originalUrl})`)
  }
  next()
})

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')))
app.use('/uploads/customers', express.static(path.join(__dirname, 'uploads/customers')))

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
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI)
      console.log('Connected to MongoDB')
    } catch (error) {
      console.error('MongoDB connection error:', error)
      return res.status(500).json({ message: 'Database connection failed' })
    }
  }
  next()
}

// Apply MongoDB connection middleware to all API routes
app.use('/api/', ensureMongoConnection)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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
  res.status(404).json({ message: 'Route not found' })
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

