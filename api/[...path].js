// Set Vercel environment variable before any imports
process.env.VERCEL = '1'

// Simple handler that imports server only when needed
let app = null
let handler = null

async function initApp() {
  if (app && handler) {
    return handler
  }

  try {
    console.log('[Vercel] Starting initialization...')
    
    // Import serverless-http
    const serverless = (await import('serverless-http')).default
    console.log('[Vercel] serverless-http loaded')
    
    // Import server app
    const serverModule = await import('../backend/server.js')
    app = serverModule.default
    console.log('[Vercel] Server app loaded')
    
    // Create handler
    handler = serverless(app, {
      binary: ['image/*', 'video/*', 'application/pdf']
    })
    console.log('[Vercel] Handler created')
    
    return handler
  } catch (error) {
    console.error('[Vercel] Initialization error:', error)
    throw error
  }
}

export default async (req, res) => {
  const startTime = Date.now()
  
  // Fix path from Vercel [...path] routing
  if (req.query && req.query['...path']) {
    const pathParam = req.query['...path']
    delete req.query['...path']
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString() 
      : ''
    req.url = `/api/${pathParam}${queryString}`
    req.originalUrl = req.url
  }
  
  console.log(`[Vercel] ${req.method} ${req.url} - Start`)
  
  try {
    // Initialize handler with timeout
    const handlerInstance = await Promise.race([
      initApp(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Init timeout')), 15000)
      )
    ])
    
    console.log(`[Vercel] Handler ready in ${Date.now() - startTime}ms, processing request...`)
    
    // Process request with timeout
    const result = await Promise.race([
      handlerInstance(req, res),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 25000)
      )
    ])
    
    console.log(`[Vercel] Request completed in ${Date.now() - startTime}ms`)
    return result
  } catch (error) {
    console.error(`[Vercel] Error after ${Date.now() - startTime}ms:`, error.message)
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Server error',
        error: error.message,
        time: Date.now() - startTime
      })
    }
  }
}
