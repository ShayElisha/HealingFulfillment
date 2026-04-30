import express from 'express'
import Customer from '../models/Customer.js'
import TriggerJournalEntry from '../models/TriggerJournalEntry.js'
import Purchase from '../models/Purchase.js'
import Booking from '../models/Booking.js'
import Course from '../models/Course.js'
import multer from 'multer'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  uploadLocalFileToCloudinary,
  isCloudinaryConfigured,
  deleteCloudinaryByUrl,
  cloudinaryErrorToMessage,
  createDirectUploadSignature,
  getCloudinaryPublicUploadConfig,
} from '../services/cloudinaryUpload.js'
import bcrypt from 'bcrypt'
import { sendAccountCreationEmail } from '../services/emailService.js'
import {
  addCalendarMonths,
  applyAutoCoachingWindowForAllCompletedPurchases,
} from '../utils/coachingPurchaseWindow.js'
import { catchMulterUpload } from '../middleware/multerCatch.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const DEFAULT_COACHING_MONTHS = 3

/**
 * מקסימום גודל קובץ לתיק לקוח (קבצים כלליים + אודיו), במגה-בייט.
 * ברירת מחדל 512MB. סביבה: MAX_CUSTOMER_UPLOAD_MB=1024 (מקסימום 2048).
 * הערה: ב-Vercel גוף הבקשה מוגבל בגודל; קבצים גדולים עלולים לקבל 413 מהפלטפורמה לפני Multer.
 */
function resolveMaxCustomerUploadMb() {
  const raw = Number.parseInt(process.env.MAX_CUSTOMER_UPLOAD_MB, 10)
  const mb = Number.isFinite(raw) && raw > 0 ? raw : 512
  return Math.min(2048, Math.max(50, mb))
}

const MAX_CUSTOMER_UPLOAD_MB = resolveMaxCustomerUploadMb()
const MAX_CUSTOMER_UPLOAD_BYTES = MAX_CUSTOMER_UPLOAD_MB * 1024 * 1024

function customerTmpName(_req, file, cb) {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  cb(null, `cust-${uniqueSuffix}${path.extname(file.originalname || '')}`)
}

const customerTmpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: customerTmpName,
})

const upload = multer({
  storage: customerTmpStorage,
  limits: {
    fileSize: MAX_CUSTOMER_UPLOAD_BYTES,
  },
})

const uploadAudio = multer({
  storage: customerTmpStorage,
  limits: { fileSize: MAX_CUSTOMER_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('מותר להעלות רק קבצי אודיו (למשל MP3, WAV, M4A)'))
    }
  },
})

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p)
  } catch (e) {
    console.warn('Temp file unlink:', e.message)
  }
}

function handleMulterAudioUpload(req, res, next) {
  uploadAudio.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          message: `הקובץ גדול מדי מהמותר. מקסימום ${MAX_CUSTOMER_UPLOAD_MB}MB.`,
        })
      }
      return res.status(400).json({
        message: err.message || 'שגיאה בהעלאת האודיו',
      })
    }
    next()
  })
}

function resolveFileTypeByMimetype(mimetype = '', fallback = 'other') {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype === 'application/pdf') return 'pdf'
  if (mimetype.includes('video/')) return 'video'
  if (mimetype.includes('audio/')) return 'audio'
  if (
    mimetype.includes('document') ||
    mimetype.includes('word') ||
    mimetype.includes('msword') ||
    mimetype.includes('vnd.openxmlformats-officedocument')
  ) {
    return 'document'
  }
  return fallback
}

