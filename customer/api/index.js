// Vercel Serverless Function wrapper
let appPromise = null

function getApp() {
  if (!appPromise) {
    appPromise = import('../backend/server.js').then(m => m.default)
  }
  return appPromise
}

export default async function handler(req, res) {
  try {
    const app = await getApp()
    return app(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
