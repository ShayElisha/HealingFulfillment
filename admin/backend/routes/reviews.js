import express from 'express'
import Review from '../models/Review.js'
import Customer from '../models/Customer.js'
import Subscription from '../models/Subscription.js'
import { authenticateToken } from '../middleware/auth.js'
import { deleteCloudinaryByUrl, isCloudinaryConfigured } from '../services/cloudinaryUpload.js'

const router = express.Router()
const VIDEO_REWARD_DAYS = 7

async function grantVideoRewardOnApprovalIfNeeded(review) {
  if (!review?.video?.url || review.videoRewardGrantedAt || !review.customer) {
    return { rewardApplied: false }
  }

  const subscription = await Subscription.findOne({ customer: review.customer }).sort({ endsAt: -1 })
  if (!subscription?.endsAt || subscription.status === 'cancelled') {
    return { rewardApplied: false, reason: 'no_active_subscription' }
  }

  const extendedEndsAt = new Date(subscription.endsAt)
  extendedEndsAt.setDate(extendedEndsAt.getDate() + VIDEO_REWARD_DAYS)
  subscription.endsAt = extendedEndsAt
  if (extendedEndsAt > new Date()) {
    subscription.status = 'active'
  }
  await subscription.save()

  review.videoRewardGrantedAt = new Date()
  await review.save()
  return { rewardApplied: true, newSubscriptionEndAt: extendedEndsAt }
}

async function deleteReviewVideoAssetIfExists(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return { deleted: false, skipped: true }
  }
  const isCloudinaryUrl = videoUrl.includes('res.cloudinary.com')
  if (!isCloudinaryUrl) {
    return { deleted: false, skipped: true }
  }
  if (!isCloudinaryConfigured()) {
    const err = new Error('Cloudinary is not configured on admin backend')
    err.status = 503
    throw err
  }
  const deleted = await deleteCloudinaryByUrl(videoUrl)
  if (!deleted) {
    const err = new Error('Failed to delete video asset from Cloudinary')
    err.status = 502
    throw err
  }
  return { deleted: true, skipped: false }
}

// GET /api/reviews - Get all approved reviews (public)
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .populate('customer', 'name')
      .select('customer customerName rating content video createdAt status')
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
    const { rating, content, video } = req.body

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
      video: video?.url
        ? {
            url: String(video.url).trim(),
            name: String(video.name || '').trim(),
            size: Number(video.size) || undefined,
            uploadedAt: video.uploadedAt ? new Date(video.uploadedAt) : new Date(),
          }
        : undefined,
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
    const { rating, content, video } = req.body

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
    if (video !== undefined) {
      review.video = video?.url
        ? {
            url: String(video.url).trim(),
            name: String(video.name || '').trim(),
            size: Number(video.size) || undefined,
            uploadedAt: video.uploadedAt ? new Date(video.uploadedAt) : new Date(),
          }
        : undefined
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

// Admin routes - Get all reviews (including pending); ?page=&limit=&reviewStatus=
router.get('/admin/all', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 60))
    const skip = (page - 1) * limit

    const rs = String(req.query.reviewStatus || 'all').trim()
    const listFilter = {}
    if (['pending', 'approved', 'rejected'].includes(rs)) listFilter.status = rs

    if (!usePaging) {
      const reviews = await Review.find(listFilter)
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .lean()
      return res.json({
        message: 'All reviews retrieved successfully',
        data: reviews,
      })
    }

    const [reviews, total, totalAll, pendingC, approvedC, rejectedC] = await Promise.all([
      Review.find(listFilter)
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(listFilter),
      Review.countDocuments({}),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
    ])

    res.json({
      message: 'All reviews retrieved successfully',
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        total: totalAll,
        pending: pendingC,
        approved: approvedC,
        rejected: rejectedC,
      },
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

    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    const wasApproved = review.status === 'approved'
    review.status = status
    review.approvedAt = status === 'approved' ? new Date() : undefined
    await review.save()

    let rewardMeta = { rewardApplied: false, newSubscriptionEndAt: null }
    if (status === 'approved' && !wasApproved) {
      const rewardResult = await grantVideoRewardOnApprovalIfNeeded(review)
      rewardMeta = {
        rewardApplied: rewardResult.rewardApplied,
        newSubscriptionEndAt: rewardResult.newSubscriptionEndAt || null,
      }
    }

    res.json({
      message: 'Review status updated successfully',
      data: review,
      meta: rewardMeta,
    })
  } catch (error) {
    next(error)
  }
})

// Admin route - Delete only review video (DB + Cloudinary)
router.delete('/admin/:id/video', async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }
    if (!review.video?.url) {
      return res.status(400).json({ message: 'No video found on this review' })
    }

    await deleteReviewVideoAssetIfExists(review.video.url)

    review.video = undefined
    await review.save()

    return res.json({
      message: 'Review video deleted successfully',
      data: review,
    })
  } catch (error) {
    next(error)
  }
})

// Admin route - Delete review (and video from Cloudinary if exists)
router.delete('/admin/:id', async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    if (review.video?.url) {
      await deleteReviewVideoAssetIfExists(review.video.url)
    }

    await Review.deleteOne({ _id: review._id })

    return res.json({
      message: 'Review deleted successfully',
      data: { id: String(review._id) },
    })
  } catch (error) {
    next(error)
  }
})

export default router

