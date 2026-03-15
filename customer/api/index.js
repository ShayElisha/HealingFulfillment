// Vercel Serverless Function wrapper
// Simple wrapper that imports and exports the Express app

const serverModule = await import('../backend/server.js')
export default serverModule.default
