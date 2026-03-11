import serverless from 'serverless-http'
import app from '../backend/server.js'

// Vercel serverless function handler
// Wrap Express app with serverless-http for proper Vercel compatibility
export default serverless(app)

