// Simple test endpoint to check MongoDB connection
export default async function handler(req, res) {
  const start = Date.now()
  
  try {
    // Import mongoose
    const mongoose = (await import('mongoose')).default
    
    // Get URI from environment
    let MONGODB_URI = process.env.MONGODB_URI
    
    // Log raw URI for debugging
    console.log('[Test-DB] Raw MONGODB_URI:', MONGODB_URI ? `"${MONGODB_URI.substring(0, 50)}..."` : 'not set')
    console.log('[Test-DB] URI length:', MONGODB_URI ? MONGODB_URI.length : 0)
    console.log('[Test-DB] URI type:', typeof MONGODB_URI)
    
    if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/healing-fulfillment') {
      return res.status(500).json({
        status: 'error',
        message: 'MONGODB_URI not configured',
        uriPreview: MONGODB_URI ? MONGODB_URI.substring(0, 30) + '...' : 'not set',
        rawUri: MONGODB_URI || 'undefined'
      })
    }
    
    // Clean URI - remove whitespace and check format
    MONGODB_URI = MONGODB_URI.trim()
    
    // Validate URI format
    if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid MongoDB URI format',
        uriPreview: MONGODB_URI.substring(0, 50),
        expected: 'Should start with mongodb:// or mongodb+srv://',
        received: MONGODB_URI.substring(0, 20)
      })
    }
    
    // Fix URI if needed
    let finalUri = MONGODB_URI
    if (finalUri.endsWith('/')) {
      finalUri = finalUri + 'healing-fulfillment'
    } else if (!finalUri.match(/\/[^\/]+$/)) {
      // If URI doesn't end with database name, add it
      finalUri = finalUri + '/healing-fulfillment'
    }
    
    console.log('[Test-DB] Final URI preview:', finalUri.substring(0, 50) + '...')
    
    const connectionState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    
    // Try to connect if not connected
    if (connectionState !== 1) {
      console.log(`[Test] Current state: ${states[connectionState]}, attempting connection...`)
      
      await Promise.race([
        mongoose.connect(finalUri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 10000,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ])
    }
    
    const finalState = mongoose.connection.readyState
    
    res.json({
      status: 'ok',
      mongodb: {
        state: finalState,
        stateName: states[finalState],
        connected: finalState === 1,
        connectionTime: Date.now() - start
      },
      uri: {
        configured: !!MONGODB_URI,
        preview: MONGODB_URI.substring(0, 30) + '...',
        hasDatabase: !finalUri.endsWith('/')
      }
    })
  } catch (error) {
    // Log detailed error info
    console.error('[Test-DB] Error:', error.message)
    console.error('[Test-DB] Error name:', error.name)
    console.error('[Test-DB] MONGODB_URI value:', process.env.MONGODB_URI ? `"${process.env.MONGODB_URI}"` : 'undefined')
    console.error('[Test-DB] MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0)
    console.error('[Test-DB] First 50 chars:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) : 'N/A')
    
    res.status(500).json({
      status: 'error',
      message: error.message,
      error: error.name,
      time: Date.now() - start,
      debug: {
        uriExists: !!process.env.MONGODB_URI,
        uriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
        uriPreview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) : 'not set',
        uriStartsWithMongo: process.env.MONGODB_URI ? (process.env.MONGODB_URI.startsWith('mongodb://') || process.env.MONGODB_URI.startsWith('mongodb+srv://')) : false
      }
    })
  }
}

