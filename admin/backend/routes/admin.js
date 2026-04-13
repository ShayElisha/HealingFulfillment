import express from 'express'
import Category from '../models/Category.js'
import Course from '../models/Course.js'
import Purchase from '../models/Purchase.js'
import Booking from '../models/Booking.js'
import Customer from '../models/Customer.js'
import { 
  sendBookingConfirmedEmail, 
  sendBookingCancelledEmail, 
  sendBookingCompletedEmail,
  sendSessionSummaryEmail,
  sendPurchaseCompletedEmail,
  sendPurchaseCancelledEmail
} from '../services/emailService.js'
import Transaction from '../models/Transaction.js'
import { applyAutoCoachingWindowIfNeeded } from '../utils/coachingPurchaseWindow.js'
import { createSubscriptionForCompletedPurchase } from '../utils/subscriptionFromPurchase.js'

const router = express.Router()

const COACHING_DEFAULT_MONTHS = 3

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/admin/auth/verify - verify admin access token
router.get('/auth/verify', (req, res) => {
  res.json({
    message: 'Admin token is valid',
    data: {
      customerId: req.customer?._id || req.customerId,
      email: req.customer?.email,
      name: req.customer?.name,
      isAdmin: req.customer?.isAdmin === true,
    },
  })
})

/** משך ליווי בחודשים; תאריכי ליווי ישנים מתאפסים (מקור האמת הוא חודשים) */
function normalizeCoursePayload(body) {
  if (!body || typeof body !== 'object') return body
  const out = { ...body }
  let months = Number(out.coachingProcessMonths)
  if (!Number.isFinite(months)) months = parseInt(out.coachingProcessMonths, 10)
  if (!Number.isFinite(months) || months < 1) months = COACHING_DEFAULT_MONTHS
  if (months > 60) months = 60
  out.coachingProcessMonths = months
  out.coachingProcessStartAt = null
  out.coachingProcessEndAt = null
  return out
}

// ========== CATEGORIES ==========

