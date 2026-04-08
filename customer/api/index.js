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
  console.log('🔌 [DB] ========================================')
  console.log('🔌 [DB] connectDB() called')
  console.log('🔌 [DB] MONGODB_URI exists:', !!MONGODB_URI)
  console.log('🔌 [DB] Current readyState:', mongoose.connection.readyState, {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[mongoose.connection.readyState])
  console.log('🔌 [DB] Cached conn exists:', !!cached.conn)
  console.log('🔌 [DB] Cached promise exists:', !!cached.promise)
  console.log('🔌 [DB] bufferCommands setting:', mongoose.get('bufferCommands'))
  
  if (!MONGODB_URI) {
    const error = new Error('MONGODB_URI is not defined in environment variables')
    error.name = 'ConfigurationError'
    error.statusCode = 500
    throw error
  }

  // Validate MONGODB_URI format
  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    const error = new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://')
    error.name = 'ConfigurationError'
    error.statusCode = 500
    throw error
  }

  // Validate URI includes database name and recommended options
  const uriParts = MONGODB_URI.split('/')
  const hasDatabase = uriParts.length > 3 && uriParts[3] && !uriParts[3].includes('@')
  const hasRetryWrites = MONGODB_URI.includes('retryWrites=true')
  const hasWMajority = MONGODB_URI.includes('w=majority')
  
  console.log('🔍 [DB] URI validation:', {
    hasDatabase,
    hasRetryWrites,
    hasWMajority,
    databaseName: hasDatabase ? uriParts[3].split('?')[0] : 'not found'
  })
  
  if (!hasDatabase) {
    console.warn('⚠️ [DB] MONGODB_URI may be missing database name')
    console.warn('⚠️ [DB] Recommended format: mongodb+srv://user:pass@cluster.mongodb.net/database?retryWrites=true&w=majority')
  }
  
  if (!hasRetryWrites || !hasWMajority) {
    console.warn('⚠️ [DB] MONGODB_URI missing recommended options')
    console.warn('⚠️ [DB] Recommended: Add ?retryWrites=true&w=majority to connection string')
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
  console.log('🔍 [DB] MONGODB_URI format check:', {
    hasDatabase: MONGODB_URI.includes('/') && MONGODB_URI.split('/').length > 3,
    hasRetryWrites: MONGODB_URI.includes('retryWrites=true'),
    hasWMajority: MONGODB_URI.includes('w=majority')
  })
  
  // Connection options - only supported options
  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // 30 seconds to select server
    socketTimeoutMS: 45000, // 45 seconds socket timeout
    maxPoolSize: 10, // Maximum number of connections in pool
    minPoolSize: 1, // Minimum number of connections in pool
    // Note: bufferMaxEntries is deprecated - use mongoose.set('bufferCommands', false) instead
    // Note: bufferCommands is set globally above via mongoose.set()
  }
  
  console.log('🔍 [DB] Connection options:', JSON.stringify(connectionOptions, null, 2))

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
    const finalReadyState = mongoose.connection.readyState
    console.log('✅ [DB] connectDB() completed successfully')
    console.log('🔍 [DB] Final readyState:', finalReadyState, {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[finalReadyState])
    console.log('🔍 [DB] Connection details:', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      readyState: finalReadyState
    })
    return result
  } catch (error) {
    console.error('❌ [DB] connectDB() failed')
    console.error('❌ [DB] Error name:', error.name)
    console.error('❌ [DB] Error message:', error.message)
    console.error('❌ [DB] Error stack:', error.stack)
    console.error('❌ [DB] Connection state at error:', mongoose.connection.readyState)
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

// Database connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const connectionInfo = {
      readyState: mongoose.connection.readyState,
      readyStateText: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }[mongoose.connection.readyState] || 'unknown',
      hasMongoDBUri: !!MONGODB_URI,
      mongoDBUriPrefix: MONGODB_URI ? MONGODB_URI.substring(0, 30) + '...' : 'not set',
      cachedConnection: !!cached.conn,
      cachedPromise: !!cached.promise,
      host: mongoose.connection.host || 'N/A',
      port: mongoose.connection.port || 'N/A',
      name: mongoose.connection.name || 'N/A'
    }

    // Try to connect if not connected
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 [TEST-DB] Attempting connection...')
      try {
        await connectDB()
        connectionInfo.connectionAttempt = 'success'
        connectionInfo.finalReadyState = mongoose.connection.readyState
        connectionInfo.finalReadyStateText = {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting'
        }[mongoose.connection.readyState] || 'unknown'
      } catch (error) {
        connectionInfo.connectionAttempt = 'failed'
        connectionInfo.connectionError = error.message
        connectionInfo.connectionErrorName = error.name
        return res.status(503).json({
          status: 'error',
          message: 'Database connection test failed',
          connectionInfo,
          error: error.message,
          errorName: error.name
        })
      }
    }

    // Try a simple query to verify connection works
    try {
      const testResult = await mongoose.connection.db.admin().ping()
      connectionInfo.pingTest = 'success'
      connectionInfo.pingResult = testResult
    } catch (pingError) {
      connectionInfo.pingTest = 'failed'
      connectionInfo.pingError = pingError.message
    }

    res.json({
      status: 'success',
      message: 'Database connection test completed',
      connectionInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ [TEST-DB] Error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Database test endpoint error',
      error: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
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
        messagesModule,
        leadsModule,
        forWhomAudienceModule
      ] = await Promise.all([
        import('../backend/routes/auth.js'),
        import('../backend/routes/booking.js'),
        import('../backend/routes/contact.js'),
        import('../backend/routes/reviews.js'),
        import('../backend/routes/courses.js'),
        import('../backend/routes/categories.js'),
        import('../backend/routes/purchases.js'),
        import('../backend/routes/messages.js'),
        import('../backend/routes/leads.js'),
        import('../backend/routes/forWhomAudience.js')
      ])
      
      const routes = {
        auth: authModule.default,
        booking: bookingModule.default,
        contact: contactModule.default,
        reviews: reviewsModule.default,
        courses: coursesModule.default,
        categories: categoriesModule.default,
        purchases: purchasesModule.default,
        messages: messagesModule.default,
        leads: leadsModule.default,
        forWhomAudience: forWhomAudienceModule.default
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
      app.use('/api/leads', routes.leads)
      app.use('/api', routes.forWhomAudience)
      
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
    console.error('❌ [HANDLER] Error name:', error.name)
    console.error('❌ [HANDLER] Stack:', error.stack)
    
    if (!res.headersSent) {
      // Determine appropriate status code
      let statusCode = 500
      if (error.name === 'ConfigurationError' || error.statusCode === 500) {
        statusCode = 500
      } else if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
        statusCode = 503 // Service Unavailable for DB errors
      } else if (error.statusCode) {
        statusCode = error.statusCode
      }

      return res.status(statusCode).json({
        message: error.message || 'Internal server error',
        error: error.message,
        errorName: error.name,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          connectionState: mongoose.connection.readyState
        })
      })
    }
  }
}
