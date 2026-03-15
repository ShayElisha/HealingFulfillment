// Vercel Serverless Function - ES Module compatible wrapper
// This file must use ONLY ES module syntax - no CommonJS patterns

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Initialize dotenv first
dotenv.config()

// Create Express app
const app = express()

// Basic CORS - allow all origins for now (can be restricted later)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoints (no dependencies)
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

// MongoDB connection handler
const MONGODB_URI = process.env.MONGODB_URI
let mongoConnectionPromise = null

async function ensureMongoConnection() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return true
  }
  
  // Connection in progress
  if (mongoConnectionPromise) {
    return mongoConnectionPromise
  }
  
  // Start new connection
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set - some routes may not work')
    return false
  }
  
  mongoConnectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  }).then(() => {
    console.log('✅ MongoDB connected')
    return true
  }).catch((error) => {
    console.error('❌ MongoDB connection error:', error.message)
    mongoConnectionPromise = null
    return false
  })
  
  return mongoConnectionPromise
}

// Routes loader - lazy load to avoid import errors
let routesLoaded = false
let routesLoadPromise = null

async function loadRoutes() {
  if (routesLoaded) {
    return
  }
  
  if (routesLoadPromise) {
    return routesLoadPromise
  }
  
  routesLoadPromise = (async () => {
    try {
      // Dynamic imports - all routes must export default
      const [
        authModule,
        bookingModule,
        contactModule,
        reviewsModule,
        coursesModule,
        categoriesModule,
        purchasesModule,
        messagesModule
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
      
      // Verify all modules have default export
      const routes = {
        auth: authModule.default,
        booking: bookingModule.default,
        contact: contactModule.default,
        reviews: reviewsModule.default,
        courses: coursesModule.default,
        categories: categoriesModule.default,
        purchases: purchasesModule.default,
        messages: messagesModule.default
      }
      
      // Check if any route is missing default export
      for (const [name, route] of Object.entries(routes)) {
        if (!route) {
          throw new Error(`Route ${name} does not have a default export`)
        }
      }
      
      // Mount routes
      app.use('/api/auth', routes.auth)
      app.use('/api/booking', routes.booking)
      app.use('/api/contact', routes.contact)
      app.use('/api/reviews', routes.reviews)
      app.use('/api/courses', routes.courses)
      app.use('/api/categories', routes.categories)
      app.use('/api/purchases', routes.purchases)
      app.use('/api/messages', routes.messages)
      
      routesLoaded = true
      console.log('✅ All routes loaded successfully')
    } catch (error) {
      console.error('❌ Error loading routes:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      routesLoadPromise = null
      throw error
    }
  })()
  
  return routesLoadPromise
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err)
  console.error('Error type:', err.constructor?.name)
  console.error('Error message:', err.message)
  console.error('Error stack:', err.stack)
  console.error('Request URL:', req.url)
  console.error('Request Method:', req.method)
  
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.toString(),
        type: err.constructor?.name
      })
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method
  })
})

// Vercel Serverless Function handler
export default async function handler(req, res) {
  try {
    console.log('Handler called:', req.method, req.url)
    
    // Ensure MongoDB connection
    if (MONGODB_URI) {
      const connected = await ensureMongoConnection()
      if (!connected) {
        console.warn('MongoDB not connected, but continuing')
      }
    } else {
      console.warn('MONGODB_URI not set')
    }
    
    // Load routes on first request
    if (!routesLoaded) {
      console.log('Loading routes...')
      await loadRoutes()
      console.log('Routes loaded successfully')
    }
    
    // Handle the request
    console.log('Passing request to Express app')
    return app(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    console.error('Error type:', error?.constructor?.name || typeof error)
    console.error('Error message:', error?.message || String(error))
    console.error('Error stack:', error?.stack)
    console.error('Request URL:', req.url)
    console.error('Request Method:', req.method)
    
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: error?.message || String(error),
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error?.stack,
          type: error?.constructor?.name,
          details: error?.toString()
        })
      })
    }
  }
}
