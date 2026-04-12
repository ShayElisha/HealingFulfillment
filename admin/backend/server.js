import './load-env.js'
import './registerModels.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import adminRoutes from './routes/admin.js'
import customersRoutes from './routes/customers.js'
import coursesRoutes from './routes/courses.js'
import categoriesRoutes from './routes/categories.js'
import purchasesRoutes from './routes/purchases.js'
import bookingRoutes from './routes/booking.js'
import uploadRoutes from './routes/upload.js'
import messagesRoutes from './routes/messages.js'
import reviewsRoutes from './routes/reviews.js'
import contactRoutes from './routes/contact.js'
import leadsRoutes from './routes/leads.js'
import transactionsRoutes from './routes/transactions.js'
import forWhomAudienceAdminRoutes from './routes/forWhomAudience.js'
import availabilitySettingsRoutes from './routes/availabilitySettings.js'
import statsRoutes from './routes/stats.js'
import { authenticateToken as authenticateAdminToken } from './middleware/auth.js'
import { isCloudinaryConfigured } from './services/cloudinaryUpload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// JWT חייב להיות זהה בין customer/backend (התחברות) ל-admin/backend (אימות).
// בלי JWT_SECRET ב-.env — שימוש ב-fallback קבוע לפיתוח בלבד (לא Date.now() — כל שרת קיבל סוד אחר והפאנל נפל).
const DEV_JWT_FALLBACK = 'healingfulfillment-local-dev-jwt-secret-not-for-production'
if (!process.env.JWT_SECRET) {
  const isProd =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  if (isProd) {
    console.error('❌ JWT_SECRET חובה בפרודקשן. הגדר משתנה סביבה ב-Vercel/שרת.')
    process.exit(1)
  }
  console.warn('⚠️  JWT_SECRET לא מוגדר ב-.env — משתמשים ב-fallback לפיתוח בלבד.')
  console.warn('⚠️  הגדר JWT_SECRET זהה בשני השרתים (ולא לשתף את הערך בקוד).')
  process.env.JWT_SECRET = DEV_JWT_FALLBACK
}

const app = express()
const PORT = process.env.ADMIN_PORT || 5001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'

if (isCloudinaryConfigured()) {
  console.log('☁️ Cloudinary: מוגדר (העלאות קבצים/אודיו ללקוחות)')
} else {
  console.warn(
    '⚠️ Cloudinary: לא מוגדר — POST ל-/api/admin/customers/.../files ו-.../audio יחזירו 503. הגדר CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
  )
}

// Trust proxy - Required for Vercel and other proxy environments
// This fixes X-Forwarded-For errors and ensures correct IP addresses
app.set('trust proxy', 1)

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) return callback(null, true)

    // פיתוח: IP מקומי / דומיינים שלא ברשימה חתמו בעבר ב-CORS וגרמו לכשל שקשה לאבחן
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    const allowedOrigins = [
    process.env.ADMIN_FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    ].filter(Boolean)
    
    // In Vercel production, allow same-origin requests (frontend and API on same domain)
    if (process.env.VERCEL) {
      return callback(null, true)
    }
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
let isConnected = false
let isConnecting = false
let connectionPromise = null

const connectDB = async () => {
  if (isConnected) {
    return
  }
  
  // If already connecting, wait for that promise
  if (isConnecting && connectionPromise) {
    return connectionPromise
  }
  
  isConnecting = true
  connectionPromise = (async () => {
    try {
      // Increase timeout for Vercel serverless (30 seconds)
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
        minPoolSize: 0
      })
    isConnected = true
      isConnecting = false
      connectionPromise = null
      console.log('✅ Admin Service: Connected to MongoDB')
  } catch (error) {
      isConnecting = false
      connectionPromise = null
    console.error('❌ Admin Service: MongoDB connection error:', error)
    throw error
  }
  })()
  
  return connectionPromise
}