// GET /api/admin/categories - Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    console.log('Fetching categories...')
    const categories = [...(await Category.find().lean())].sort((a, b) => {
      const ao = Number(a.order) || 0
      const bo = Number(b.order) || 0
      if (ao !== bo) return ao - bo
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })
    console.log(`Found ${categories.length} categories`)
    
    // Normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const normalizedCategories = categories.map((cat, index) => {
      try {
        // Convert therapeuticApproach from string to array if needed
        if (cat.therapeuticApproach && typeof cat.therapeuticApproach === 'string' && cat.therapeuticApproach.trim() !== '') {
          cat.therapeuticApproach = [cat.therapeuticApproach]
        } else if (!Array.isArray(cat.therapeuticApproach)) {
          cat.therapeuticApproach = []
        }
        
        // Ensure symptoms and copingMethods are arrays
        if (!Array.isArray(cat.symptoms)) {
          cat.symptoms = []
        }
        if (!Array.isArray(cat.copingMethods)) {
          cat.copingMethods = []
        }
        
        return cat
      } catch (err) {
        console.error(`Error normalizing category ${index}:`, err)
        // Return category with safe defaults
        return {
          ...cat,
          therapeuticApproach: Array.isArray(cat.therapeuticApproach) ? cat.therapeuticApproach : [],
          symptoms: Array.isArray(cat.symptoms) ? cat.symptoms : [],
          copingMethods: Array.isArray(cat.copingMethods) ? cat.copingMethods : []
        }
      }
    })
    
    console.log('Categories normalized successfully')
    res.json({
      message: 'Categories retrieved successfully',
      data: normalizedCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// POST /api/admin/categories - Create new category
router.post('/categories', async (req, res, next) => {
  try {
    // Ensure files array exists and has correct structure
    // Also normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const categoryData = {
      ...req.body,
      files: req.body.files || [],
      symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms : [],
      copingMethods: Array.isArray(req.body.copingMethods) ? req.body.copingMethods : [],
      therapeuticApproach: Array.isArray(req.body.therapeuticApproach) 
        ? req.body.therapeuticApproach 
        : []
    }
    const category = new Category(categoryData)
    await category.save()
    
    // Normalize the response
    const categoryObj = category.toObject ? category.toObject() : category
    if (!Array.isArray(categoryObj.therapeuticApproach)) {
      categoryObj.therapeuticApproach = []
    }
    if (!Array.isArray(categoryObj.symptoms)) {
      categoryObj.symptoms = []
    }
    if (!Array.isArray(categoryObj.copingMethods)) {
      categoryObj.copingMethods = []
    }
    
    res.status(201).json({
      message: 'Category created successfully',
      data: categoryObj
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    console.error('Error creating category:', error)
    next(error)
  }
})

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', async (req, res, next) => {
  try {
    // Ensure files array exists and has correct structure
    // Also normalize therapeuticApproach, symptoms, and copingMethods to arrays
    const updateData = {
      ...req.body,
      files: req.body.files || [],
      symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms : [],
      copingMethods: Array.isArray(req.body.copingMethods) ? req.body.copingMethods : [],
      therapeuticApproach: Array.isArray(req.body.therapeuticApproach) 
        ? req.body.therapeuticApproach 
        : (req.body.therapeuticApproach && typeof req.body.therapeuticApproach === 'string' && req.body.therapeuticApproach.trim() !== ''
          ? [req.body.therapeuticApproach]
          : [])
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    
    // Normalize the response
    const categoryObj = category.toObject()
    if (!Array.isArray(categoryObj.therapeuticApproach)) {
      categoryObj.therapeuticApproach = []
    }
    if (!Array.isArray(categoryObj.symptoms)) {
      categoryObj.symptoms = []
    }
    if (!Array.isArray(categoryObj.copingMethods)) {
      categoryObj.copingMethods = []
    }
    
    res.json({
      message: 'Category updated successfully',
      data: categoryObj
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    console.error('Error updating category:', error)
    next(error)
  }
})

// DELETE /api/admin/categories/:id - Delete category
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    
    res.json({
      message: 'Category deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// ========== COURSES ==========

// GET /api/admin/courses - Get all courses
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .lean()
    res.json({
      message: 'Courses retrieved successfully',
      data: courses
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

// GET /api/admin/courses/:id - Get single course
router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.json({
      message: 'Course retrieved successfully',
      data: course
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/courses - Create new course
router.post('/courses', async (req, res, next) => {
  try {
    const course = new Course(normalizeCoursePayload(req.body))
    await course.save()
    res.status(201).json({
      message: 'Course created successfully',
      data: course
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    next(error)
  }
})

// PUT /api/admin/courses/:id - Update course
router.put('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      normalizeCoursePayload(req.body),
      { new: true, runValidators: true }
    )
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.json({
      message: 'Course updated successfully',
      data: course
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    next(error)
  }
})

// DELETE /api/admin/courses/:id - Delete course
router.delete('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    res.json({
      message: 'Course deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// ========== PURCHASES ==========

// GET /api/admin/purchases - Get all purchases
router.get('/purchases', async (req, res, next) => {
  try {
    const purchases = await Purchase.find()
      .populate({
        path: 'course',
        select: 'title price',
        // Handle cases where course might be deleted
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .lean()
    
    // Filter out purchases with null courses if needed, or keep them
    res.json({
      message: 'Purchases retrieved successfully',
      data: purchases
    })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

// PUT /api/admin/purchases/:id/status - Update purchase status
router.put('/purchases/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    
    // Get the purchase before updating to check previous status
    const oldPurchase = await Purchase.findById(req.params.id)
    if (!oldPurchase) {
      return res.status(404).json({ message: 'Purchase not found' })
    }
    
    const purchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('course', 'title price').populate('customer', 'name email')
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' })
    }
    
    // If status changed to 'completed' and wasn't completed before, create income transaction
    if (status === 'completed' && oldPurchase.status !== 'completed') {
      try {
        // Check if transaction already exists for this purchase
        const existingTransaction = await Transaction.findOne({ purchase: purchase._id })
        
        if (!existingTransaction) {
          // Map payment method from purchase to transaction format
          const paymentMethodMap = {
            'credit_card': 'credit_card',
            'bank_transfer': 'bank_transfer',
            'paypal': 'bank_transfer', // PayPal is similar to bank transfer
            'other': 'other'
          }
          
          const transaction = new Transaction({
            type: 'income',
            category: 'course_sales',
            amount: purchase.price,
            description: `רכישת מסלול: ${purchase.course?.title || 'מסלול'}`,
            date: new Date(),
            paymentMethod: paymentMethodMap[purchase.paymentMethod] || 'other',
            customer: purchase.customer?._id || purchase.customer || null,
            purchase: purchase._id,
            notes: `נוצר אוטומטית מרכישה #${purchase._id}`
          })
          
          await transaction.save()
          console.log(`✅ Created income transaction for purchase ${purchase._id}: ₪${purchase.price}`)
        } else {
          console.log(`ℹ️ Transaction already exists for purchase ${purchase._id}`)
        }
      } catch (transactionError) {
        // Log error but don't fail the purchase update
        console.error('Error creating transaction for purchase:', transactionError)
      }
      
      // Send email notification for completed purchase
      if (purchase.customer) {
        try {
          const customer = await Customer.findById(purchase.customer)
          if (customer && customer.email) {
            const course = await Course.findById(purchase.course)
            if (course) {
              const emailResult = await sendPurchaseCompletedEmail(purchase, course, customer)
              if (emailResult && emailResult.success) {
                console.log(`✅ Purchase completed email sent to ${customer.email}`)
              } else {
                console.error('❌ Failed to send purchase completed email:', emailResult?.error || emailResult?.message)
              }
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending purchase completed email:', emailError)
        }
      }

      try {
        await applyAutoCoachingWindowIfNeeded(purchase._id)
      } catch (coachingErr) {
        console.error('[coaching-window:auto] admin purchase status', coachingErr?.message || coachingErr)
      }

      try {
        await createSubscriptionForCompletedPurchase(purchase._id)
      } catch (subErr) {
        console.error('[subscription] admin purchase status', subErr?.message || subErr)
      }
    }
    
    // If status changed to 'cancelled', send cancellation email
    if (status === 'cancelled' && oldPurchase.status !== 'cancelled') {
      if (purchase.customer) {
        try {
          const customer = await Customer.findById(purchase.customer)
          if (customer && customer.email) {
            const course = await Course.findById(purchase.course)
            if (course) {
              const cancellationReason = req.body.cancellationReason || undefined
              const emailResult = await sendPurchaseCancelledEmail(purchase, course, customer, cancellationReason)
              if (emailResult && emailResult.success) {
                console.log(`✅ Purchase cancelled email sent to ${customer.email}`)
              } else {
                console.error('❌ Failed to send purchase cancelled email:', emailResult?.error || emailResult?.message)
              }
            }
          }
        } catch (emailError) {
          console.error('❌ Error sending purchase cancelled email:', emailError)
        }
      }
    }
    
    // If status changed from 'completed' to something else, optionally delete the transaction
    // (or you might want to keep it for historical records)
    
    res.json({
      message: 'Purchase status updated successfully',
      data: purchase
    })
  } catch (error) {
    next(error)
  }
})

// ========== BOOKINGS ==========

// GET /api/admin/bookings — ללא page/limit: כמו קודם (כל הרשומות). עם עימוד: tab, status, meetingType, search
router.get('/bookings', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    const tab = String(req.query.tab || '').trim()
    const statusQ = String(req.query.status || 'all').trim()
    const meetingTypeQ = String(req.query.meetingType || 'all').trim()
    const searchRaw = String(req.query.search || '').trim()

    let filter = {}

    if (tab === 'intro') {
      filter.isIntroMeeting = true
      if (statusQ !== 'all') filter.status = statusQ
      else filter.status = { $nin: ['completed', 'cancelled'] }
    } else if (tab === 'regular') {
      filter.isIntroMeeting = false
      if (statusQ !== 'all') filter.status = statusQ
      else filter.status = { $nin: ['completed', 'cancelled'] }
    } else if (tab === 'history') {
      filter.status = { $in: ['completed', 'cancelled'] }
    }

    if (meetingTypeQ === 'frontend' || meetingTypeQ === 'zoom') {
      filter.meetingType = meetingTypeQ
    }

    if (searchRaw) {
      const rx = new RegExp(escapeRegex(searchRaw), 'i')
      const searchPart = { $or: [{ name: rx }, { email: rx }, { phone: rx }] }
      filter =
        Object.keys(filter).length === 0
          ? searchPart
          : { $and: [filter, searchPart] }
    }

    // מיון לפי מועד הפגישה: פעילות — מהקרוב ביותר קדימה; היסטוריה — מהאחרונה אחורה
    const sortBySlot =
      tab === 'history'
        ? { preferredDate: -1, preferredTime: -1 }
        : { preferredDate: 1, preferredTime: 1 }

    if (!usePaging) {
      const bookings = await Booking.find(filter).sort(sortBySlot).lean()
      return res.json({
        message: 'Bookings retrieved successfully',
        data: bookings,
      })
    }

    const [
      bookings,
      listTotal,
      totalAll,
      pendingAll,
      confirmedAll,
      completedAll,
      cancelledAll,
      introOpen,
      regularOpen,
      allIntro,
      allRegular,
    ] = await Promise.all([
      Booking.find(filter).sort(sortBySlot).skip(skip).limit(limit).lean(),
      Booking.countDocuments(filter),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ isIntroMeeting: true, status: { $nin: ['completed', 'cancelled'] } }),
      Booking.countDocuments({ isIntroMeeting: false, status: { $nin: ['completed', 'cancelled'] } }),
      Booking.countDocuments({ isIntroMeeting: true }),
      Booking.countDocuments({ isIntroMeeting: false }),
    ])

    res.json({
      message: 'Bookings retrieved successfully',
      data: bookings,
      pagination: {
        page,
        limit,
        total: listTotal,
        pages: Math.max(1, Math.ceil(listTotal / limit)),
      },
      stats: {
        total: totalAll,
        pending: pendingAll,
        confirmed: confirmedAll,
        completed: completedAll,
        cancelled: cancelledAll,
        introOpen,
        regularOpen,
        intro: allIntro,
        regular: allRegular,
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    next(error)
  }
})

// PUT /api/admin/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    
    // Get the booking before updating to check previous status
    const oldBooking = await Booking.findById(req.params.id)
    if (!oldBooking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    // Send email notifications based on status change
    if (booking.email) {
      try {
        let emailResult = null
        
        if (status === 'confirmed' && oldBooking.status !== 'confirmed') {
          // Send confirmation email
          emailResult = await sendBookingConfirmedEmail(booking)
          if (emailResult && emailResult.success) {
            console.log(`✅ Booking confirmed email sent to ${booking.email}`)
          } else {
            console.error('❌ Failed to send booking confirmed email:', emailResult?.error || emailResult?.message)
          }
        } else if (status === 'cancelled' && oldBooking.status !== 'cancelled') {
          // Send cancellation email
          const cancellationReason = req.body.cancellationReason || undefined
          emailResult = await sendBookingCancelledEmail(booking, cancellationReason)
          if (emailResult && emailResult.success) {
            console.log(`✅ Booking cancelled email sent to ${booking.email}`)
          } else {
            console.error('❌ Failed to send booking cancelled email:', emailResult?.error || emailResult?.message)
          }
        } else if (status === 'completed' && oldBooking.status !== 'completed') {
          // Send completion email
          emailResult = await sendBookingCompletedEmail(booking)
          if (emailResult && emailResult.success) {
            console.log(`✅ Booking completed email sent to ${booking.email}`)
          } else {
            console.error('❌ Failed to send booking completed email:', emailResult?.error || emailResult?.message)
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending booking status email:', emailError)
        // Don't fail the request if email fails
      }
    }
    
    res.json({
      message: 'Booking status updated successfully',
      data: booking
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/admin/bookings/:id/session-summary - Update session summary
router.put('/bookings/:id/session-summary', async (req, res, next) => {
  try {
    const { sessionSummary } = req.body
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { sessionSummary: sessionSummary || '' },
      { new: true, runValidators: true }
    )
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    // Send session summary email to customer
    if (booking.email && sessionSummary && sessionSummary.trim() !== '') {
      try {
        const emailResult = await sendSessionSummaryEmail(booking)
        if (emailResult && emailResult.success) {
          console.log(`✅ Session summary email sent to ${booking.email}`)
        } else {
          console.error('❌ Failed to send session summary email:', emailResult?.error || emailResult?.message)
        }
      } catch (emailError) {
        console.error('❌ Error sending session summary email:', emailError)
        // Don't fail the request if email fails
      }
    }
    
    res.json({
      message: 'Session summary updated successfully',
      data: booking
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/admin/bookings/:id/zoom-link - Update zoom link
router.put('/bookings/:id/zoom-link', async (req, res, next) => {
  try {
    const { zoomLink } = req.body
    
    // Allow empty string to delete zoom link
    if (zoomLink === undefined || zoomLink === null) {
      return res.status(400).json({ message: 'Zoom link is required' })
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { zoomLink: typeof zoomLink === 'string' ? zoomLink.trim() : '' },
      { new: true, runValidators: true }
    )
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    
    res.json({
      message: 'Zoom link updated successfully',
      data: booking
    })
  } catch (error) {
    console.error('Error updating zoom link:', error)
    next(error)
  }
})

// DELETE /api/admin/bookings/:id - Delete booking
router.delete('/bookings/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).lean()
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    await Booking.findByIdAndDelete(req.params.id)

    // ניקוי שיוך היסטורי אצל לקוח (אם קיים)
    await Customer.updateMany(
      { bookings: booking._id },
      { $pull: { bookings: booking._id } }
    )

    res.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    next(error)
  }
})

export default router

