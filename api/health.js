// Simple health check endpoint for Vercel
export default async (req, res) => {
  res.json({
    status: 'ok',
    environment: 'vercel',
    timestamp: new Date().toISOString()
  })
}

