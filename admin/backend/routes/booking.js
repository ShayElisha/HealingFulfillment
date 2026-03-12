import express from 'express'
import Booking from '../models/Booking.js'
import Customer from '../models/Customer.js'
import { validateBooking } from '../validation/bookingValidation.js'
import { sendIntroMeetingConfirmationEmail, sendRegularMeetingConfirmationEmail } from '../services/emailService.js'

const router = express.Router()

// POST /api/booking
router.post('/', validateBooking, async (req, res, next) => {
  try {
    const { preferredDate, preferredTime } = req.body

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

