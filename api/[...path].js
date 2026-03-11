import serverless from 'serverless-http'
import app from '../backend/server.js'

// Vercel serverless function handler - catch-all route
// This handles all /api/* routes
const handler = serverless(app, {
  binary: ['image/*', 'video/*', 'application/pdf', 'application/octet-stream']
})

export default async (req, res) => {
  // Set Vercel environment variable for path handling
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1'
  }
  
  // Log incoming request details
  console.log('='.repeat(50))
  console.log('[Vercel Function] Incoming request:')
  console.log('  Method:', req.method)
  console.log('  URL:', req.url)
  console.log('  Path:', req.path || 'undefined')
  console.log('  Original URL:', req.originalUrl || 'undefined')
  console.log('  Query:', JSON.stringify(req.query || {}))
  console.log('  Headers:', JSON.stringify(req.headers || {}))
  console.log('='.repeat(50))
  
  try {
    const result = await handler(req, res)
    console.log('[Vercel Function] Request completed successfully')
    return result
  } catch (error) {
    console.error('[Vercel Function] Error:', error)
    console.error('[Vercel Function] Error stack:', error.stack)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

