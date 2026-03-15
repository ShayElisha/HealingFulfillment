import('../backend/server.js')
  .then((module) => {
    const app = module.default
    
    // Export handler function
    export default async function handler(req, res) {
      try {
        // Ensure MongoDB connection
        const mongoose = (await import('mongoose')).default
        if (mongoose.connection.readyState === 0) {
          const MONGODB_URI = process.env.MONGODB_URI
          if (MONGODB_URI) {
            try {
              await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
              })
            } catch (error) {
              console.error('MongoDB connection error:', error)
            }
          }
        }
        
        return app(req, res)
      } catch (error) {
        console.error('Handler error:', error)
        if (!res.headersSent) {
          res.status(500).json({ message: 'Internal server error' })
        }
      }
    }
  })
  .catch((error) => {
    console.error('Failed to load server:', error)
    export default async function handler(req, res) {
      res.status(500).json({ 
        message: 'Server initialization failed',
        error: error.message 
      })
    }
  })
