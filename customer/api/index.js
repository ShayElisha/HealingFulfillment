// Vercel Serverless Function - Create Express app directly
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import authRoutes from '../backend/routes/auth.js'
import bookingRoutes from '../backend/routes/booking.js'
import contactRoutes from '../backend/routes/contact.js'
import reviewsRoutes from '../backend/routes/reviews.js'
import coursesRoutes from '../backend/routes/courses.js'
import categoriesRoutes from '../backend/routes/categories.js'
import purchasesRoutes from '../backend/routes/purchases.js'
import messagesRoutes from '../backend/routes/messages.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

// Set default JWT_SECRET if not defined
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not defined')
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production-' + Date.now()
}

const app = express()
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
const allowedOrigins = [
  process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
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

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
})

app.use('/api/', generalLimiter)

// Health check
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

// Routes
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

// MongoDB connection
let mongoConnected = false
let mongoConnecting = false

async function connectMongoDB() {
  if (mongoConnected || mongoose.connection.readyState === 1) {
    return true
  }
  
  if (mongoConnecting) {
    // Wait for ongoing connection
    while (mongoConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return mongoConnected
  }
  
  mongoConnecting = true
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    mongoConnected = true
    console.log('✅ MongoDB connected')
    return true
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    console.error('MONGODB_URI:', MONGODB_URI ? 'Set' : 'Not set')
    mongoConnected = false
    return false
  } finally {
    mongoConnecting = false
  }
}

// Export handler for Vercel
export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection before handling request
    if (!mongoConnected && mongoose.connection.readyState === 0) {
      const connected = await connectMongoDB()
      if (!connected) {
        console.warn('MongoDB not connected, but continuing with request')
      }
    }
    
    return app(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    console.error('Error stack:', error.stack)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
