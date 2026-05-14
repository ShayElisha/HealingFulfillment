import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Customer from '../models/Customer.js'
import Booking from '../models/Booking.js'
import Purchase from '../models/Purchase.js'
import {
  computeSessionEntitlementForCustomerId,
  getSubscriptionDisplayForCustomer,
  preferredDateWithinSubscription,
} from '../utils/sessionEntitlement.js'
import Message from '../models/Message.js'
import { authenticateToken } from '../middleware/auth.js'
import { sendPasswordResetEmail, sendRegularMeetingConfirmationEmail } from '../services/emailService.js'
import { isPreferredTimeAllowed, formatYmd } from '../services/availabilityService.js'

const router = express.Router()
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000
const CANCELLATION_FREE_WINDOW_HOURS = 24

function hashResetToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function validateStrongPassword(password) {
  const value = String(password || '')
  const checks = {
    length: value.length >= 8 && value.length <= 12,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    digit: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  }
  const valid = Object.values(checks).every(Boolean)
  return {
    valid,
    checks,
    message:
      'הסיסמה חייבת להכיל 8-12 תווים, אות גדולה, אות קטנה, מספר וסימן מיוחד.',
  }
}

function getBookingDateTime(booking) {
  const base = new Date(booking.preferredDate)
  if (booking.preferredTime && /^\d{1,2}:\d{2}$/.test(String(booking.preferredTime).trim())) {
    const [h, m] = String(booking.preferredTime).trim().split(':').map(Number)
    base.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)
  } else {
    // בלי שעה נחשב סוף יום כדי לא לחסום ביטול מוקדם מדי
    base.setHours(23, 59, 59, 999)
  }
  return base
}

function ensureCustomerIsActive(customer, res) {
  if (customer?.status === 'inactive') {
    res.status(403).json({
      message: 'המשתמש אינו פעיל. לא ניתן לבצע פעולה זו כרגע, יש לפנות למנהל.',
    })
    return false
  }
  return true
}

// GET /api/auth/login - Return info about login endpoint
router.get('/login', (req, res) => {
  res.status(405).json({
    message: 'Method not allowed',
    error: 'Login endpoint requires POST request',
    allowedMethods: ['POST']
  })
})

// POST /api/auth/login - התחברות עם אימייל וסיסמה
router.post('/login', async (req, res, next) => {
  console.log('[Auth Route] POST /login called')
  console.log('[Auth Route] Request body:', JSON.stringify(req.body))
  console.log('[Auth Route] Request path:', req.path)
  console.log('[Auth Route] Request originalUrl:', req.originalUrl)
  try {
    const { password } = req.body
    const email = String(req.body?.email ?? '').trim().toLowerCase()

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'נא למלא אימייל וסיסמה' 
      })
    }

    // מצא לקוח (כולל רשומות ישנות עם אותיות גדולות במסד — אחרי התחברות מנרמלים לשמירה)
    const customer = await Customer.findOne({ email })
      .collation({ locale: 'en', strength: 2 })
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

    // עדכן תאריך התחברות; יישור אימייל לאותיות קטנות אם במסד נשמרו אותיות גדולות
    customer.email = email
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
        email: customer.email,
        isAdmin: customer.isAdmin === true
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
          mustChangePassword: customer.mustChangePassword,
          isAdmin: customer.isAdmin === true
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

