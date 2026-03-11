// Vercel serverless function handler - catch-all route
// This handles all /api/* routes

let handler = null

async function initHandler() {
  if (handler) {
    return handler
  }
  
  try {
    // Set Vercel environment variable before importing
    process.env.VERCEL = '1'
    
    console.log('[Vercel Function] Initializing handler...')
    const serverless = await import('serverless-http')
    const serverModule = await import('../backend/server.js')
    const app = serverModule.default
    
    handler = serverless.default(app, {
      binary: ['image/*', 'video/*', 'application/pdf', 'application/octet-stream']
    })
    
    console.log('[Vercel Function] Handler initialized successfully')
    return handler
  } catch (error) {
    console.error('[Vercel Function] Failed to initialize handler:', error)
    console.error('[Vercel Function] Error name:', error.name)
    console.error('[Vercel Function] Error message:', error.message)
    console.error('[Vercel Function] Error code:', error.code)
    console.error('[Vercel Function] Error stack:', error.stack)
    throw error
  }
}

export default async (req, res) => {
  // Set Vercel environment variable for path handling
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1'
  }
  
  try {
    const handlerInstance = await initHandler()
    return await handlerInstance(req, res)
  } catch (error) {
    console.error('[Vercel Function] Runtime Error:', error)
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

