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
      
      // Create handler with proper configuration for Vercel
      // CRITICAL: We need to preserve the HTTP method explicitly
      // In Vercel, the method comes in the event object, not in req.method initially
      handler = serverless(app, {
        binary: ['image/*', 'video/*', 'application/pdf'],
        request: (req, event, context) => {
          // CRITICAL: Preserve the HTTP method from the event
          // Vercel passes the method in event.httpMethod
          if (event && event.httpMethod) {
            req.method = event.httpMethod
            console.log(`[serverless-http] Setting method from event: ${event.httpMethod}`)
          }
          // Also check if method was already set and preserve it
          if (req.method && req.method !== event?.httpMethod && event?.httpMethod) {
            console.log(`[serverless-http] Method mismatch: req.method=${req.method}, event.httpMethod=${event.httpMethod}, using event`)
            req.method = event.httpMethod
          }
          return req
        }
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
  
  // Log immediately - this should always appear if the function is called
  console.log(`[Vercel] ===== FUNCTION CALLED =====`)
  console.log(`[Vercel] Timestamp: ${new Date().toISOString()}`)
  console.log(`[Vercel] Method: ${req.method}`)
  console.log(`[Vercel] URL: ${req.url}`)
  console.log(`[Vercel] Headers:`, JSON.stringify(req.headers).substring(0, 500))
  
  // For POST/PUT/PATCH requests, log body state
  // Don't read the body here - let Express middleware handle it
  // Reading the stream here would consume it and prevent Express from parsing it
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`[Vercel] Body state before handler:`, typeof req.body, req.body ? 'exists' : 'empty')
    console.log(`[Vercel] Content-Type:`, req.headers['content-type'])
    console.log(`[Vercel] Content-Length:`, req.headers['content-length'])
  }
  
  // Store original method before any modifications
  const originalMethod = req.method
  
  // Log original request details
  console.log(`[Vercel] ${req.method} ${req.url}`)
  console.log(`[Vercel] Original method: ${originalMethod}`)
  console.log(`[Vercel] Query:`, JSON.stringify(req.query))
  console.log(`[Vercel] Original path:`, req.path)
  console.log(`[Vercel] Original originalUrl:`, req.originalUrl)
  
  // Fix path from Vercel [...path] routing
  // Vercel passes the path via query parameter '...path' for catch-all routes
  let finalPath = null
  
  if (req.query && req.query['...path']) {
    // Path is in query parameter (catch-all route)
    // Vercel passes nested paths like "auth/login" as array or string
    let pathParam = null
    if (Array.isArray(req.query['...path'])) {
      // If it's an array, join with '/'
      pathParam = req.query['...path'].join('/')
    } else {
      // If it's a string, use as is
      pathParam = req.query['...path']
    }
    
    console.log(`[Vercel] Path param from query:`, pathParam, `(type: ${typeof pathParam}, isArray: ${Array.isArray(req.query['...path'])})`)
    
    delete req.query['...path']
    
    // Rebuild query string without ...path
    const remainingQuery = Object.keys(req.query).length > 0
      ? '?' + new URLSearchParams(req.query).toString()
      : ''
    
    // Ensure path starts with /api/
    if (pathParam && pathParam.startsWith('api/')) {
      // Already has api/, just add leading /
      finalPath = `/${pathParam}${remainingQuery}`
    } else if (pathParam) {
      // Add /api/ prefix
      finalPath = `/api/${pathParam}${remainingQuery}`
    } else {
      finalPath = `/api${remainingQuery}`
    }
    
    console.log(`[Vercel] Path from query param: ${finalPath}`)
  } else {
    // Path is in the URL itself
    // For Vercel [...path] routes, check multiple sources
    let urlToUse = null
    
    // Try req.url first
    if (req.url && req.url !== '/') {
      urlToUse = req.url
    }
    // Try req.path
    else if (req.path && req.path !== '/') {
      urlToUse = req.path
    }
    // Try req.originalUrl
    else if (req.originalUrl && req.originalUrl !== '/') {
      urlToUse = req.originalUrl
    }
    
    if (urlToUse) {
      // Remove query string to get clean path
      const urlPath = urlToUse.split('?')[0]
      
      if (urlPath.startsWith('/api/')) {
        // Already has /api/, use as is
        finalPath = urlToUse // Keep query string if exists
        console.log(`[Vercel] Path from URL (has /api/): ${finalPath}`)
      } else if (urlPath === '/api' || urlPath === '/api/') {
        // Just /api, this is wrong - should not happen
        console.error(`[Vercel] Invalid path: ${urlToUse}`)
        finalPath = null
      } else {
        // Add /api prefix
        finalPath = `/api${urlToUse}`
        console.log(`[Vercel] Path from URL (added /api/): ${finalPath}`)
      }
    } else {
      // No path found - this shouldn't happen
      console.error(`[Vercel] No path found in req.url, req.path, or req.originalUrl`)
      finalPath = null
    }
  }
  
  // Set the correct path on request object
  if (finalPath) {
    try {
      const pathWithoutQuery = finalPath.split('?')[0]
      
      // CRITICAL: Set all path-related properties correctly
      // Express Router uses req.url and req.originalUrl to determine routing
      // req.path is derived from req.url, so setting req.url should be enough
      req.url = finalPath
      req.originalUrl = finalPath
      
      // Try to set req.path, but it might be read-only
      // Express will derive it from req.url anyway
      try {
        req.path = pathWithoutQuery
      } catch (e) {
        // req.path might be read-only, that's OK - Express will derive it
        console.log(`[Vercel] Could not set req.path directly (read-only), Express will derive it from req.url`)
      }
      
      // CRITICAL: Ensure method is preserved BEFORE setting path
      // This must be done after path is set to avoid conflicts
      if (typeof originalMethod !== 'undefined' && originalMethod) {
        req.method = originalMethod
      }
      
      console.log(`[Vercel] Final path: ${req.method} ${req.url}, path: ${req.path || 'derived'}`)
      console.log(`[Vercel] Method preserved: ${req.method}`)
    } catch (error) {
      console.error(`[Vercel] Error setting path:`, error.message)
      console.error(`[Vercel] originalMethod:`, typeof originalMethod, originalMethod)
      // Fallback: just set the path without method change
      req.url = finalPath
      req.originalUrl = finalPath
      try {
        req.path = finalPath.split('?')[0]
      } catch (e) {
        // Ignore if path is read-only
      }
    }
  } else {
    // If no path found, return error
    console.error(`[Vercel] Could not determine path for ${req.method}`)
    console.error(`[Vercel] req.url: ${req.url}, req.path: ${req.path}, req.originalUrl: ${req.originalUrl}`)
    return res.status(400).json({
      message: 'Invalid request path',
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    })
  }
  
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
        // CRITICAL: Ensure method is set correctly and preserved
        // serverless-http might change the method, so we need to force it
        req.method = originalMethod
        
        // Also set it on the request object properties that serverless-http might check
        if (req._method) {
          req._method = originalMethod
        }
        
        console.log(`[Vercel] Calling handler with method: ${req.method} (original: ${originalMethod})`)
        
        // Log body for POST/PUT/PATCH requests BEFORE handler
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          console.log(`[Vercel] Request body type:`, typeof req.body)
          console.log(`[Vercel] Request body before handler:`, req.body ? JSON.stringify(req.body).substring(0, 500) : 'empty')
          console.log(`[Vercel] Content-Type:`, req.headers['content-type'])
          console.log(`[Vercel] Content-Length:`, req.headers['content-length'])
        }
        
        // Wrap the handler call to ensure method is preserved
        const handlerResult = await handlerInstance(req, res)
        
        // Log method after handler to see if it changed
        if (req.method !== originalMethod) {
          console.error(`[Vercel] WARNING: Method changed from ${originalMethod} to ${req.method} after handler!`)
        }
        
        // Log body AFTER handler (to see if Express parsed it)
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          console.log(`[Vercel] Request body after handler:`, req.body ? JSON.stringify(req.body).substring(0, 500) : 'empty')
        }
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
      console.error(`[Vercel] Error name:`, error.name)
      console.error(`[Vercel] Error code:`, error.code)
      console.error(`[Vercel] Error stack:`, error.stack)
      
      // Log more details about the error
      if (error.cause) {
        console.error(`[Vercel] Error cause:`, error.cause)
      }
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Server error',
          error: error.message,
          errorName: error.name,
          errorCode: error.code,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
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
