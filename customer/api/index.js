// Vercel Serverless Function wrapper for Express app
import app from '../backend/server.js'

// Export the Express app directly - Vercel will handle it as a serverless function
// The app is already configured in server.js with all routes and middleware
export default app

