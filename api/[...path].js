// Set Vercel environment variable before any imports
process.env.VERCEL = '1'

let handler = null
let handlerPromise = null

async function getHandler() {
  if (handler) {
    console.log('[Vercel Function] Using cached handler')
    return handler
  }
  
  if (handlerPromise) {
    console.log('[Vercel Function] Waiting for handler initialization...')
    return handlerPromise
  }
  
  handlerPromise = (async () => {
    const startTime = Date.now()
    try {
      console.log('[Vercel Function] Step 1: Loading serverless-http...')
      const serverless = await import('serverless-http')
      console.log('[Vercel Function] Step 2: serverless-http loaded in', Date.now() - startTime, 'ms')
      
      console.log('[Vercel Function] Step 3: Loading backend server...')
      const serverModule = await import('../backend/server.js')
      console.log('[Vercel Function] Step 4: Backend server loaded in', Date.now() - startTime, 'ms')
      
      const app = serverModule.default
      console.log('[Vercel Function] Step 5: Creating handler...')
      handler = serverless.default(app, {
        binary: ['image/*', 'video/*', 'application/pdf', 'application/octet-stream']
      })
      
      console.log('[Vercel Function] Step 6: Handler ready in', Date.now() - startTime, 'ms')
      return handler
    } catch (error) {
      console.error('[Vercel Function] Failed to create handler after', Date.now() - startTime, 'ms:', error)
      handlerPromise = null
      throw error
    }
  })()
  
  return handlerPromise
}

export default async (req, res) => {
  // Fix path for Vercel [...path] routing
  // Vercel passes the path via query parameter '...path'
  if (req.query && req.query['...path']) {
    const pathParam = req.query['...path']
    // Remove the query parameter and set the correct path
    delete req.query['...path']
    req.url = `/api/${pathParam}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`
    req.originalUrl = req.url
  }
  
  // Log request details
  console.log('[Vercel Function] Request received:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query
  })
  
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('[Vercel Function] Request timeout')
      res.status(504).json({ 
        message: 'Request timeout',
        error: 'The request took too long to process'
      })
    }
  }, 25000) // 25 seconds timeout (Vercel max is 30)
  
  try {
    console.log('[Vercel Function] Getting handler instance...')
    const handlerInstance = await Promise.race([
      getHandler(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler initialization timeout after 20 seconds')), 20000)
      )
    ])
    console.log('[Vercel Function] Handler instance obtained, calling handler...')
    
    const result = await Promise.race([
      handlerInstance(req, res),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 25000)
      )
    ])
    
    clearTimeout(timeout)
    return result
  } catch (error) {
    clearTimeout(timeout)
    console.error('[Vercel Function] Error:', error)
    console.error('[Vercel Function] Error name:', error.name)
    console.error('[Vercel Function] Error message:', error.message)
    console.error('[Vercel Function] Error code:', error.code)
    console.error('[Vercel Function] Error stack:', error.stack)
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error.message,
        errorName: error.name,
        errorCode: error.code
      })
    }
  }
}

