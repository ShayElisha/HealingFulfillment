import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import authRoutes from './routes/auth.js'
import bookingRoutes from './routes/booking.js'
import contactRoutes from './routes/contact.js'
import reviewsRoutes from './routes/reviews.js'
import coursesRoutes from './routes/courses.js'
import categoriesRoutes from './routes/categories.js'
import purchasesRoutes from './routes/purchases.js'
import messagesRoutes from './routes/messages.js'

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
const PORT = process.env.CUSTOMER_PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration - support both local and Vercel deployments
const allowedOrigins = [
  process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Vercel URLs
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
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

// Serve uploaded files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
})

app.use('/api/', generalLimiter)

// Health check - support both /health and /api/health
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'customer-service',
    timestamp: new Date().toISOString() 
  })
})

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'customer-service',
    timestamp: new Date().toISOString() 
  })
})

// Routes - Customer Service
app.use('/api/auth', authRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/purchases', purchasesRoutes)
app.use('/api/messages', messagesRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Customer Service Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Connect to MongoDB - use connection pooling for serverless
const connectMongoDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Customer Service: Already connected to MongoDB')
      return
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    })
    console.log('✅ Customer Service: Connected to MongoDB')
  } catch (error) {
    console.error('❌ Customer Service: MongoDB connection error:', error)
    // Don't exit on Vercel - let the function handle the error
    if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
      process.exit(1)
    }
  }
}

// Connect to MongoDB
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  // Local development - connect and start server
  connectMongoDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Customer Service running on port ${PORT}`)
    })
  })
} else {
  // Vercel serverless - connect but don't block
  connectMongoDB()
  console.log('🚀 Customer Service ready for Vercel serverless functions')
}

export default app

