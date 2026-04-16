import express from 'express'
import multer from 'multer'
import path from 'path'
import os from 'os'
import fs from 'fs'
import Review from '../models/Review.js'
import Customer from '../models/Customer.js'
import Subscription from '../models/Subscription.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  uploadLocalFileToCloudinary,
  isCloudinaryConfigured,
  cloudinaryErrorToMessage,
} from '../services/cloudinaryUpload.js'
import { catchMulterUpload } from '../middleware/multerCatch.js'

const router = express.Router()
const REVIEW_WINDOW_DAYS = 14
const VIDEO_REWARD_DAYS = 7

function buildReviewEligibility(subscription) {
  if (!subscription?.endsAt) {
    return {
      canSubmit: false,
      reason: 'review_window_unavailable',
      message: 'חוות דעת זמינה בשבועיים האחרונים של תהליך פעיל.',
      reviewWindowStartAt: null,
      processEndsAt: null,
    }
  }

  const processEndsAt = new Date(subscription.endsAt)
  const reviewWindowStartAt = new Date(processEndsAt)
  reviewWindowStartAt.setDate(reviewWindowStartAt.getDate() - REVIEW_WINDOW_DAYS)
  const now = new Date()

  if (now < reviewWindowStartAt) {
    return {
      canSubmit: false,
      reason: 'review_too_early',
      message: 'ניתן לשלוח חוות דעת רק בשבועיים האחרונים של התהליך.',
      reviewWindowStartAt,
      processEndsAt,
    }
  }

  return {
    canSubmit: true,
    reason: 'review_window_open',
    message: '',
    reviewWindowStartAt,
    processEndsAt,
  }
}

async function getLatestCustomerSubscription(customerId) {
  if (!customerId) return null
  return Subscription.findOne({ customer: customerId })
    .sort({ endsAt: -1 })
    .select('startedAt endsAt status')
}

async function ensureReviewWindow(customerId) {
  const subscription = await getLatestCustomerSubscription(customerId)
  const eligibility = buildReviewEligibility(subscription)
  return { subscription, eligibility }
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.warn('Temp file unlink:', e.message)
  }
}

function maybeVideoPayload(videoData) {
  if (!videoData || typeof videoData !== 'object') return undefined
  const url = String(videoData.url || '').trim()
  if (!url) return undefined
  return {
    url,
    name: String(videoData.name || '').trim(),
    size: Number(videoData.size) || undefined,
    uploadedAt: videoData.uploadedAt ? new Date(videoData.uploadedAt) : new Date(),
  }
}

async function grantVideoRewardIfNeeded({ review, customerId }) {
  if (!review?.video?.url || review.videoRewardGrantedAt) {
    return { rewardApplied: false }
  }
  const subscription = await getLatestCustomerSubscription(customerId)
  if (!subscription?.endsAt) {
    return { rewardApplied: false, reason: 'no_subscription' }
  }

  const extendedEndsAt = new Date(subscription.endsAt)
  extendedEndsAt.setDate(extendedEndsAt.getDate() + VIDEO_REWARD_DAYS)
  subscription.endsAt = extendedEndsAt
  if (extendedEndsAt > new Date() && subscription.status !== 'cancelled') {
    subscription.status = 'active'
  }
  await subscription.save()

  review.videoRewardGrantedAt = new Date()
  await review.save()
  return { rewardApplied: true, newSubscriptionEndAt: extendedEndsAt }
}

function tmpFilename(_req, file, cb) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  const ext = path.extname(file.originalname || '').toLowerCase()
  cb(null, `hf-review-${uniqueSuffix}${ext || ''}`)
}

const tmpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: tmpFilename,
})

const reviewVideoUpload = multer({
  storage: tmpStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('video/')) return cb(null, true)
    cb(new Error('יש להעלות קובץ וידאו בלבד.'))
  },
})

// GET /api/reviews - Get all approved reviews (public)
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ status: 'approved' })
      .select('customerName rating content video createdAt')
      .sort({ createdAt: -1 })
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

// POST /api/reviews/upload-video - Upload review video (authenticated customer)
router.post(
  '/upload-video',
  authenticateToken,
  catchMulterUpload(reviewVideoUpload.single('file')),
  async (req, res) => {
    if (!isCloudinaryConfigured()) {
      safeUnlink(req.file?.path)
      return res.status(503).json({ message: 'העלאת קבצים לא מוגדרת (חסר Cloudinary)' })
    }
    try {
      if (!req.file?.path) {
        return res.status(400).json({ message: 'לא הועלה קובץ' })
      }
      const result = await uploadLocalFileToCloudinary(req.file.path, {
        folder: 'reviews/videos',
        mimetype: req.file.mimetype,
      })
      safeUnlink(req.file.path)
      return res.json({
        message: 'הסרטון הועלה בהצלחה',
        data: {
          name: req.file.originalname,
          url: result.secure_url,
          type: 'video',
          size: result.bytes,
          uploadedAt: new Date(),
        },
      })
    } catch (error) {
      safeUnlink(req.file?.path)
      const code = Number(error?.http_code)
      const status = Number.isFinite(code) && code >= 400 && code < 600 ? code : 502
      return res.status(status).json({
        message: cloudinaryErrorToMessage(error),
      })
    }
  }
)

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

    const { eligibility } = await ensureReviewWindow(req.customerId)
    if (!eligibility.canSubmit) {
      return res.status(400).json({ message: eligibility.message, meta: { eligibility } })
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
      video: maybeVideoPayload(video),
      status: 'pending'
    })

    await review.save()
    const rewardResult = await grantVideoRewardIfNeeded({ review, customerId: req.customerId })

    res.status(201).json({
      message: 'ביקורת נשלחה בהצלחה וממתינה לאישור',
      data: review,
      meta: {
        rewardApplied: rewardResult.rewardApplied,
        newSubscriptionEndAt: rewardResult.newSubscriptionEndAt || null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/reviews/:id - Update review (authenticated customer - only their own)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { rating, content, video } = req.body
    const { eligibility } = await ensureReviewWindow(req.customerId)
    if (!eligibility.canSubmit) {
      return res.status(400).json({ message: eligibility.message, meta: { eligibility } })
    }


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
      const payload = maybeVideoPayload(video)
      review.video = payload || undefined
    }

    // Reset status to pending if it was approved/rejected
    if (review.status !== 'pending') {
      review.status = 'pending'
      review.approvedAt = undefined
    }

    await review.save()
    const rewardResult = await grantVideoRewardIfNeeded({ review, customerId: req.customerId })

    res.json({
      message: 'ביקורת עודכנה בהצלחה',
      data: review,
      meta: {
        rewardApplied: rewardResult.rewardApplied,
        newSubscriptionEndAt: rewardResult.newSubscriptionEndAt || null,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/reviews/my-review - Get customer's own review (authenticated)
router.get('/my-review', authenticateToken, async (req, res, next) => {
  try {
    const { eligibility } = await ensureReviewWindow(req.customerId)
    const review = await Review.findOne({ customer: req.customerId })
    
    if (!review) {
      return res.json({
        message: 'No review found',
        data: null,
        meta: { eligibility },
      })
    }

    res.json({
      message: 'Review retrieved successfully',
      data: review,
      meta: { eligibility },
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

