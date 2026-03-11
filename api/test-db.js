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
    res.status(500).json({
      status: 'error',
      message: error.message,
      error: error.name,
      time: Date.now() - start
    })
  }
}