// GET /api/admin/customers - Get all customers
router.get('/admin/customers', async (req, res, next) => {
  try {
    const forLookup = req.query.forLookup === '1' || req.query.forLookup === 'true'
    const hasPagingParams = req.query.page !== undefined || req.query.limit !== undefined
    const pageRaw = Number.parseInt(req.query.page, 10)
    const limitRaw = Number.parseInt(req.query.limit, 10)
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
    const maxLimit = forLookup ? 1000 : 200
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, maxLimit) : 25
    let includeDetails = hasPagingParams
      ? req.query.includeDetails === '1' || req.query.includeDetails === 'true'
      : true
    if (forLookup) {
      includeDetails = false
    }
    const skip = (page - 1) * limit

    const filter = { isAdmin: { $ne: true } }
    const createdAt = {}
    if (req.query.startDate) {
      const start = new Date(String(req.query.startDate))
      if (!Number.isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0)
        createdAt.$gte = start
      }
    }
    if (req.query.endDate) {
      const end = new Date(String(req.query.endDate))
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999)
        createdAt.$lte = end
      }
    }
    if (createdAt.$gte || createdAt.$lte) filter.createdAt = createdAt

    const selectFields = forLookup
      ? 'name email phone'
      : 'name email phone status hasAccount files bookings purchases createdAt caseOpenedAt accountCreatedAt lastLoginAt mustChangePassword'

    let query = Customer.find(filter).sort({ createdAt: -1 }).select(selectFields)

    if (hasPagingParams) {
      query = query.skip(skip).limit(limit)
    }

    if (includeDetails) {
      query = query
        .populate({
          path: 'purchases',
          select: 'course price status createdAt',
          options: { lean: true }
        })
        .populate({
          path: 'bookings',
          select: 'preferredDate preferredTime status meetingType',
          options: { lean: true }
        })
    }

    const [customers, total, activeCount, newLast7Days] = await Promise.all([
      query.lean(),
      Customer.countDocuments(filter),
      Customer.countDocuments({ ...filter, hasAccount: true }),
      Customer.countDocuments({
        ...filter,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ])

    const customersWithStats = customers.map((customer) => {
      const bookings = Array.isArray(customer.bookings)
        ? customer.bookings.filter((b) => b !== null && b !== undefined)
        : []
      const purchases = Array.isArray(customer.purchases)
        ? customer.purchases.filter((p) => p !== null && p !== undefined)
        : []

      const confirmedBookings = includeDetails
        ? bookings.filter((b) => b && b.status === 'confirmed').length
        : 0
      const completedPurchases = includeDetails
        ? purchases.filter((p) => p && p.status === 'completed').length
        : 0
      const totalSpent = includeDetails
        ? purchases.reduce((sum, p) => sum + (p && p.price ? p.price : 0), 0)
        : 0

      return {
        ...customer,
        bookings,
        purchases,
        stats: {
          totalSessions: bookings.length,
          confirmedSessions: confirmedBookings,
          completedCourses: completedPurchases,
          totalSpent,
          totalPurchases: purchases.length
        }
      }
    })

    res.json({
      message: 'Customers retrieved successfully',
      data: customersWithStats,
      pagination: {
        page,
        limit: hasPagingParams ? limit : total,
        total,
        totalPages: hasPagingParams ? Math.max(1, Math.ceil(total / limit)) : 1
      },
      meta: {
        total,
        activeCount,
        newLast7Days
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      message: 'Error fetching customers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

// POST /api/admin/customers - יצירת תיק לקוח (תאריך פתיחת תיק נרשם אוטומטית)
router.post('/admin/customers', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body
    if (!name || !email || !phone) {
      return res.status(400).json({
        message: 'נדרשים שם, אימייל וטלפון'
      })
    }
    const emailLower = String(email).toLowerCase().trim()
    const existing = await Customer.findOne({ email: emailLower })
    if (existing) {
      return res.status(409).json({ message: 'לקוח עם אימייל זה כבר קיים במערכת' })
    }
    const opened = new Date()
    const customer = new Customer({
      name: String(name).trim(),
      email: emailLower,
      phone: String(phone).trim(),
      status: 'active',
      caseOpenedAt: opened
    })
    await customer.save()
    res.status(201).json({
      message: 'תיק לקוח נוצר בהצלחה',
      data: customer
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/admin/customers/:id/trigger-journal — תיעוד תריגרים יומי (למטפל)
router.get('/admin/customers/:id/trigger-journal', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).select('_id').lean()
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 80))
    const { from, to } = req.query
    const filter = { customer: req.params.id }
    if (from && to && typeof from === 'string' && typeof to === 'string') {
      const mFrom = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from.trim())
      const mTo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(to.trim())
      if (!mFrom || !mTo) {
        return res.status(400).json({ message: 'Invalid date range (use YYYY-MM-DD)' })
      }
      const d0 = new Date(Date.UTC(Number(mFrom[1]), Number(mFrom[2]) - 1, Number(mFrom[3]), 0, 0, 0, 0))
      const d1 = new Date(Date.UTC(Number(mTo[1]), Number(mTo[2]) - 1, Number(mTo[3]), 0, 0, 0, 0))
      d1.setUTCDate(d1.getUTCDate() + 1)
      filter.entryDate = { $gte: d0, $lt: d1 }
    }
    const entries = await TriggerJournalEntry.find(filter)
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(limit)
      .lean()
    res.json({
      message: 'Trigger journal entries',
      data: entries,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/admin/customers/:id - Get single customer
router.get('/admin/customers/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate({
        path: 'purchases',
        populate: {
          path: 'course',
          select: 'title price sessionsCount coachingProcessMonths coachingProcessStartAt coachingProcessEndAt'
        }
      })
      .populate('bookings')
      .lean()
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    res.json({
      message: 'Customer retrieved successfully',
      data: customer
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/customers/:id/open-case - אישור פתיחת תיק (חובה לפני קביעת תקופת ליווי לרכישות)
router.post('/admin/customers/:id/open-case', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    if (!customer.caseOpenedAt) {
      const raw = req.body?.openedAt
      const opened = raw ? new Date(raw) : new Date()
      if (Number.isNaN(opened.getTime())) {
        return res.status(400).json({ message: 'תאריך פתיחת תיק לא תקין' })
      }
      customer.caseOpenedAt = opened
      await customer.save()
    }
    await applyAutoCoachingWindowForAllCompletedPurchases(customer._id)
    const refreshed = await Customer.findById(req.params.id)
    res.json({
      message: 'תיק לקוח פעיל',
      data: refreshed || customer
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/customers/:id/purchases/:purchaseId/coaching-window
router.post(
  '/admin/customers/:id/purchases/:purchaseId/coaching-window',
  async (req, res, next) => {
    try {
      const customer = await Customer.findById(req.params.id)
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' })
      }
      if (!customer.caseOpenedAt) {
        return res.status(400).json({
          message: 'יש לפתוח תיק לקוח לפני קביעת תקופת ליווי'
        })
      }
      const purchase = await Purchase.findOne({
        _id: req.params.purchaseId,
        customer: customer._id
      })
      if (!purchase) {
        return res.status(404).json({ message: 'רכישה לא נמצאה או שאינה שייכת ללקוח' })
      }
      const course = await Course.findById(purchase.course).select('coachingProcessMonths')
      const months =
        course?.coachingProcessMonths != null && Number(course.coachingProcessMonths) >= 1
          ? Math.min(120, Number(course.coachingProcessMonths))
          : DEFAULT_COACHING_MONTHS

      let start
      if (req.body?.startedAt) {
        start = new Date(req.body.startedAt)
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: 'תאריך התחלה לא תקין' })
        }
      } else {
        start = new Date(customer.caseOpenedAt)
      }

      const end = addCalendarMonths(start, months)
      purchase.coachingStartedAt = start
      purchase.coachingEndsAt = end
      await purchase.save()
      await purchase.populate({
        path: 'course',
        select: 'title price coachingProcessMonths sessionsCount'
      })
      res.json({
        message: 'תקופת הליווי עודכנה',
        data: purchase
      })
    } catch (error) {
      next(error)
    }
  }
)

// POST /api/admin/customers/:id/files — רק Cloudinary
router.post(
  '/admin/customers/:id/files',
  catchMulterUpload(upload.single('file'), {
    limitFileSizeMessage: `הקובץ גדול מדי מהמותר. מקסימום ${MAX_CUSTOMER_UPLOAD_MB}MB.`,
  }),
  async (req, res, next) => {
  const cid = req.params.id
  const log = (step, extra = '') =>
    console.log(`[UPLOAD:files] customer=${cid} ${step}${extra ? ` ${extra}` : ''}`)

  if (!isCloudinaryConfigured()) {
    log('ביטול — Cloudinary לא מוגדר')
    safeUnlink(req.file?.path)
    return res.status(503).json({
      message:
        'העלאת קבצים דרך Cloudinary בלבד. הגדר ב-.env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (ללא רווחים מיותרים)',
    })
  }
  try {
    log('התחלה', req.file?.originalname ? `file="${req.file.originalname}"` : '(אין req.file)')
    const customer = await Customer.findById(cid)
    if (!customer) {
      log('נכשל — לקוח לא נמצא')
      safeUnlink(req.file?.path)
      return res.status(404).json({ message: 'Customer not found' })
    }

    if (!req.file?.path) {
      log('נכשל — אין נתיב קובץ אחרי multer')
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const mimetype = req.file.mimetype || ''
    let fileType = 'other'
    if (mimetype.startsWith('image/')) fileType = 'image'
    else if (mimetype === 'application/pdf') fileType = 'pdf'
    else if (mimetype.includes('video/')) fileType = 'video'
    else if (mimetype.includes('audio/')) fileType = 'audio'
    else if (
      mimetype.includes('document') ||
      mimetype.includes('word') ||
      mimetype.includes('msword') ||
      mimetype.includes('vnd.openxmlformats-officedocument')
    )

// POST /api/admin/customers/:id/files/direct-signature — browser uploads directly to Cloudinary
router.post('/admin/customers/:id/files/direct-signature', async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ message: 'Cloudinary לא מוגדר בשרת' })
    }
    const customer = await Customer.findById(req.params.id).select('_id')
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    const mimetype = String(req.body?.mimetype || 'application/octet-stream')
    const kind = String(req.body?.kind || 'file').toLowerCase()
    const folder =
      kind === 'audio' ? `customers/${req.params.id}/audio` : `customers/${req.params.id}`
    const signed = createDirectUploadSignature({ folder, mimetype })
    const pub = getCloudinaryPublicUploadConfig()
    return res.json({
      message: 'חתימת העלאה נוצרה',
      data: {
        ...pub,
        ...signed,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/admin/customers/:id/files/direct-complete — save uploaded Cloudinary file metadata
router.post('/admin/customers/:id/files/direct-complete', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    const url = String(req.body?.url || '').trim()
    const name = String(req.body?.name || '').trim()
    const mimetype = String(req.body?.mimetype || '')
    const description = String(req.body?.description || '').trim()
    const size = Number(req.body?.size || 0)
    const kind = String(req.body?.kind || '').trim().toLowerCase()
    if (!url || !name) {
      return res.status(400).json({ message: 'חסרים url או name' })
    }
    const fileType = kind === 'audio' ? 'audio' : resolveFileTypeByMimetype(mimetype, 'other')
    customer.files.push({
      name,
      url,
      type: fileType,
      size: Number.isFinite(size) && size > 0 ? size : undefined,
      description,
      uploadedBy: 'admin',
    })
    await customer.save()
    return res.json({
      message: 'הקובץ נשמר ללקוח בהצלחה',
      data: customer.files[customer.files.length - 1],
    })
  } catch (error) {
    next(error)
  }
})
      fileType = 'document'

    log(
      'שולח ל-Cloudinary',
      `path=${req.file.path} mimetype=${mimetype} type=${fileType} size=${req.file.size ?? '?'}`
    )
    const result = await uploadLocalFileToCloudinary(req.file.path, {
      folder: `customers/${cid}`,
      mimetype,
    })
    log('Cloudinary הצליח', `bytes=${result?.bytes} url_prefix=${result?.secure_url?.slice(0, 48)}…`)
    safeUnlink(req.file.path)

    customer.files.push({
      name: req.file.originalname,
      url: result.secure_url,
      type: fileType,
      size: result.bytes,
      description: req.body.description || '',
      uploadedBy: 'admin',
    })

    await customer.save()
    log('הושלם — נשמר ב-Mongo')

    res.json({
      message: 'File uploaded successfully',
      data: customer.files[customer.files.length - 1],
    })
  } catch (error) {
    safeUnlink(req.file?.path)
    console.error(
      `[UPLOAD:files] customer=${cid} שגיאה:`,
      error?.name,
      error?.message,
      error?.http_code != null ? `http_code=${error.http_code}` : ''
    )
    if (error?.name === 'CastError') {
      return res.status(400).json({ message: 'מזהה לקוח לא תקין' })
    }
    const code = Number(error?.http_code)
    let status = Number.isFinite(code) && code >= 400 && code < 600 ? code : 502
    if (error?.name === 'ValidationError') status = 400
    return res.status(status).json({
      message:
        error?.name === 'ValidationError'
          ? error.message || 'שגיאת ולידציה בשמירת הלקוח'
          : cloudinaryErrorToMessage(error),
      ...(process.env.NODE_ENV === 'development' && {
        detail: error.message,
        cloudinary: error.http_code != null ? { http_code: error.http_code, error: error.error } : undefined,
      }),
    })
  }
})

// POST /api/admin/customers/:id/audio — רק Cloudinary
router.post('/admin/customers/:id/audio', handleMulterAudioUpload, async (req, res, next) => {
  const cid = req.params.id
  const logA = (step, extra = '') =>
    console.log(`[UPLOAD:audio] customer=${cid} ${step}${extra ? ` ${extra}` : ''}`)

  if (!isCloudinaryConfigured()) {
    logA('ביטול — Cloudinary לא מוגדר')
    safeUnlink(req.file?.path)
    return res.status(503).json({
      message:
        'העלאת אודיו דרך Cloudinary בלבד. הגדר ב-.env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET',
    })
  }
  try {
    logA('התחלה', req.file?.originalname ? `file="${req.file.originalname}"` : '(אין req.file)')
    const customer = await Customer.findById(cid)
    if (!customer) {
      logA('נכשל — לקוח לא נמצא')
      safeUnlink(req.file?.path)
      return res.status(404).json({ message: 'Customer not found' })
    }
    if (!req.file?.path) {
      logA('נכשל — אין נתיב קובץ אחרי multer')
      return res.status(400).json({ message: 'לא הועלה קובץ אודיו' })
    }
    logA(
      'שולח ל-Cloudinary',
      `path=${req.file.path} mimetype=${req.file.mimetype} size=${req.file.size ?? '?'}`
    )
    const result = await uploadLocalFileToCloudinary(req.file.path, {
      folder: `customers/${cid}`,
      mimetype: req.file.mimetype,
    })
    logA('Cloudinary הצליח', `bytes=${result?.bytes}`)
    safeUnlink(req.file.path)
    customer.files.push({
      name: req.file.originalname,
      url: result.secure_url,
      type: 'audio',
      size: result.bytes,
      description: req.body.description || '',
      uploadedBy: 'admin',
    })
    await customer.save()
    logA('הושלם — נשמר ב-Mongo')
    res.json({
      message: 'קובץ אודיו הועלה בהצלחה',
      data: customer.files[customer.files.length - 1],
    })
  } catch (error) {
    safeUnlink(req.file?.path)
    console.error(
      `[UPLOAD:audio] customer=${cid} שגיאה:`,
      error?.name,
      error?.message,
      error?.http_code != null ? `http_code=${error.http_code}` : ''
    )
    if (error?.name === 'CastError') {
      return res.status(400).json({ message: 'מזהה לקוח לא תקין' })
    }
    const code = Number(error?.http_code)
    let status = Number.isFinite(code) && code >= 400 && code < 600 ? code : 502
    if (error?.name === 'ValidationError') status = 400
    return res.status(status).json({
      message:
        error?.name === 'ValidationError'
          ? error.message || 'שגיאת ולידציה בשמירת הלקוח'
          : cloudinaryErrorToMessage(error),
      ...(process.env.NODE_ENV === 'development' && {
        detail: error.message,
        cloudinary: error.http_code != null ? { http_code: error.http_code, error: error.error } : undefined,
      }),
    })
  }
})

// DELETE /api/admin/customers/:id/files/:fileId - Delete customer file
router.delete('/admin/customers/:id/files/:fileId', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    const file = customer.files.id(req.params.fileId)
    if (!file) {
      return res.status(404).json({ message: 'File not found' })
    }
    
    const deletedCloud = await deleteCloudinaryByUrl(file.url)
    // מחיקה מקומית — רק לנתיבים ישנים לפני Cloudinary
    if (!deletedCloud && file.url?.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, `../uploads/customers/${req.params.id}/${file.url.split('/').pop()}`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    
    customer.files.pull(req.params.fileId)
    await customer.save()
    
    res.json({
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    next(error)
  }
})

// POST /api/admin/customers/:id/notes - Add note to customer
router.post('/admin/customers/:id/notes', async (req, res, next) => {
  try {
    const { content } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' })
    }
    
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    customer.notes.push({
      content: content.trim(),
      createdBy: 'admin'
    })
    
    await customer.save()
    
    res.json({
      message: 'Note added successfully',
      data: customer.notes[customer.notes.length - 1]
    })
  } catch (error) {
    console.error('Error adding note:', error)
    next(error)
  }
})

// PUT /api/admin/customers/:id/sessions - Update session count
router.put('/admin/customers/:id/sessions', async (req, res, next) => {
  try {
    const { completedSessions } = req.body
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { completedSessions },
      { new: true }
    )
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    res.json({
      message: 'Sessions updated successfully',
      data: customer
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/admin/customers/:id/status - Activate / deactivate customer
router.put('/admin/customers/:id/status', async (req, res, next) => {
  try {
    const status = String(req.body?.status || '').trim()
    if (!['active', 'inactive', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'סטטוס לא תקין. הערכים המותרים: active, inactive, completed' })
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    return res.json({
      message: 'סטטוס הלקוח עודכן בהצלחה',
      data: customer,
    })
  } catch (error) {
    next(error)
  }
})

// Helper function to generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// POST /api/admin/customers/:id/create-account - Create account for customer
router.post('/admin/customers/:id/create-account', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    if (customer.hasAccount) {
      return res.status(400).json({ 
        message: 'למשתמש זה כבר יש חשבון פעיל. השתמש ב-reset-password ליצירת סיסמה חדשה.' 
      })
    }
    
    const initialPassword = generateRandomPassword()
    
    // צפין את הסיסמה
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(initialPassword, saltRounds)
    
    // עדכן את הלקוח
    customer.passwordHash = passwordHash
    customer.hasAccount = true
    customer.mustChangePassword = true
    customer.accountCreatedAt = new Date()
    
    await customer.save()
    
    // שלח אימייל עם הסיסמה הראשונית
    if (customer.email) {
      console.log('📧 Attempting to send account creation email to:', customer.email)
      try {
        const emailResult = await sendAccountCreationEmail(customer, initialPassword)
        if (emailResult.success) {
          console.log('✅ Account creation email sent successfully')
        } else {
          console.error('❌ Failed to send account creation email:', emailResult.error || emailResult.message)
        }
      } catch (emailError) {
        console.error('❌ Error sending account creation email:', emailError)
        // לא נכשל את הבקשה אם האימייל נכשל, אבל נחזיר את הסיסמה למנהל
      }
    } else {
      console.warn('⚠️  No email address for customer, skipping email')
    }
    
    res.json({
      message: 'חשבון נוצר בהצלחה',
      data: {
        customerId: customer._id,
        email: customer.email,
        initialPassword: initialPassword // מחזיר את הסיסמה הראשונית למנהל (גם אם האימייל נכשל)
      }
    })
  } catch (error) {
    console.error('Error creating account:', error)
    next(error)
  }
})

// POST /api/admin/customers/:id/reset-password - Reset password for existing customer
router.post('/admin/customers/:id/reset-password', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    if (!customer.hasAccount) {
      return res.status(400).json({ 
        message: 'למשתמש זה אין חשבון פעיל. השתמש ב-create-account ליצירת חשבון חדש.' 
      })
    }
    
    const newPassword = generateRandomPassword()
    
    // צפין את הסיסמה החדשה
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)
    
    // עדכן את הסיסמה
    customer.passwordHash = passwordHash
    customer.mustChangePassword = true // דרוש שינוי סיסמה בהתחברות הבאה
    
    await customer.save()
    
    res.json({
      message: 'סיסמה ראשונית חדשה נוצרה בהצלחה',
      data: {
        customerId: customer._id,
        email: customer.email,
        initialPassword: newPassword // מחזיר את הסיסמה הראשונית החדשה למנהל
      }
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    next(error)
  }
})

export default router