// POST /api/auth/forgot-password - send reset link (always generic response)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'נא להזין אימייל' })
    }

    const generic = {
      message: 'אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.',
    }

    const customer = await Customer.findOne({ email })
      .collation({ locale: 'en', strength: 2 })
      .select('+passwordHash')
    if (!customer || !customer.hasAccount || !customer.email) {
      return res.json(generic)
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    customer.resetPasswordTokenHash = hashResetToken(rawToken)
    customer.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await customer.save()

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')
    const resetUrl = `${frontendBase}/customer/reset-password?token=${encodeURIComponent(rawToken)}`
    await sendPasswordResetEmail(customer, resetUrl)

    return res.json(generic)
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/reset-password - set new password using reset token
router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim()
    const newPassword = String(req.body?.newPassword || '')

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'חסרים נתונים לאיפוס סיסמה' })
    }
    const strong = validateStrongPassword(newPassword)
    if (!strong.valid) {
      return res.status(400).json({ message: strong.message, passwordChecks: strong.checks })
    }

    const tokenHash = hashResetToken(token)
    const customer = await Customer.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select('+passwordHash')

    if (!customer) {
      return res.status(400).json({ message: 'קישור האיפוס לא תקין או שפג תוקפו' })
    }

    customer.passwordHash = await bcrypt.hash(newPassword, 10)
    customer.mustChangePassword = false
    customer.resetPasswordTokenHash = undefined
    customer.resetPasswordExpiresAt = undefined
    await customer.save()

    return res.json({ message: 'הסיסמה עודכנה בהצלחה' })
  } catch (error) {
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

    const strong = validateStrongPassword(newPassword)
    if (!strong.valid) {
      return res.status(400).json({
        message: strong.message,
        passwordChecks: strong.checks,
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
          select:
            'title price sessionsCount installmentsCount coachingProcessMonths coachingProcessStartAt coachingProcessEndAt'
        },
        select:
          'course price status createdAt paidAt coachingStartedAt coachingEndsAt provider refundStatus refundRequestedAt refundReviewedAt refundCompletedAt refundRequestReason refundDecisionReason'
      })
      .populate(
        'bookings',
        'preferredDate preferredTime status meetingType zoomLink isIntroMeeting sessionSummary cancellationRequestedAt cancellationRequestedByCustomer statusBeforeCancellationRequest'
      )

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' })
    }

    const entitlement = await computeSessionEntitlementForCustomerId(req.customerId)
    const subscriptionDisplay = await getSubscriptionDisplayForCustomer(req.customerId)

    const customerData = customer.toObject()
    customerData.availableSessions = entitlement.availableSessions
    customerData.totalSessionsPurchased = entitlement.totalSessionsPurchased
    customerData.usedBookings = entitlement.usedBookings
    customerData.bookingUnlimitedBySubscription = Boolean(
      entitlement.bookingUnlimitedBySubscription
    )
    customerData.sessionEntitlementSource = entitlement.entitlementSource
    customerData.activeBookings = customer.bookings.filter(b => 
      b.status === 'pending' || b.status === 'confirmed' || b.status === 'cancellation_requested'
    ).length

    customerData.activeSubscription = entitlement.activeSubscription || null
    customerData.subscriptionDisplay = subscriptionDisplay

    res.json({
      message: 'פרטי לקוח נטענו בהצלחה',
      data: customerData
    })
  } catch (error) {
    console.error('Get me error:', error)
    next(error)
  }
})

