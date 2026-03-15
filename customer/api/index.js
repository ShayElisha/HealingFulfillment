// Vercel Serverless Function - ES Module compatible wrapper
// This file must use ONLY ES module syntax - no CommonJS patterns

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Initialize dotenv first
dotenv.config()

// CRITICAL: Disable Mongoose buffering globally BEFORE any connection
mongoose.set('bufferCommands', false)

// MongoDB connection handler - Serverless-optimized with global caching
const MONGODB_URI = process.env.MONGODB_URI

// Use global cache for serverless functions (persists across invocations in same container)
let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  console.log('🔌 [DB] connectDB() called')
  console.log('🔌 [DB] MONGODB_URI exists:', !!MONGODB_URI)
  console.log('🔌 [DB] Current readyState:', mongoose.connection.readyState)
  console.log('🔌 [DB] Cached conn exists:', !!cached.conn)
  console.log('🔌 [DB] Cached promise exists:', !!cached.promise)
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  // Return cached connection if available and ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log('✅ [DB] Using cached connection')
    return cached.conn
  }

  // Wait for existing connection promise
  if (cached.promise) {
    console.log('⏳ [DB] Waiting for existing connection promise...')
    try {
      await cached.promise
      if (mongoose.connection.readyState === 1) {
        console.log('✅ [DB] Existing promise resolved, connection ready')
        return cached.conn
      } else {
        console.warn('⚠️ [DB] Existing promise resolved but readyState is not 1:', mongoose.connection.readyState)
        cached.promise = null
        cached.conn = null
      }
    } catch (error) {
      console.error('❌ [DB] Existing promise failed:', error.message)
      cached.promise = null
      cached.conn = null
      throw error
    }
  }

  // Start new connection
  console.log('🔄 [DB] Starting new MongoDB connection...')
  
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    bufferMaxEntries: 0,
  }

  cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
    .then((mongooseInstance) => {
      console.log('✅ [DB] mongoose.connect() resolved')
      console.log('🔍 [DB] readyState after connect:', mongoose.connection.readyState)
      
      // Wait for 'connected' event to ensure connection is fully ready
      return new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
          console.log('✅ [DB] Connection immediately ready')
          cached.conn = mongooseInstance
          cached.promise = null
          resolve(mongooseInstance)
          return
        }
        
        const timeout = setTimeout(() => {
          mongoose.connection.removeListener('connected', onConnected)
          mongoose.connection.removeListener('error', onError)
          reject(new Error('Connection timeout - readyState never became 1'))
        }, 10000)
        
        const onConnected = () => {
          clearTimeout(timeout)
          console.log('✅ [DB] Connected event fired, readyState:', mongoose.connection.readyState)
          mongoose.connection.removeListener('error', onError)
          cached.conn = mongooseInstance
          cached.promise = null
          resolve(mongooseInstance)
        }
        
        const onError = (err) => {
          clearTimeout(timeout)
          mongoose.connection.removeListener('connected', onConnected)
          reject(err)
        }
        
        mongoose.connection.once('connected', onConnected)
        mongoose.connection.once('error', onError)
      })
    })
    .then((mongooseInstance) => {
      // Set up event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ [DB] Connection error:', err.message)
        cached.conn = null
        cached.promise = null
      })

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ [DB] Disconnected')
        cached.conn = null
        cached.promise = null
      })

      mongoose.connection.on('reconnected', () => {
        console.log('✅ [DB] Reconnected')
      })
      
      console.log('✅ [DB] Connection fully established and ready')
      return mongooseInstance
    })
    .catch((error) => {
      console.error('❌ [DB] Connection failed:', error.message)
      cached.promise = null
      cached.conn = null
      throw error
    })

  try {
    const result = await cached.promise
    console.log('✅ [DB] connectDB() completed successfully, readyState:', mongoose.connection.readyState)
    return result
  } catch (error) {
    console.error('❌ [DB] connectDB() failed:', error.message)
    throw error
  }
}

// Create Express app
const app = express()

// Basic CORS
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
      console.log('📦 [ROUTES] Loading routes...')
      
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
      
      for (const [name, route] of Object.entries(routes)) {
        if (!route) {
          throw new Error(`Route ${name} does not have a default export`)
        }
      }
      
      app.use('/api/auth', routes.auth)
      app.use('/api/booking', routes.booking)
      app.use('/api/contact', routes.contact)
      app.use('/api/reviews', routes.reviews)
      app.use('/api/courses', routes.courses)
      app.use('/api/categories', routes.categories)
      app.use('/api/purchases', routes.purchases)
      app.use('/api/messages', routes.messages)
      
      app.use((err, req, res, next) => {
        console.error('❌ [EXPRESS] Error:', err.message)
        if (!res.headersSent) {
          res.status(err.status || 500).json({
            message: err.message || 'Internal server error'
          })
        }
      })
      
      app.use((req, res) => {
        res.status(404).json({ 
          message: 'Route not found',
          path: req.path,
          method: req.method
        })
      })
      
      routesLoaded = true
      console.log('✅ [ROUTES] All routes loaded successfully')
    } catch (error) {
      console.error('❌ [ROUTES] Error loading routes:', error.message)
      routesLoadPromise = null
      throw error
    }
  })()
  
  return routesLoadPromise
}

// Vercel Serverless Function handler
export default async function handler(req, res) {
  try {
    console.log('🚀 [HANDLER] ========================================')
    console.log('🚀 [HANDLER] Request:', req.method, req.url)
    console.log('🚀 [HANDLER] MONGODB_URI exists:', !!MONGODB_URI)
    console.log('🚀 [HANDLER] Initial readyState:', mongoose.connection.readyState)
    
    // CRITICAL: Connect to MongoDB FIRST, before anything else
    if (!MONGODB_URI) {
      console.error('❌ [HANDLER] MONGODB_URI not set')
      return res.status(500).json({
        message: 'Server configuration error',
        error: 'MONGODB_URI environment variable is not set'
      })
    }

    console.log('🔄 [HANDLER] Connecting to MongoDB...')
    await connectDB()
    
    // Verify connection is ready
    const connectionState = mongoose.connection.readyState
    console.log('🔍 [HANDLER] Connection state after connectDB():', connectionState)
    
    if (connectionState !== 1) {
      console.error('❌ [HANDLER] Connection not ready after connectDB(), state:', connectionState)
      return res.status(503).json({
        message: 'Database connection failed',
        error: 'Unable to establish database connection',
        state: connectionState
      })
    }
    
    console.log('✅ [HANDLER] MongoDB connection verified and ready')
    
    // Load routes (MongoDB is now connected)
    if (!routesLoaded) {
      console.log('📦 [HANDLER] Loading routes...')
      await loadRoutes()
      console.log('✅ [HANDLER] Routes loaded')
    }
    
    // Final verification before Express
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [HANDLER] Connection lost before Express, state:', mongoose.connection.readyState)
      return res.status(503).json({
        message: 'Database connection lost',
        error: 'Database connection is not ready'
      })
    }
    
    console.log('✅ [HANDLER] Passing to Express (readyState=1)')
    
    // Handle request with Express
    return app(req, res)
  } catch (error) {
    console.error('❌ [HANDLER] Error:', error.message)
    console.error('❌ [HANDLER] Stack:', error.stack)
    
    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Internal server error',
        error: error.message
      })
    }
  }
}
