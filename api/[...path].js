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
  
  try {
    return await handler(req, res)
  } catch (error) {
    console.error('Error:', error.message)
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error.message
      })
    }
  }
}

