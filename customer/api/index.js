// Vercel Serverless Function wrapper for Express app
let app

// Lazy load the app to catch import errors
try {
  app = await import('../backend/server.js').then(m => m.default)
} catch (error) {
  console.error('Failed to import server.js:', error)
  // Create a minimal error handler
  app = (req, res) => {
    res.status(500).json({
      message: 'Server initialization error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

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
          console.log('MongoDB connected in handler')
        } catch (error) {
          console.error('MongoDB connection error in handler:', error)
          // Don't fail the request if MongoDB connection fails
          // Some routes might work without DB
        }
      } else {
        console.warn('MONGODB_URI not set')
      }
    }
    
    // Vercel passes the full path including /api, so we need to ensure
    // the Express app receives it correctly
    // The Express routes are already set up for /api/*, so this should work
    return app(req, res)
  } catch (error) {
    console.error('Serverless Function Error:', error)
    console.error('Error stack:', error.stack)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}

