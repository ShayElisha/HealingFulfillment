import express from 'express'
import Booking from '../models/Booking.js'
import Customer from '../models/Customer.js'
import { validateBooking } from '../validation/bookingValidation.js'

const router = express.Router()

// POST /api/booking
router.post('/', validateBooking, async (req, res, next) => {
  try {
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