mongoose.connection.on('disconnected', () => {
  isConnected = false
  console.warn('⚠️  Admin Service: MongoDB disconnected')
})
mongoose.connection.on('error', (err) => {
  console.error('⚠️  Admin Service: MongoDB connection error event:', err?.message || err)
})

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  // Skip if already sent response
  if (res.headersSent) {
    return next()
  }

  if (mongoose.connection.readyState !== 1) {
    isConnected = false
  }

  if (!isConnected && !isConnecting) {
    try {
      await connectDB()
    } catch (error) {
      // Only send error if response hasn't been sent
      if (!res.headersSent) {
        return res.status(500).json({
          message:
            'התחברות למסד הנתונים נכשלה. ודא ש-MongoDB רץ וש-MONGODB_URI נכון (זהה לשרת הלקוחות).',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        })
      }
      return
    }
  } else if (isConnecting && connectionPromise) {
    // Wait for connection if it's in progress
    try {
      await connectionPromise
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({
          message:
            'התחברות למסד הנתונים נכשלה. ודא ש-MongoDB רץ וש-MONGODB_URI נכון (זהה לשרת הלקוחות).',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        })
      }
      return
    }
  }

  next()
})

// קבצים ישנים מתיקיית uploads בלבד; העלאות חדשות נשמרות ב-Cloudinary (URL מלא במסד)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')))
app.use('/uploads/customers', express.static(path.join(__dirname, 'uploads/customers')))

// Handle OPTIONS requests for CORS preflight - MUST be before rate limiting
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Rate limiting — dashboard fires many parallel /api/* calls; /api/admin/* was counted twice
// (general + admin), which quickly hit 429. Skip general bucket for /api/admin paths.
const isDev = process.env.NODE_ENV !== 'production'

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 8000 : 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: (req) => {
    const path = (req.originalUrl || req.url || '').split('?')[0]
    return path.startsWith('/api/admin')
  },
})

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 15000 : 4000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
})

app.use('/api/', generalLimiter)
app.use('/api/admin', adminLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'admin-service',
    timestamp: new Date().toISOString() 
  })
})

/** בדיקת מוכנות בלי JWT — לאבחון כשהפאנל לא נטען */
app.get('/api/ready', (req, res) => {
  const rs = mongoose.connection.readyState
  const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting']
  const mongoOk = rs === 1
  res.status(mongoOk ? 200 : 503).json({
    ok: mongoOk,
    service: 'admin-service',
    mongo: { readyState: rs, state: stateNames[rs] ?? String(rs) },
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    timestamp: new Date().toISOString(),
  })
})

// Protect admin API: only authenticated admin customers can access
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next()
  if (req.path === '/health' || req.path === '/ready') return next()
  return authenticateAdminToken(req, res, next)
})

// Routes - Admin Service
// IMPORTANT: customersRoutes must come before adminRoutes because it handles /admin/customers
// which would otherwise be caught by /api/admin prefix
app.use('/api', customersRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin', statsRoutes)
app.use('/api/admin', availabilitySettingsRoutes)
app.use('/api/admin', forWhomAudienceAdminRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/purchases', purchasesRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/transactions', transactionsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(
    '[Admin API]',
    req.method,
    req.originalUrl,
    '|',
    err?.name || 'Error',
    '|',
    err?.message || String(err)
  )
  if (process.env.NODE_ENV === 'development' && err?.stack) {
    console.error(err.stack)
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      message:
        'הקובץ גדול מדי מהמותר. הקטן את הקובץ או העלה קובץ קטן יותר.',
    })
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: err.message || 'שגיאה בהעלאת הקובץ',
    })
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && {
      url: req.url,
      originalUrl: req.originalUrl
    })
  })
})

// Connect and start server (only in local development, not in Vercel)
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Admin Service running on port ${PORT}`)
      })
    })
    .catch((error) => {
      console.error('❌ Admin Service: MongoDB connection error:', error)
      process.exit(1)
    })
}

export default app

