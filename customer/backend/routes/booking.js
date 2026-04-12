import express from 'express'
import Booking from '../models/Booking.js'
import Customer from '../models/Customer.js'
import { validateBooking } from '../validation/bookingValidation.js'
import { sendIntroMeetingConfirmationEmail, sendRegularMeetingConfirmationEmail } from '../services/emailService.js'
import {
  computeAvailabilityForDate,
  isPreferredTimeAllowed,
  formatYmd,
  getPublicWorkingHoursWeek,
} from '../services/availabilityService.js'

const router = express.Router()

// GET /api/booking/public-working-hours — שבוע לפי שעות "כללי" בניהול זמינות (לדף צור קשר)
router.get('/public-working-hours', async (req, res, next) => {
  try {
    const data = await getPublicWorkingHoursWeek()
    res.json({ data })
  } catch (error) {
    next(error)
  }
})

// GET /api/booking/availability?date=YYYY-MM-DD&meetingType=frontend|zoom&isIntroMeeting=true|false
router.get('/availability', async (req, res, next) => {
  try {
    const { date, meetingType, isIntroMeeting } = req.query

    if (!date) {
      return res.status(400).json({
        message: 'Missing required query parameter: date'
      })
    }

    const mt = meetingType === 'zoom' ? 'zoom' : 'frontend'
    const intro =
      isIntroMeeting === true ||
      isIntroMeeting === 'true' ||
      isIntroMeeting === '1'

    const computed = await computeAvailabilityForDate(String(date), mt, intro)

    if (computed.error) {
      return res.status(400).json({
        message: computed.error === 'Invalid date' ? 'Invalid date format' : computed.error
      })
    }

    res.json({
      data: {
        date: computed.date,
        treatmentKey: computed.treatmentKey,
        availableTimes: computed.availableTimes,
        unavailableTimes: computed.unavailableTimes,
        isDateUnavailable: computed.isDateUnavailable
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/booking
router.post('/', validateBooking, async (req, res, next) => {
  try {
    const { preferredDate, preferredTime } = req.body

    const isIntroMeetingBody = req.body.isIntroMeeting === true
    const meetingTypeBody = req.body.meetingType === 'zoom' ? 'zoom' : 'frontend'

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
          message: 'יש כבר פגישה בתאריך ושעה זו. אנא בחר תאריך או שעה אחרת.',
          errors: [{ field: 'preferredDate', message: 'תאריך ושעה תפוסים' }]
        })
      }

      const ymd =
        typeof preferredDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate.trim())
          ? preferredDate.trim()
          : formatYmd(new Date(preferredDate))

      const allowed = await isPreferredTimeAllowed(
        ymd,
        preferredTime,
        meetingTypeBody,
        isIntroMeetingBody
      )
      if (!allowed) {
        return res.status(400).json({
          message: 'השעה שבחרת אינה זמינה יותר. אנא בחר תאריך או שעה אחרת.',
          errors: [{ field: 'preferredTime', message: 'שעה לא זמינה' }]
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
          message: 'יש כבר פגישה בתאריך זה. אנא בחר תאריך אחר.',
          errors: [{ field: 'preferredDate', message: 'תאריך תפוס' }]
        })
      }
    }

    // בדוק אם זה פגישת היכרות
    const isIntroMeeting = req.body.isIntroMeeting === true
    
    // אם זה פגישת היכרות, בדוק אם הלקוח כבר קיים במערכת
    if (isIntroMeeting) {
      const searchConditions = []
      
      if (req.body.email) {
        searchConditions.push({ email: req.body.email.toLowerCase() })
      }
      
      if (req.body.phone) {
        searchConditions.push({ phone: req.body.phone })
      }
      
      // חפש לקוח לפי אחד מהתנאים (או)
      if (searchConditions.length > 0) {
        const existingCustomer = await Customer.findOne({
          $or: searchConditions
        })
        
        if (existingCustomer) {
          return res.status(400).json({
            message: 'לקוח עם פרטים אלה כבר קיים במערכת. אם אתה לקוח רשום, אנא התחבר לחשבון שלך כדי לקבוע פגישה.',
            errors: [{ 
              field: 'email', 
              message: 'לקוח קיים במערכת' 
            }]
          })
        }
      }
    }
    
    // נסה למצוא לקוח לפי אימייל או טלפון אם קיים (רק לפגישות רגילות)
    let customer = null
    if (!isIntroMeeting && (req.body.email || req.body.phone)) {
      const searchConditions = []
      
    if (req.body.email) {
        searchConditions.push({ email: req.body.email.toLowerCase() })
      }
      
      if (req.body.phone) {
        searchConditions.push({ phone: req.body.phone })
      }
      
      // חפש לקוח לפי אחד מהתנאים (או)
      if (searchConditions.length > 0) {
        customer = await Customer.findOne({
          $or: searchConditions
        })
      }
    }

    const bookingData = {
      ...req.body,
      customer: customer ? customer._id : undefined
    }

    const booking = new Booking(bookingData)
    await booking.save()
    
    // אם נמצא לקוח, הוסף את הפגישה ללקוח (רק לפגישות רגילות)
    if (customer) {
      customer.bookings.push(booking._id)
      await customer.save()
    }
    
    // שלח אימייל אישור פגישה
    if (booking.email) {
      console.log('📧 Attempting to send booking confirmation email to:', booking.email)
      console.log('📧 Is intro meeting:', booking.isIntroMeeting)
      try {
        let emailResult
        if (booking.isIntroMeeting) {
          emailResult = await sendIntroMeetingConfirmationEmail(booking)
        } else {
          emailResult = await sendRegularMeetingConfirmationEmail(booking)
        }
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
      console.warn('⚠️  No email address for booking, skipping email')
    }
    
    res.status(201).json({
      message: 'Booking request submitted successfully',
      data: {
        id: booking._id,
        name: booking.name,
        preferredDate: booking.preferredDate
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router

