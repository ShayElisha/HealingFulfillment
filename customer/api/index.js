// Vercel Serverless Function - Minimal wrapper
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const app = express()
const MONGODB_URI = process.env.MONGODB_URI

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

// Health check - no dependencies
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// MongoDB connection
let mongoPromise = null

async function getMongoConnection() {
  if (mongoose.connection.readyState === 1) {
    return true
  }
  
  if (!mongoPromise) {
    mongoPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then(() => {
      console.log('✅ MongoDB connected')
      return true
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error)
      mongoPromise = null
      return false
    })
  }
  
  return mongoPromise
}

// Lazy load routes
let routesLoaded = false

async function loadRoutes() {
  if (routesLoaded) return
  
  try {
    const [
      { default: authRoutes },
      { default: bookingRoutes },
      { default: contactRoutes },
      { default: reviewsRoutes },
      { default: coursesRoutes },
      { default: categoriesRoutes },
      { default: purchasesRoutes },
      { default: messagesRoutes }
    ] = await Promise.all([
      import('../backend/routes/auth.js'),
      import('../backend/routes/booking.js'),
      import('../backend/routes/contact.js'),
      import('../backend/routes/reviews.js'),
      import('../backend/routes/courses.js'),
      import('../backend/routes/categories.js'),
      import('../backend/routes/purchases.js'),
      import('../backend/routes/messages.js')
    ])
    
    app.use('/api/auth', authRoutes)
    app.use('/api/booking', bookingRoutes)
    app.use('/api/contact', contactRoutes)
    app.use('/api/reviews', reviewsRoutes)
    app.use('/api/courses', coursesRoutes)
    app.use('/api/categories', categoriesRoutes)
    app.use('/api/purchases', purchasesRoutes)
    app.use('/api/messages', messagesRoutes)
    
    routesLoaded = true
    console.log('✅ Routes loaded successfully')
  } catch (error) {
    console.error('❌ Error loading routes:', error)
    console.error('Error stack:', error.stack)
    throw error
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Export handler
export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection
    if (MONGODB_URI) {
      await getMongoConnection()
    }
    
    // Load routes on first request
    if (!routesLoaded) {
      await loadRoutes()
    }
    
    return app(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    console.error('Error stack:', error.stack)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      })
    }
  }
}
