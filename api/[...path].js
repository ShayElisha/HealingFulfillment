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
    const originalWriteHead = res.writeHead.bind(res)
    
    res.end = function(...args) {
      if (!responseSent) {
        responseSent = true
        console.log(`[Vercel] Response end called (${Date.now() - start}ms)`)
      }
      return originalEnd(...args)
    }
    
    res.writeHead = function(...args) {
      if (!responseSent) {
        responseSent = true
        console.log(`[Vercel] Response writeHead called (${Date.now() - start}ms)`)
      }
      return originalWriteHead(...args)
    }
    
    // Process request
    try {
      const result = await handlerInstance(req, res)
      console.log(`[Vercel] Handler returned (${Date.now() - start}ms), responseSent: ${responseSent}`)
      
      // If handler returned a result but response wasn't sent, send it
      if (result && !responseSent && !res.headersSent) {
        console.log(`[Vercel] Sending handler result as response`)
        res.json(result)
      }
      
      // Set timeout to ensure response is sent
      setTimeout(() => {
        if (!responseSent && !res.headersSent) {
          console.error(`[Vercel] Timeout: response not sent after ${Date.now() - start}ms`)
          if (!res.headersSent) {
            res.status(500).json({ 
              message: 'Request timeout',
              error: 'Response was not sent in time'
            })
          }
        }
      }, 25000)
    } catch (error) {
      console.error(`[Vercel] Handler error (${Date.now() - start}ms):`, error.message)
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Server error',
          error: error.message
        })
      }
    }
    
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
