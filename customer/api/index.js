// Vercel Serverless Function wrapper for Express app
import app from '../backend/server.js'

// Export the Express app as a serverless function
// Vercel will handle routing automatically
export default async function handler(req, res) {
  // Wrap the Express app in a try-catch to handle errors
  try {
    // Ensure MongoDB connection before handling request
    const mongoose = (await import('mongoose')).default
    if (mongoose.connection.readyState === 0) {
      // Not connected, try to connect
      const MONGODB_URI = process.env.MONGODB_URI
      if (MONGODB_URI) {
        try {
          await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          })
        } catch (error) {
          console.error('MongoDB connection error in handler:', error)
        }
      }
    }
    
    // Vercel passes the full path including /api, so we need to ensure
    // the Express app receives it correctly
    // The Express routes are already set up for /api/*, so this should work
    return app(req, res)
  } catch (error) {
    console.error('Serverless Function Error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}

