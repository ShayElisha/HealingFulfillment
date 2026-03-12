import express from 'express'
import Review from '../models/Review.js'
import Customer from '../models/Customer.js'
import Booking from '../models/Booking.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/reviews - Get all approved reviews (public)
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.json({
      message: 'Reviews retrieved successfully',
      data: reviews
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/reviews/stats - Get review statistics (public)
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ])

    if (stats.length === 0) {
      return res.json({
        message: 'Review statistics retrieved successfully',
        data: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      })
    }

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    stats[0].ratingDistribution.forEach(rating => {
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1
    })

    res.json({
      message: 'Review statistics retrieved successfully',
      data: {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
        ratingDistribution
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/reviews - Create review (authenticated customer)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { rating, content } = req.body

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Review content is required' })
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: 'Review content cannot exceed 1000 characters' })
    }

    // Check if customer has at least one completed booking
    const completedBookings = await Booking.countDocuments({
      customer: req.customerId,
      status: 'completed'
    })

    if (completedBookings === 0) {
      return res.status(400).json({ 
        message: 'ניתן לכתוב ביקורת רק לאחר השלמת לפחות פגישה אחת' 
      })
    }

    // Check if customer already wrote a review
    const existingReview = await Review.findOne({ customer: req.customerId })
    if (existingReview) {
      return res.status(400).json({ 
        message: 'כבר כתבת ביקורת. ניתן לערוך את הביקורת הקיימת.' 
      })
    }

    // Get customer details
    const customer = await Customer.findById(req.customerId)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    // Create review
    const review = new Review({
      customer: req.customerId,
      customerName: customer.name,
      rating: Math.round(rating),
      content: content.trim(),
      status: 'pending'
    })

    await review.save()

    res.status(201).json({
      message: 'ביקורת נשלחה בהצלחה וממתינה לאישור',
      data: review
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/reviews/:id - Update review (authenticated customer - only their own)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { rating, content } = req.body

    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    // Check if review belongs to the authenticated customer
    if (review.customer.toString() !== req.customerId) {
      return res.status(403).json({ message: 'You can only edit your own review' })
    }

    // Validation
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' })
      }
      review.rating = Math.round(rating)
    }
    if (content !== undefined) {
      if (content.trim().length === 0) {
        return res.status(400).json({ message: 'Review content is required' })
      }
      if (content.length > 1000) {
        return res.status(400).json({ message: 'Review content cannot exceed 1000 characters' })
      }
      review.content = content.trim()
    }

    // Reset status to pending if it was approved/rejected
    if (review.status !== 'pending') {
      review.status = 'pending'
      review.approvedAt = undefined
    }

    await review.save()

    res.json({
      message: 'ביקורת עודכנה בהצלחה',
      data: review
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/reviews/my-review - Get customer's own review (authenticated)
router.get('/my-review', authenticateToken, async (req, res, next) => {
  try {
    const review = await Review.findOne({ customer: req.customerId })
    
    if (!review) {
      return res.json({
        message: 'No review found',
        data: null
      })
    }

    res.json({
      message: 'Review retrieved successfully',
      data: review
    })
  } catch (error) {
    next(error)
  }
})

// Admin routes - Get all reviews (including pending)
router.get('/admin/all', async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      message: 'All reviews retrieved successfully',
      data: reviews
    })
  } catch (error) {
    next(error)
  }
})

// Admin route - Update review status
router.put('/admin/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        approvedAt: status === 'approved' ? new Date() : undefined
      },
      { new: true, runValidators: true }
    )

    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    res.json({
      message: 'Review status updated successfully',
      data: review
    })
  } catch (error) {
    next(error)
  }
})

export default router

