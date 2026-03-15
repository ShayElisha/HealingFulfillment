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
    
    // Ensure MongoDB connection before handling request
    const mongoose = (await import('mongoose')).default
    if (mongoose.connection.readyState === 0) {
      const MONGODB_URI = process.env.MONGODB_URI
      if (MONGODB_URI) {
        try {
          await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          })
          console.log('MongoDB connected in handler')
        } catch (error) {
          console.error('MongoDB connection error in handler:', error)
          // Continue anyway - some routes might work without DB
        }
      } else {
        console.warn('MONGODB_URI not set')
      }
    }
    
    return app(req, res)
  } catch (error) {
    console.error('Handler error:', error)
    console.error('Error stack:', error.stack)
    console.error('Request URL:', req.url)
    console.error('Request Method:', req.method)
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}
