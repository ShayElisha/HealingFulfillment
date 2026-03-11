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
    
    // Process request
    try {
      const handlerResult = await handlerInstance(req, res)
      console.log(`[Vercel] Handler returned (${Date.now() - start}ms), responseSent: ${responseSent}`)
      
      // serverless-http returns Lambda-formatted response
      // If we got a result and response wasn't sent via res object, send it manually
      if (handlerResult && !responseSent && !res.headersSent) {
        console.log(`[Vercel] Sending Lambda-formatted response`)
        
        // Extract response from Lambda format
        const statusCode = handlerResult.statusCode || 200
        const headers = handlerResult.headers || {}
        const body = handlerResult.body || ''
        
        // Set status code
        res.status(statusCode)
        
        // Set headers
        Object.keys(headers).forEach(key => {
          res.setHeader(key, headers[key])
        })
        
        // Send body
        if (typeof body === 'string') {
          try {
            // Try to parse as JSON if content-type is json
            if (headers['content-type'] && headers['content-type'].includes('application/json')) {
              res.json(JSON.parse(body))
            } else {
              res.send(body)
            }
          } catch (e) {
            res.send(body)
          }
        } else {
          res.json(body)
        }
        
        console.log(`[Vercel] Response sent manually (${Date.now() - start}ms)`)
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
