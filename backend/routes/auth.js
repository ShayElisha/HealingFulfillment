import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Customer from '../models/Customer.js'
import Booking from '../models/Booking.js'
import Purchase from '../models/Purchase.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// POST /api/auth/login - התחברות עם אימייל וסיסמה
router.post('/login', async (req, res, next) => {
  console.log('[Auth Route] POST /login called')
  console.log('[Auth Route] Request body:', JSON.stringify(req.body))
  console.log('[Auth Route] Request path:', req.path)
  console.log('[Auth Route] Request originalUrl:', req.originalUrl)
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'נא למלא אימייל וסיסמה' 
      })
    }

    // מצא את הלקוח לפי אימייל עם passwordHash
    const customer = await Customer.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')

    if (!customer) {
      return res.status(401).json({ 
        message: 'אימייל או סיסמה שגויים' 
      })
    }

    if (!customer.hasAccount) {
      return res.status(403).json({ 
        message: 'למשתמש זה אין חשבון פעיל. נא ליצור קשר עם המנהל.' 
      })
    }

    if (!customer.passwordHash) {
      console.error('Customer passwordHash is missing:', customer._id)
      return res.status(403).json({ 
        message: 'חשבון לא מוגדר כראוי. נא ליצור קשר עם המנהל.' 
      })
    }

    // בדוק את הסיסמה

    let isPasswordValid
    try {
      isPasswordValid = await bcrypt.compare(password, customer.passwordHash)
    } catch (bcryptError) {
      console.error('Bcrypt compare error:', bcryptError)
      return res.status(500).json({ 
        message: 'שגיאת שרת בעת בדיקת סיסמה' 
      })
    }

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'אימייל או סיסמה שגויים' 
      })
    }

    // עדכן תאריך התחברות אחרונה
    customer.lastLoginAt = new Date()
    await customer.save()

    // בדוק שה-JWT_SECRET מוגדר
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables')
      return res.status(500).json({ message: 'שגיאת שרת. נא ליצור קשר עם המנהל.' })
    }

    // צור JWT token
    const token = jwt.sign(
      { 
        customerId: customer._id,
        email: customer.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Token תקף ל-30 יום
    )

    res.json({
      message: 'התחברות הצליחה',
      data: {
        token,
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          mustChangePassword: customer.mustChangePassword
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    console.error('Error stack:', error.stack)
    // אם זה שגיאת JWT_SECRET, החזר הודעה ברורה יותר
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        message: 'שגיאת שרת: JWT_SECRET לא מוגדר. נא להגדיר JWT_SECRET ב-.env' 
      })
    }
    next(error)
  }
})

// POST /api/auth/change-password - שינוי סיסמה (דורש אימות)
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'נא למלא סיסמה ישנה וסיסמה חדשה' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'סיסמה חדשה חייבת להכיל לפחות 6 תווים' 
      })
    }

    const customer = await Customer.findById(req.customerId)
      .select('+passwordHash')

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' })
    }

    // בדוק את הסיסמה הישנה
    const isOldPasswordValid = await bcrypt.compare(oldPassword, customer.passwordHash)

    if (!isOldPasswordValid) {
      return res.status(401).json({ 
        message: 'סיסמה ישנה שגויה' 
      })
    }

    // צפין את הסיסמה החדשה
    const saltRounds = 10
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

    // עדכן את הסיסמה
    customer.passwordHash = newPasswordHash
    customer.mustChangePassword = false
    await customer.save()

    res.json({
      message: 'סיסמה עודכנה בהצלחה'
    })
  } catch (error) {
    console.error('Change password error:', error)
    next(error)
  }
})

// GET /api/auth/me - קבלת פרטי המשתמש המחובר (דורש אימות)
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customerId)
      .populate({
        path: 'purchases',
        populate: {
          path: 'course',
          select: 'title price sessionsCount'
        },
        select: 'course price status createdAt'
      })
      .populate('bookings', 'preferredDate preferredTime status meetingType zoomLink')

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' })
    }

    // חשב מפגשים זמינים
    const completedPurchases = customer.purchases.filter(p => p.status === 'completed')
    const totalSessionsPurchased = completedPurchases.reduce((sum, purchase) => {
      return sum + (purchase.course?.sessionsCount || 0)
    }, 0)
    
    // ספור פגישות פעילות (pending או confirmed)
    const activeBookings = customer.bookings.filter(b => 
      b.status === 'pending' || b.status === 'confirmed'
    ).length
    
    const availableSessions = Math.max(0, totalSessionsPurchased - activeBookings)

    // הוסף את המידע ל-customer object
    const customerData = customer.toObject()
    customerData.availableSessions = availableSessions
    customerData.totalSessionsPurchased = totalSessionsPurchased
    customerData.activeBookings = activeBookings

    res.json({
      message: 'פרטי לקוח נטענו בהצלחה',
      data: customerData
    })
  } catch (error) {
    console.error('Get me error:', error)
    next(error)
  }
})

// POST /api/auth/booking - Create booking for authenticated customer
router.post('/booking', authenticateToken, async (req, res, next) => {
  try {
    const { preferredDate, preferredTime, meetingType, notes } = req.body

    if (!preferredDate) {
      return res.status(400).json({ 
        message: 'תאריך מועדף הוא שדה חובה' 
      })
    }

    // טען את הלקוח עם רכישות
    const customer = await Customer.findById(req.customerId)
      .populate({
        path: 'purchases',
        populate: {
          path: 'course',
          select: 'sessionsCount'
        }
      })

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' })
    }

    // חשב מפגשים זמינים
    const completedPurchases = customer.purchases.filter(p => p.status === 'completed')
    const totalSessionsPurchased = completedPurchases.reduce((sum, purchase) => {
      return sum + (purchase.course?.sessionsCount || 0)
    }, 0)
    
    // ספור פגישות פעילות (pending או confirmed)
    const activeBookings = await Booking.countDocuments({
      customer: req.customerId,
      status: { $in: ['pending', 'confirmed'] }
    })
    
    const availableSessions = totalSessionsPurchased - activeBookings

    if (availableSessions <= 0) {
      return res.status(400).json({ 
        message: 'אין לך מפגשים זמינים. נא לרכוש מסלול נוסף.' 
      })
    }

    // צור את הפגישה
    const booking = new Booking({
      customer: req.customerId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      preferredDate,
      preferredTime: preferredTime || '',
      meetingType: meetingType || 'frontend',
      notes: notes || '',
      status: 'pending'
    })

    await booking.save()

    // הוסף את הפגישה ללקוח
    customer.bookings.push(booking._id)
    await customer.save()

    res.status(201).json({
      message: 'פגישה נקבעה בהצלחה',
      data: {
        id: booking._id,
        preferredDate: booking.preferredDate,
        availableSessions: availableSessions - 1 // מפגשים זמינים אחרי הפגישה החדשה
      }
    })
  } catch (error) {
    console.error('Booking error:', error)
    next(error)
  }
})

export default router

