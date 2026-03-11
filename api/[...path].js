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
  // Vercel passes the path via query parameter '...path'
  if (req.query && req.query['...path']) {
    const pathParam = req.query['...path']
    delete req.query['...path']
    
    // Rebuild query string without ...path
    const remainingQuery = Object.keys(req.query).length > 0
      ? '?' + new URLSearchParams(req.query).toString()
      : ''
    
    // Set the correct path
    req.url = `/api/${pathParam}${remainingQuery}`
    req.originalUrl = req.url
    req.path = `/api/${pathParam}`
    console.log(`[Vercel] Fixed path from query param: ${req.url}`)
  } else {
    // If no ...path query param, use the URL directly
    // Vercel might pass the path in the URL itself
    if (req.url && !req.url.startsWith('/api/')) {
      // If URL doesn't start with /api/, add it
      req.url = `/api${req.url}`
      req.originalUrl = req.url
      // Update path to match
      if (req.path && !req.path.startsWith('/api/')) {
        req.path = `/api${req.path}`
      }
      console.log(`[Vercel] Added /api prefix: ${req.url}`)
    } else if (req.url && req.url.startsWith('/api/')) {
      // URL already has /api/, just ensure path matches
      req.originalUrl = req.url
      if (req.path !== req.url.split('?')[0]) {
        req.path = req.url.split('?')[0]
      }
      console.log(`[Vercel] URL already has /api/: ${req.url}`)
    }
  }
  
  console.log(`[Vercel] Final: ${req.method} ${req.url}, path: ${req.path}, originalUrl: ${req.originalUrl}`)
  
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
      return originalWriteHead.apply(this, args)
    }
    
    // Also track json() and send() calls
    const originalJson = res.json.bind(res)
    const originalSend = res.send.bind(res)
    
    res.json = function(...args) {
      if (!responseSent) {
        responseSent = true
        console.log(`[Vercel] Response json() called (${Date.now() - start}ms)`)
      }
      return originalJson.apply(this, args)
    }
    
    res.send = function(...args) {
      if (!responseSent) {
        responseSent = true
        console.log(`[Vercel] Response send() called (${Date.now() - start}ms)`)
      }
      return originalSend.apply(this, args)
    }
    
    // Process request
    try {
      const handlerResult = await handlerInstance(req, res)
      console.log(`[Vercel] Handler returned (${Date.now() - start}ms)`)
      console.log(`[Vercel] Handler result:`, handlerResult ? JSON.stringify(handlerResult).substring(0, 200) : 'null/undefined')
      console.log(`[Vercel] Response sent: ${responseSent}, headersSent: ${res.headersSent}`)
      
      // serverless-http returns Lambda-formatted response
      // Check if response was already sent via res object
      if (responseSent || res.headersSent) {
        console.log(`[Vercel] Response already sent via res object`)
        return // Response already sent, we're done
      }
      
      // If we got a Lambda-formatted result, send it
      if (handlerResult && handlerResult.statusCode) {
        console.log(`[Vercel] Sending Lambda-formatted response`)
        
        // Extract response from Lambda format
        const statusCode = handlerResult.statusCode || 200
        const headers = handlerResult.headers || {}
        const body = handlerResult.body || ''
        
        // Set status code
        res.status(statusCode)
        
        // Set headers (skip some that Vercel handles)
        const skipHeaders = ['date', 'etag', 'connection']
        Object.keys(headers).forEach(key => {
          if (!skipHeaders.includes(key.toLowerCase())) {
            res.setHeader(key, headers[key])
          }
        })
        
        // Send body
        if (typeof body === 'string') {
          try {
            // Try to parse as JSON if content-type is json
            if (headers['content-type'] && headers['content-type'].includes('application/json')) {
              const parsedBody = JSON.parse(body)
              res.json(parsedBody)
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
        return
      }
      
      // If no response was sent and no handler result, send error
      if (!responseSent && !res.headersSent) {
        console.error(`[Vercel] No response sent, sending error`)
        res.status(500).json({ 
          message: 'No response from server',
          error: 'Handler completed but no response was sent',
          handlerResult: handlerResult ? 'exists' : 'null/undefined'
        })
      }
    } catch (error) {
      console.error(`[Vercel] Handler error (${Date.now() - start}ms):`, error.message)
      console.error(`[Vercel] Error stack:`, error.stack)
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
