import jwt from 'jsonwebtoken'
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
    
    // מצא את הלקוח לפי ID מה-token
    const customer = await Customer.findById(decoded.customerId).select('+passwordHash')
    
    if (!customer) {
      return res.status(401).json({ message: 'משתמש לא נמצא' })
    }

    if (!customer.hasAccount) {
      return res.status(403).json({ message: 'למשתמש אין חשבון פעיל' })
    }

    // הוסף את הלקוח ל-request
    req.customer = customer
    req.customerId = decoded.customerId
    
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Token לא תקין' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token פג תוקף. נא להתחבר מחדש.' })
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

