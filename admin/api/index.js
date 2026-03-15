/**
 * Vercel Serverless Function Entry Point
 * 
 * This file handles the Express app as a serverless function.
 * Uses dynamic import() to properly load ES Modules in Vercel's environment.
 * 
 * Vercel will call this handler for all requests matching /api/*
 * 
 * ✅ ES Module Compatibility: This file uses dynamic import() to avoid ERR_REQUIRE_ESM errors
 * ✅ Caching: App instance is cached to optimize cold starts
 * ✅ Error Handling: Comprehensive error handling with fallback responses
 */

// Cache the app instance to avoid re-importing on every request (cold start optimization)
let appInstance = null
let appPromise = null

/**
 * Initialize and return the Express app instance
 * Uses dynamic import for ES Module compatibility with Vercel Serverless Functions
 * 
 * This function prevents ERR_REQUIRE_ESM errors by using dynamic import() instead of require()
 */
async function getApp() {
  // Return cached instance if available
  if (appInstance) {
    console.log('✅ [ESM] Using cached Express app instance')
    return appInstance
  }

  // If already loading, wait for that promise
  if (appPromise) {
    console.log('⏳ [ESM] Waiting for Express app to finish loading...')
    return appPromise
  }

  // Start loading the app
  console.log('🔄 [ESM] Starting dynamic import of Express app from backend/server.js...')
  appPromise = (async () => {
    try {
      // Dynamic import for ES Modules - required for Vercel Serverless Functions
      // This ensures compatibility even if Vercel's runtime initially treats files as CommonJS
      // ✅ This prevents ERR_REQUIRE_ESM: require() of ES Module not supported
      const module = await import('../backend/server.js')
      appInstance = module.default
      appPromise = null // Clear promise after successful load
      console.log('✅ [ESM] Successfully imported Express app using dynamic import()')
      console.log('✅ [ESM] Express app is ready to handle requests')
      return appInstance
    } catch (error) {
      appPromise = null // Clear promise on error to allow retry
      console.error('❌ [ESM] Failed to import Express app:', error)
      console.error('❌ [ESM] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      
      // Check if it's an ERR_REQUIRE_ESM error
      if (error.code === 'ERR_REQUIRE_ESM' || error.message.includes('require() of ES Module')) {
        console.error('❌ [ESM] ERR_REQUIRE_ESM detected - This should not happen with dynamic import()')
        console.error('❌ [ESM] Possible causes:')
        console.error('   1. backend/server.js is not properly configured as ES Module')
        console.error('   2. backend/package.json missing "type": "module"')
        console.error('   3. Circular dependency issue')
      }
      
      throw error
    }
  })()

  return appPromise
}

/**
 * Vercel Serverless Function Handler
 * 
 * This is the main handler that Vercel calls for each request.
 * It forwards the request to the Express app which handles routing, middleware, and responses.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export default async function handler(req, res) {
  const requestId = Date.now()
  console.log(`📥 [${requestId}] Incoming request: ${req.method} ${req.url}`)
  
  try {
    // Get the Express app instance (cached after first import)
    const app = await getApp()
    
    console.log(`✅ [${requestId}] Express app loaded, forwarding request to Express`)
    
    // Forward the request to Express
    // Express will handle routing, middleware, and responses
    return app(req, res)
  } catch (error) {
    console.error(`❌ [${requestId}] Serverless function error:`, error)
    console.error(`❌ [${requestId}] Error details:`, {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    })
    
    // Fallback error response if app initialization fails
    if (!res.headersSent) {
      const errorResponse = {
        message: 'Internal server error',
        requestId: requestId,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          stack: error.stack,
          code: error.code
        })
      }
      
      console.error(`❌ [${requestId}] Sending error response:`, errorResponse)
      res.status(500).json(errorResponse)
    }
  }
}
