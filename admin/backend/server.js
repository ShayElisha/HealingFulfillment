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

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: [
    process.env.ADMIN_FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined,
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
let isConnected = false

const connectDB = async () => {
  if (isConnected) {
    return
  }
  
  try {
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log('✅ Admin Service: Connected to MongoDB')
  } catch (error) {
    console.error('❌ Admin Service: MongoDB connection error:', error)
    throw error
  }
}

// Middleware to ensure DB connection in Vercel
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB()
    } catch (error) {
      return res.status(500).json({ 
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
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
app.use('/api/admin', adminRoutes)
app.use('/api', customersRoutes)
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
  res.status(404).json({ message: 'Route not found' })
})

// For local development, connect and start server
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

