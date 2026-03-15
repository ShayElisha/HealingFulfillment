// Vercel Serverless Function wrapper for Express app
// Create the Express app directly instead of importing

export default async function handler(req, res) {
  try {
    // Dynamic import of the server module
    const { default: app } = await import('../backend/server.js')
    
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
        }
      }
    }
    
    // Call the Express app handler
    return app(req, res)
  } catch (error) {
    console.error('Serverless Function Error:', error)
    console.error('Error stack:', error.stack)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}
