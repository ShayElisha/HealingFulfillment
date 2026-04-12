import express from 'express'
import Booking from '../models/Booking.js'
import Customer from '../models/Customer.js'
import { validateBooking } from '../validation/bookingValidation.js'
import { sendIntroMeetingConfirmationEmail, sendRegularMeetingConfirmationEmail } from '../services/emailService.js'
import { isPreferredTimeAllowed, formatYmd } from '../services/availabilityService.js'

const router = express.Router()

// GET /api/booking - Get all bookings; ?page=&limit=&status= לעימוד
router.get('/', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 80))
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status
    }

    if (!usePaging) {
      const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean()
      return res.json({
        message: 'Bookings retrieved successfully',
        data: bookings,
      })
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
    ])

    res.json({
      message: 'Bookings retrieved successfully',
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
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
          message: 'השעה שבחרת אינה זמינה לפי הגדרות היומן.',
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

    // נסה למצוא לקוח לפי אימייל אם קיים
    let customer = null
    if (req.body.email) {
      customer = await Customer.findOne({ email: req.body.email.toLowerCase() })
    }

    const bookingData = {
      ...req.body,
      customer: customer ? customer._id : undefined
    }

    const booking = new Booking(bookingData)
    await booking.save()
    
    // אם נמצא לקוח, הוסף את הפגישה ללקוח
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

