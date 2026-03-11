// Set Vercel environment variable before any imports
process.env.VERCEL = '1'

// Cache for handler
let handler = null
let initPromise = null

async function getHandler() {
  // Return cached handler if available
  if (handler) {
    return handler
  }
  
  // Wait for ongoing initialization
  if (initPromise) {
    return initPromise
  }
  
  // Start initialization
  initPromise = (async () => {
    try {
      console.log('[Vercel] Initializing...')
      
      // Import serverless-http
      const { default: serverless } = await import('serverless-http')
      console.log('[Vercel] serverless-http imported')
      
      // Import server - this might take time
      const { default: app } = await import('../backend/server.js')
      console.log('[Vercel] server.js imported')
      
      // Create handler
      handler = serverless(app, {
        binary: ['image/*', 'video/*', 'application/pdf']
      })
      console.log('[Vercel] Handler created')
      
      return handler
    } catch (error) {
      console.error('[Vercel] Init error:', error)
      initPromise = null
      throw error
    }
  })()
  
  return initPromise
}

export default async (req, res) => {
  const start = Date.now()
  
  // Fix path from Vercel [...path] routing
  if (req.query?.['...path']) {
    const pathParam = req.query['...path']
    delete req.query['...path']
    const query = new URLSearchParams(req.query).toString()
    req.url = `/api/${pathParam}${query ? '?' + query : ''}`
    req.originalUrl = req.url
  }
  
  console.log(`[Vercel] ${req.method} ${req.url}`)
  
  try {
    // Get handler with timeout
    const handlerInstance = await Promise.race([
      getHandler(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler init timeout')), 20000)
      )
    ])
    
    console.log(`[Vercel] Handler ready (${Date.now() - start}ms)`)
    
    // Track if response was sent
    let responseSent = false
    const originalEnd = res.end.bind(res)
    res.end = function(...args) {
      responseSent = true
      console.log(`[Vercel] Response sent (${Date.now() - start}ms)`)
      return originalEnd(...args)
    }
    
    // Process request with timeout
    const handlerPromise = handlerInstance(req, res)
    
    await Promise.race([
      handlerPromise,
      new Promise((_, reject) => 
        setTimeout(() => {
          if (!responseSent) {
            console.error(`[Vercel] Request timeout after ${Date.now() - start}ms, responseSent: ${responseSent}`)
            reject(new Error('Request timeout'))
          }
        }, 25000)
      )
    ])
    
    console.log(`[Vercel] Done (${Date.now() - start}ms), responseSent: ${responseSent}`)
  } catch (error) {
    console.error(`[Vercel] Error (${Date.now() - start}ms):`, error.message)
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message
      })
    }
  }
}
