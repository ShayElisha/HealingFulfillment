import app from '../backend/server.js'

// Vercel serverless function handler
// Ensure MongoDB connection before handling requests
export default async function handler(req, res) {
  const mongoose = await import('mongoose')
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'
  
  // Connect to MongoDB if not already connected
  if (mongoose.default.connection.readyState === 0) {
    try {
      await mongoose.default.connect(MONGODB_URI)
      console.log('Connected to MongoDB')
    } catch (error) {
      console.error('MongoDB connection error:', error)
      return res.status(500).json({ message: 'Database connection failed' })
    }
  }
  
  return app(req, res)
}

