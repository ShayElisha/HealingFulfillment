import app from '../backend/server.js'

// Vercel serverless function handler
// Export the Express app directly - Vercel handles the request/response
// MongoDB connection is handled by middleware in server.js
export default app

