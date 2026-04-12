import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Customer from '../models/Customer.js'

// Middleware לבדיקת JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables')
      return res.status(500).json({ message: 'שגיאת שרת. נא ליצור קשר עם המנהל.' })
    }

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'אין token זמין. נא להתחבר.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (mongoose.connection.readyState !== 1) {
      console.warn(
        'authenticateToken: MongoDB not ready, readyState=',
        mongoose.connection.readyState
      )
      return res.status(503).json({
        message:
          'השרת מתחבר למסד הנתונים. רענן את העמוד או לחץ «נסה שוב» בעוד רגע.',
      })
    }

    const rawId = decoded.customerId ?? decoded.id ?? decoded.sub
    if (rawId == null || rawId === '') {
      return res.status(403).json({ message: 'Token לא תקין (חסר מזהה משתמש)' })
    }

    const customer = await Customer.findById(String(rawId)).select('+passwordHash')
    
    if (!customer) {
      return res.status(401).json({ message: 'משתמש לא נמצא' })
    }

    if (!customer.hasAccount) {
      return res.status(403).json({ message: 'למשתמש אין חשבון פעיל' })
    }
    if (customer.isAdmin !== true) {
      return res.status(403).json({ message: 'הגישה למנהל מותרת לאדמין בלבד' })
    }

    req.customer = customer
    req.customerId = String(customer._id)

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token לא תקין' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token פג תוקף. נא להתחבר מחדש.' })
    }
    if (error.name === 'CastError') {
      return res.status(403).json({ message: 'מזהה משתמש בתוקן לא תקין' })
    }
    const mongoDown =
      error.name === 'MongoServerSelectionError' ||
      error.name === 'MongoNetworkError' ||
      error.name === 'MongoNotConnectedError' ||
      (error.name === 'MongooseError' && /buffering timed out|not connected/i.test(String(error.message)))
    if (mongoDown) {
      console.error('Auth middleware: MongoDB unavailable:', error.message)
      return res.status(503).json({
        message:
          'מסד הנתונים אינו זמין. ודא ש-MongoDB רץ וש-MONGODB_URI זהה לשרת הלקוחות.',
      })
    }
    console.error('Auth middleware error:', error)
    return res.status(500).json({ message: 'שגיאה באימות' })
  }
}

// Middleware המגן על routes - דורש אימות
export const requireAuth = authenticateToken

// Middleware לבדיקה שהלקוח יכול לגשת רק לנתונים שלו
export const requireOwnership = (req, res, next) => {
  const requestedCustomerId = req.params.id || req.params.customerId
  
  if (req.customerId.toString() !== requestedCustomerId.toString()) {
    return res.status(403).json({ message: 'אין הרשאה לגשת לנתונים אלה' })
  }
  
  next()
}

