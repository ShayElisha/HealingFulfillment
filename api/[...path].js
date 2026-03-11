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
  
  // Log original request details
  console.log(`[Vercel] Original: ${req.method} ${req.url}`)
  console.log(`[Vercel] Query:`, JSON.stringify(req.query))
  console.log(`[Vercel] Path:`, req.path)
  
  // Fix path from Vercel [...path] routing
  if (req.query?.['...path']) {
    const pathParam = req.query['...path']
    delete req.query['...path']
    const query = new URLSearchParams(req.query).toString()
    req.url = `/api/${pathParam}${query ? '?' + query : ''}`
    req.originalUrl = req.url
    req.path = `/api/${pathParam}`
    console.log(`[Vercel] Fixed path to: ${req.url}`)
  } else {
    // If no ...path query param, check if URL already has /api/
    if (!req.url.startsWith('/api/')) {
      req.url = `/api${req.url}`
      req.originalUrl = req.url
      req.path = `/api${req.path}`
      console.log(`[Vercel] Added /api prefix: ${req.url}`)
    }
  }
  
  console.log(`[Vercel] Final: ${req.method} ${req.url}, path: ${req.path}`)
  
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
    
    // Process request with proper promise handling
    try {
      // Wrap handler call in Promise to ensure it completes
      const handlerResult = await new Promise((resolve, reject) => {
        // Set timeout
        const timeout = setTimeout(() => {
          if (!responseSent && !res.headersSent) {
            console.error(`[Vercel] Handler timeout after ${Date.now() - start}ms`)
            reject(new Error('Handler timeout'))
          }
        }, 25000)
        
        // Call handler
        const handlerPromise = handlerInstance(req, res)
        
        // Handle handler promise
        handlerPromise
          .then((result) => {
            clearTimeout(timeout)
            console.log(`[Vercel] Handler promise resolved (${Date.now() - start}ms), responseSent: ${responseSent}`)
            resolve(result)
          })
          .catch((error) => {
            clearTimeout(timeout)
            console.error(`[Vercel] Handler promise rejected (${Date.now() - start}ms):`, error.message)
            reject(error)
          })
        
        // Also check if response was sent (in case handler doesn't return promise properly)
        const checkInterval = setInterval(() => {
          if (responseSent || res.headersSent) {
            clearTimeout(timeout)
            clearInterval(checkInterval)
            console.log(`[Vercel] Response detected via polling (${Date.now() - start}ms)`)
            resolve(null)
          }
        }, 100)
        
        // Clear interval after timeout
        setTimeout(() => clearInterval(checkInterval), 25000)
      })
      
      console.log(`[Vercel] Handler completed (${Date.now() - start}ms), responseSent: ${responseSent}`)
      
      // If response wasn't sent, send error
      if (!responseSent && !res.headersSent) {
        console.error(`[Vercel] Response not sent, sending error`)
        res.status(500).json({ 
          message: 'No response from server',
          error: 'Handler completed but no response was sent'
        })
      }
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
