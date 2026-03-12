// Vercel Serverless Function wrapper for Express app
import app from '../backend/server.js'

// Vercel serverless functions - export the Express app directly
// Vercel will handle routing automatically
export default app
