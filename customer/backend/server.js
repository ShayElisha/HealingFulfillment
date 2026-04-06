import './load-env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Import routes
import authRoutes from './routes/auth.js'
import bookingRoutes from './routes/booking.js'
import contactRoutes from './routes/contact.js'
import reviewsRoutes from './routes/reviews.js'
import coursesRoutes from './routes/courses.js'
import categoriesRoutes from './routes/categories.js'
import purchasesRoutes from './routes/purchases.js'
import messagesRoutes from './routes/messages.js'
import leadsRoutes from './routes/leads.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// JWT_SECRET: required in production; dev-only fallback otherwise
if (!process.env.JWT_SECRET) {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  if (isProd) {
    console.error('❌ JWT_SECRET is required in production. Set it in your environment.')
    process.exit(1)
  }
  console.warn('⚠️  WARNING: JWT_SECRET is not defined — using a one-time dev default.')
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production-' + Date.now()
}

const app = express()
const PORT = process.env.CUSTOMER_PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healing-fulfillment'

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration - support both local and Vercel deployments
const allowedOrigins = [
  process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Vercel URLs
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
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

// Serve uploaded files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
})

app.use('/api/', generalLimiter)

// Health check - support both /health and /api/health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'customer-service',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.readyState === 1 ? mongoose.connection.db?.databaseName : undefined,
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  const ok = mongoose.connection.readyState === 1
  res.json({
    status: 'ok',
    service: 'customer-service',
    db: ok ? 'connected' : 'disconnected',
    dbName: ok ? mongoose.connection.db?.databaseName : undefined,
    timestamp: new Date().toISOString()
  })
})

// אבחון ללא סינון DB — לפני ה-middleware שדורש חיבור
// ?counts=1 — ספירות מול האוספים + רמזים (למה האתר "ריק" למרות חיבור תקין)
app.get('/api/debug/db-ping', async (req, res) => {
  const rs = mongoose.connection.readyState
  const stateLabel = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[rs] || rs
  const wantCounts = req.query.counts === '1' || req.query.counts === 'true'

  if (rs !== 1) {
    return res.status(503).json({
      ok: false,
      readyState: rs,
      state: stateLabel,
      message: 'אין חיבור פעיל ל-MongoDB'
    })
  }

  try {
    await mongoose.connection.db.admin().ping()
    const base = {
      ok: true,
      db: mongoose.connection.db?.databaseName,
      state: stateLabel
    }

    if (!wantCounts) {
      return res.json(base)
    }

    const db = mongoose.connection.db
    const [categoriesTotal, categoriesActive, reviewsTotal, reviewsApproved, coursesTotal, coursesActive] =
      await Promise.all([
        db.collection('categories').countDocuments(),
        db.collection('categories').countDocuments({ isActive: true }),
        db.collection('reviews').countDocuments(),
        db.collection('reviews').countDocuments({ status: 'approved' }),
        db.collection('courses').countDocuments(),
        db.collection('courses').countDocuments({ isActive: true })
      ])

    const hints = []
    if (categoriesTotal === 0 && reviewsTotal === 0 && coursesTotal === 0) {
      hints.push(
        'האוספים ריקים במסד שב-MONGODB_URI — וודאו שזה אותו מסד שהמנהל יוצר בו נתונים (שם אחרי כתובת Atlas).'
      )
    }
    if (categoriesTotal > 0 && categoriesActive === 0) {
      hints.push(
        'יש קטגוריות אבל אף אחת לא isActive:true — בפאנל המנהל סמנו "פעיל".'
      )
    }
    if (reviewsTotal > 0 && reviewsApproved === 0) {
      hints.push(
        'יש ביקורות אבל אין עם status=approved — אשרו ביקורות במנהל.'
      )
    }
    if (coursesTotal > 0 && coursesActive === 0) {
      hints.push(
        'יש מסלולים אבל אף אחד לא isActive:true — סמנו פעיל במנהל.'
      )
    }

    return res.json({
      ...base,
      publicApiFilters: {
        categories: 'GET /api/categories → רק isActive:true',
        reviews: 'GET /api/reviews → רק status=approved',
        courses: 'GET /api/courses → רק isActive:true'
      },
      counts: {
        categories: { total: categoriesTotal, returnedByPublicApi: categoriesActive },
        reviews: { total: reviewsTotal, returnedByPublicApi: reviewsApproved },
        courses: { total: coursesTotal, returnedByPublicApi: coursesActive }
      },
      hints
    })
  } catch (e) {
    return res.status(503).json({
      ok: false,
      error: e.message,
      name: e.name,
      readyState: rs,
      state: stateLabel
    })
  }
})

// דורש חיבור פעיל ל-MongoDB לכל נתיבי /api למעט health (מונע 500 מבלבל כש-DB לא זמין)
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/debug/db-ping') return next()
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        'מסד הנתונים לא מחובר. הריצו את customer/backend עם MONGODB_URI תקין ב-customer/backend/.env, וודאו ש-IP ברשימת Atlas Network Access, ואז הפעילו מחדש את השרת.',
      code: 'DB_UNAVAILABLE'
    })
  }
  next()
})

// Routes - Customer Service
app.use('/api/auth', authRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/purchases', purchasesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/leads', leadsRoutes)

function isMongoTransientError(err) {
  if (!err) return false
  const name = err.name || ''
  const msg = String(err.message || '').toLowerCase()
  return (
    name === 'MongoServerSelectionError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoPoolClearedError' ||
    name === 'PoolClearedError' ||
    msg.includes('server selection') ||
    msg.includes('topology') ||
    msg.includes('connection pool') ||
    msg.includes('connection timed out') ||
    msg.includes('not connected') ||
    msg.includes('connection closed') ||
    msg.includes('network error')
  )
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Customer Service Error:', err?.name, err?.message)
  const transient = isMongoTransientError(err)
  const status = transient ? 503 : err.statusCode || err.status || 500
  res.status(status).json({
    message: err.message || 'Internal server error',
    code: err.code || err.name || 'ERROR',
    ...(transient && {
      hint:
        'בעיית חיבור ל-MongoDB (Atlas, מגבלת חיבורים, רשת או VPN). סגרו שרתים כפולים, המתינו דקה ונסו שוב; בדקו Metrics → Connections ב-Atlas.'
    }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Connect to MongoDB - use connection pooling for serverless
const connectMongoDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Customer Service: Already connected to MongoDB')
    return
  }
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    // M0 Atlas — מגביל חיבורים; ברירת מחדל של הדרייבר גבוהה מדי כשמריצים כמה שירותים
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
    minPoolSize: 0
  })
  const dbName = mongoose.connection.db?.databaseName
  console.log(`✅ Customer Service: Connected to MongoDB (database: ${dbName || '?'})`)
}

// Connect to MongoDB
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  connectMongoDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`🚀 Customer Service running on port ${PORT}`)
      })
      const shutdown = async (signal) => {
        console.log(`\n${signal}: סוגר חיבורי MongoDB…`)
        try {
          await mongoose.disconnect()
        } catch (e) {
          console.error(e)
        }
        server.close(() => process.exit(0))
        setTimeout(() => process.exit(0), 5_000).unref()
      }
      process.once('SIGINT', () => shutdown('SIGINT'))
      process.once('SIGTERM', () => shutdown('SIGTERM'))
    })
    .catch((error) => {
      console.error('❌ Customer Service: MongoDB connection error:', error)
      process.exit(1)
    })
} else {
  connectMongoDB().catch((e) => console.error('❌ Customer Service: MongoDB connection error:', e))
  console.log('🚀 Customer Service ready for Vercel serverless functions')
}

export default app