// PUT /api/auth/me/profile - Update logged-in customer personal details
router.put('/me/profile', authenticateToken, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customerId)
    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' })
    }
    if (!ensureCustomerIsActive(customer, res)) return

    const name = String(req.body?.name || '').trim()
    const phone = String(req.body?.phone || '').trim()
    const emailRaw = String(req.body?.email || '').trim().toLowerCase()

    if (!name) {
      return res.status(400).json({ message: 'שם מלא הוא שדה חובה' })
    }
    if (!phone) {
      return res.status(400).json({ message: 'טלפון הוא שדה חובה' })
    }
    if (!emailRaw) {
      return res.status(400).json({ message: 'אימייל הוא שדה חובה' })
    }
    if (!/^\S+@\S+\.\S+$/.test(emailRaw)) {
      return res.status(400).json({ message: 'פורמט אימייל לא תקין' })
    }

    const existingByEmail = await Customer.findOne({
      _id: { $ne: customer._id },
      email: emailRaw,
    }).select('_id')
    if (existingByEmail) {
      return res.status(409).json({ message: 'האימייל כבר קיים במערכת' })
    }

    customer.name = name
    customer.phone = phone
    customer.email = emailRaw
    await customer.save()

    // Keep booking cards aligned with updated customer details
    await Booking.updateMany(
      { customer: customer._id },
      {
        $set: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
      }
    )

    return res.json({
      message: 'הפרטים האישיים עודכנו בהצלחה',
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/purchases/:id/refund-request - customer submits refund request
router.post('/purchases/:id/refund-request', authenticateToken, async (req, res, next) => {
  try {
    if (!ensureCustomerIsActive(req.customer, res)) return
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      customer: req.customerId,
    })

    if (!purchase) {
      return res.status(404).json({ message: 'רכישה לא נמצאה' })
    }

    if (purchase.status !== 'completed') {
      return res.status(400).json({ message: 'ניתן לבקש החזר רק עבור רכישה שהושלמה' })
    }

    if (purchase.provider !== 'cardcom') {
      return res.status(400).json({ message: 'בקשת החזר זמינה רק לרכישות שבוצעו דרך Cardcom' })
    }

    if (['requested', 'approved', 'refunded'].includes(purchase.refundStatus)) {
      return res.status(400).json({ message: 'כבר קיימת בקשת החזר לרכישה זו' })
    }

    purchase.refundStatus = 'requested'
    purchase.refundRequestedAt = new Date()
    purchase.refundRequestReason = String(req.body?.reason || '').trim()
    await purchase.save()

    return res.json({
      message: 'בקשת החזר נשלחה בהצלחה',
      data: {
        purchaseId: purchase._id,
        refundStatus: purchase.refundStatus,
        refundRequestedAt: purchase.refundRequestedAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/regulations-questionnaire
// Save "תקנון ושאלון" answers for the currently authenticated customer
router.post('/regulations-questionnaire', authenticateToken, async (req, res, next) => {
  try {
    const { answers } = req.body || {}

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'Invalid questionnaire payload' })
    }

    // At minimum we require user to confirm acceptance
    if (answers.accepted !== true) {
      return res.status(400).json({ message: 'יש לאשר שקראת ומילאת את השאלון' })
    }

    const customer = req.customer
    if (!customer) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    customer.regulationsQuestionnaire = customer.regulationsQuestionnaire || {}
    customer.regulationsQuestionnaire.completed = true
    customer.regulationsQuestionnaire.completedAt = new Date()
    customer.regulationsQuestionnaire.answers = answers

    await customer.save()

    res.status(200).json({
      message: 'השאלון נשמר בהצלחה',
      data: {
        completed: true,
        completedAt: customer.regulationsQuestionnaire.completedAt
      }
    })
  } catch (error) {
    console.error('Regulations questionnaire error:', error)
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

    const customer = await Customer.findById(req.customerId)

    if (!customer) {
      return res.status(404).json({ message: 'לקוח לא נמצא' })
    }
    if (!ensureCustomerIsActive(customer, res)) return

    const entitlement = await computeSessionEntitlementForCustomerId(req.customerId)

    if (
      !entitlement.bookingUnlimitedBySubscription &&
      entitlement.availableSessions <= 0
    ) {
      return res.status(400).json({ 
        message: 'אין לך מפגשים זמינים בתקופה הנוכחית. נא לרכוש מסלול נוסף או לפנות לתמיכה.' 
      })
    }

    if (
      entitlement.activeSubscription &&
      !preferredDateWithinSubscription(preferredDate, entitlement.activeSubscription)
    ) {
      return res.status(400).json({
        message:
          'תאריך הפגישה מחוץ לתקופת המנוי שלך. בחר תאריך בתוך תקופת הליווי או פנה למנהל.',
      })
    }

    // בדוק אם יש כבר פגישה באותו תאריך ושעה (אם יש שעה)
    if (preferredDate && preferredTime) {
      const dateStart = new Date(preferredDate)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(preferredDate)
      dateEnd.setHours(23, 59, 59, 999)

      const existingBooking = await Booking.findOne({
        preferredDate: {
          $gte: dateStart,
          $lte: dateEnd
        },
        preferredTime: preferredTime,
        status: { $in: ['pending', 'confirmed'] } // רק פגישות פעילות
      })

      if (existingBooking) {
        return res.status(400).json({
          message: 'יש כבר פגישה בתאריך ושעה זו. אנא בחר תאריך או שעה אחרת.'
        })
      }
    } else if (preferredDate) {
      // אם אין שעה, בדוק רק לפי תאריך
      const dateStart = new Date(preferredDate)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(preferredDate)
      dateEnd.setHours(23, 59, 59, 999)

      const existingBooking = await Booking.findOne({
        preferredDate: {
          $gte: dateStart,
          $lte: dateEnd
        },
        status: { $in: ['pending', 'confirmed'] } // רק פגישות פעילות
      })

      if (existingBooking) {
        return res.status(400).json({
          message: 'יש כבר פגישה בתאריך זה. אנא בחר תאריך אחר.'
        })
      }
    }

    const meetingTypeBody = meetingType === 'zoom' ? 'zoom' : 'frontend'
    if (preferredTime && String(preferredTime).trim() !== '') {
      const ymd =
        typeof preferredDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(String(preferredDate).trim())
          ? String(preferredDate).trim()
          : formatYmd(new Date(preferredDate))
      const allowed = await isPreferredTimeAllowed(
        ymd,
        String(preferredTime).trim(),
        meetingTypeBody,
        false
      )
      if (!allowed) {
        return res.status(400).json({
          message: 'השעה שבחרת אינה זמינה יותר. אנא בחר תאריך או שעה אחרת.',
        })
      }
    }

    // צור את הפגישה
    const booking = new Booking({
      customer: req.customerId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      preferredDate,
      preferredTime: preferredTime || '',
      meetingType: meetingTypeBody,
      notes: notes || '',
      status: 'pending',
      isIntroMeeting: false // פגישה רגילה (לא היכרות)
    })

    await booking.save()

    // הוסף את הפגישה ללקוח
    customer.bookings.push(booking._id)
    await customer.save()

    // שלח אימייל אישור פגישה
    if (customer.email) {
      console.log('📧 Attempting to send booking confirmation email to:', customer.email)
      try {
        const emailResult = await sendRegularMeetingConfirmationEmail(booking)
        if (emailResult && emailResult.success) {
          console.log('✅ Booking confirmation email sent successfully')
        } else {
          console.error('❌ Failed to send booking confirmation email:', emailResult?.error || emailResult?.message)
        }
      } catch (emailError) {
        console.error('❌ Error sending booking confirmation email:', emailError)
        // לא נכשל את הבקשה אם האימייל נכשל
      }
    } else {
      console.warn('⚠️  No email address for customer, skipping email')
    }

    res.status(201).json({
      message: 'פגישה נקבעה בהצלחה',
      data: {
        id: booking._id,
        preferredDate: booking.preferredDate,
        availableSessions: entitlement.bookingUnlimitedBySubscription
          ? entitlement.availableSessions
          : entitlement.availableSessions - 1,
      }
    })
  } catch (error) {
    console.error('Booking error:', error)
    next(error)
  }
})

// POST /api/auth/booking/:id/cancel - Customer cancel flow with 24h policy
router.post('/booking/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    if (!ensureCustomerIsActive(req.customer, res)) return
    const booking = await Booking.findOne({
      _id: req.params.id,
      customer: req.customerId,
    })
    if (!booking) {
      return res.status(404).json({ message: 'פגישה לא נמצאה' })
    }
    if (!['pending', 'confirmed', 'cancellation_requested'].includes(booking.status)) {
      return res.status(400).json({ message: 'לא ניתן לבטל פגישה בסטטוס זה' })
    }

    const now = new Date()
    const appointmentAt = getBookingDateTime(booking)
    const diffHours = (appointmentAt.getTime() - now.getTime()) / (1000 * 60 * 60)

    // אחרי מועד הפגישה או פחות מ-24 שעות: בקשת ביטול בלבד
    if (diffHours < CANCELLATION_FREE_WINDOW_HOURS) {
      if (booking.status === 'cancellation_requested') {
        return res.json({
          message: 'בקשת הביטול כבר נשלחה וממתינה לאישור מנהל',
          data: booking,
        })
      }
      booking.statusBeforeCancellationRequest =
        booking.status === 'pending' || booking.status === 'confirmed' ? booking.status : 'confirmed'
      booking.status = 'cancellation_requested'
      booking.cancellationRequestedAt = now
      booking.cancellationRequestedByCustomer = true
      await booking.save()
      return res.json({
        message: 'בקשת הביטול נשלחה למנהל לאישור',
        data: booking,
      })
    }

    booking.status = 'cancelled'
    booking.cancellationRequestedAt = null
    booking.cancellationRequestedByCustomer = false
    booking.statusBeforeCancellationRequest = null
    await booking.save()

    return res.json({
      message: 'הפגישה בוטלה בהצלחה',
      data: booking,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/messages - Get messages for authenticated customer
router.get('/messages', authenticateToken, async (req, res, next) => {
  try {
    const messages = await Message.find({
      recipients: req.customerId
    })
      .populate('recipients', 'name email phone')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      message: 'Messages retrieved successfully',
      data: messages
    })
  } catch (error) {
    next(error)
  }
})

export default router

