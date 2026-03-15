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

// MongoDB connection handler - Serverless-optimized with global caching
const MONGODB_URI = process.env.MONGODB_URI

// CRITICAL: Disable Mongoose buffering globally BEFORE any connection
// This prevents commands from being queued if connection is not ready
mongoose.set('bufferCommands', false)

// Use global cache for serverless functions (persists across invocations in same container)
let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function ensureMongoConnection() {
  // Validate MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables')
  }

  // Already connected and ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB: Using existing connection')
    return cached.conn
  }

  // Connection in progress - wait for it
  if (cached.promise) {
    console.log('⏳ MongoDB: Waiting for existing connection promise...')
    try {
      await cached.promise
      return cached.conn
    } catch (error) {
      // If promise failed, reset and try again
      cached.promise = null
      throw error
    }
  }

  // Start new connection
  console.log('🔄 MongoDB: Establishing new connection...')
  
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 1, // Maintain at least 1 socket connection
    bufferMaxEntries: 0, // Disable buffering in connection options
    // Note: bufferCommands is set globally above via mongoose.set()
  }

  cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
    .then((mongooseInstance) => {
      console.log('✅ MongoDB: Connected successfully')
      console.log('🔍 Connection readyState after connect:', mongoose.connection.readyState)
      cached.conn = mongooseInstance
      cached.promise = null
      
      // CRITICAL: Wait for connection to be fully ready
      return new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
          console.log('✅ Connection immediately ready')
          resolve(mongooseInstance)
          return
        }
        
        // Wait for 'connected' event
        const timeout = setTimeout(() => {
          mongoose.connection.removeListener('connected', onConnected)
          mongoose.connection.removeListener('error', onError)
          reject(new Error('Connection timeout - readyState never became 1'))
        }, 5000)
        
        const onConnected = () => {
          clearTimeout(timeout)
          console.log('✅ Connection event fired, readyState:', mongoose.connection.readyState)
          mongoose.connection.removeListener('error', onError)
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
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB: Connection error:', err.message)
        cached.conn = null
        cached.promise = null
      })

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB: Disconnected')
        cached.conn = null
        cached.promise = null
      })

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB: Reconnected')
      })
      
      return mongooseInstance
    })
    .catch((error) => {
      console.error('❌ MongoDB: Connection failed:', error.message)
      console.error('Connection error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      })
      cached.promise = null
      cached.conn = null
      throw error
    })

  try {
    const result = await cached.promise
    return result
  } catch (error) {
    throw error
  }
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
      
      // Add error handling middleware after routes
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
      
      // Add 404 handler after routes are mounted (must be last)
      app.use((req, res) => {
        res.status(404).json({ 
          message: 'Route not found',
          path: req.path,
          method: req.method
        })
      })
      
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

// Error handling middleware - will be added after routes are loaded
// This is a placeholder - actual error handler is added in loadRoutes()

// Vercel Serverless Function handler
export default async function handler(req, res) {
  // CRITICAL: MongoDB connection MUST happen FIRST, before ANY Express routing
  try {
    console.log('🚀 [HANDLER] Called:', req.method, req.url)
    console.log('🚀 [HANDLER] MONGODB_URI exists:', !!MONGODB_URI)
    console.log('🚀 [HANDLER] Initial connection state:', mongoose.connection.readyState)
    
    // CRITICAL: Ensure MongoDB connection BEFORE loading routes
    // Routes will execute queries immediately, so connection must be ready
    if (!MONGODB_URI) {
      console.error('❌ [HANDLER] MONGODB_URI not set in environment variables')
      if (!res.headersSent) {
        return res.status(500).json({
          message: 'Server configuration error',
          error: 'MONGODB_URI environment variable is not set'
        })
      }
      return
    }

    // Wait for MongoDB connection - this MUST complete before routes are loaded
    console.log('🔍 [HANDLER] Checking MongoDB connection state:', mongoose.connection.readyState)
    console.log('🔍 [HANDLER] About to call ensureMongoConnection()...')
    
    try {
      console.log('🔄 [HANDLER] Starting MongoDB connection...')
      const connection = await ensureMongoConnection()
      console.log('✅ [HANDLER] ensureMongoConnection() completed, connection:', !!connection)
      console.log('✅ [HANDLER] Connection state after ensureMongoConnection:', mongoose.connection.readyState)
      
      // CRITICAL: Verify connection is actually ready (readyState === 1)
      // Wait a bit more if connection promise resolved but state is not ready
      let retries = 0
      const maxRetries = 50 // 5 seconds total (50 * 100ms)
      while (mongoose.connection.readyState !== 1 && retries < maxRetries) {
        console.log(`⏳ Waiting for connection readyState (current: ${mongoose.connection.readyState}, attempt ${retries + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      const finalState = mongoose.connection.readyState
      console.log(`🔍 Final connection state: ${finalState}`)
      
      if (finalState !== 1) {
        const errorMsg = `MongoDB connection not ready after waiting. State: ${finalState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
        console.error('❌', errorMsg)
        throw new Error(errorMsg)
      }
      
      console.log('✅ [HANDLER] MongoDB connection verified and ready (readyState=1) before route handling')
    } catch (connectionError) {
      console.error('❌ [HANDLER] MongoDB connection failed:', connectionError.message)
      console.error('❌ [HANDLER] Connection state:', mongoose.connection.readyState)
      console.error('❌ [HANDLER] Connection error name:', connectionError.name)
      console.error('❌ [HANDLER] Connection error stack:', connectionError.stack)
      if (!res.headersSent) {
        return res.status(503).json({
          message: 'Database connection failed',
          error: 'Unable to connect to database. Please try again later.',
          ...(process.env.NODE_ENV === 'development' && {
            details: connectionError.message,
            state: mongoose.connection.readyState,
            name: connectionError.name
          })
        })
      }
      return
    }
    
    // Load routes on first request (MongoDB is now connected)
    if (!routesLoaded) {
      console.log('📦 [HANDLER] Loading routes...')
      await loadRoutes()
      console.log('✅ [HANDLER] Routes loaded successfully')
    }
    
    // CRITICAL: Verify connection is still active before handling request
    const connectionStateBeforeRequest = mongoose.connection.readyState
    console.log(`🔍 [HANDLER] Connection state before request handling: ${connectionStateBeforeRequest}`)
    
    if (connectionStateBeforeRequest !== 1) {
      console.warn(`⚠️ MongoDB connection not ready (state: ${connectionStateBeforeRequest}), attempting reconnect...`)
      try {
        await ensureMongoConnection()
        // Wait for connection to be ready
        let reconnectRetries = 0
        while (mongoose.connection.readyState !== 1 && reconnectRetries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          reconnectRetries++
        }
        
        if (mongoose.connection.readyState !== 1) {
          throw new Error(`Reconnection failed. State: ${mongoose.connection.readyState}`)
        }
        console.log('✅ Reconnection successful')
      } catch (reconnectError) {
        console.error('❌ Reconnection failed:', reconnectError.message)
        if (!res.headersSent) {
          return res.status(503).json({
            message: 'Database connection lost',
            error: 'Unable to reconnect to database',
            ...(process.env.NODE_ENV === 'development' && {
              state: mongoose.connection.readyState
            })
          })
        }
        return
      }
    }
    
    // Final verification before passing to Express
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ CRITICAL: Connection not ready before Express handler')
      if (!res.headersSent) {
        return res.status(503).json({
          message: 'Database not ready',
          error: 'Database connection is not ready to handle requests'
        })
      }
      return
    }
    
    console.log('✅ [HANDLER] Passing request to Express app (connection ready)')
    console.log('🔍 [HANDLER] Final connection state before Express:', mongoose.connection.readyState)
    
    // CRITICAL: Ensure connection is ready one more time
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ CRITICAL ERROR: Connection not ready right before Express!')
      if (!res.headersSent) {
        return res.status(503).json({
          message: 'Database connection lost',
          error: 'Database connection is not ready',
          state: mongoose.connection.readyState
        })
      }
      return
    }
    
    // Handle the request - wrap in try-catch to catch any async errors
    try {
      return await new Promise((resolve, reject) => {
        // Set timeout to catch if Express doesn't respond
        const timeout = setTimeout(() => {
          if (!res.headersSent) {
            console.error('❌ Express handler timeout')
            reject(new Error('Express handler timeout'))
          }
        }, 30000)
        
        // Handle Express response
        const originalEnd = res.end.bind(res)
        res.end = function(...args) {
          clearTimeout(timeout)
          originalEnd(...args)
          resolve()
        }
        
        // Call Express app
        app(req, res)
      })
    } catch (expressError) {
      console.error('❌ Express handler error:', expressError)
      throw expressError
    }
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
