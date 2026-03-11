// Set Vercel environment variable before any imports
process.env.VERCEL = '1'

let handler = null
let handlerPromise = null

async function getHandler() {
  if (handler) {
    return handler
  }
  
  if (handlerPromise) {
    return handlerPromise
  }
  
  handlerPromise = (async () => {
    try {
      console.log('[Vercel Function] Loading dependencies...')
      const serverless = await import('serverless-http')
      console.log('[Vercel Function] Loading server...')
      const serverModule = await import('../backend/server.js')
      const app = serverModule.default
      
      console.log('[Vercel Function] Creating handler...')
      handler = serverless.default(app, {
        binary: ['image/*', 'video/*', 'application/pdf', 'application/octet-stream']
      })
      
      console.log('[Vercel Function] Handler ready')
      return handler
    } catch (error) {
      console.error('[Vercel Function] Failed to create handler:', error)
      handlerPromise = null
      throw error
    }
  })()
  
  return handlerPromise
}

export default async (req, res) => {
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
    const handlerInstance = await Promise.race([
      getHandler(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler initialization timeout')), 10000)
      )
    ])
    
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

