import express from 'express'
import Customer from '../models/Customer.js'
import Purchase from '../models/Purchase.js'
import Booking from '../models/Booking.js'
import Course from '../models/Course.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcrypt'
import { sendAccountCreationEmail } from '../services/emailService.js'
import {
  addCalendarMonths,
  applyAutoCoachingWindowForAllCompletedPurchases,
} from '../utils/coachingPurchaseWindow.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const DEFAULT_COACHING_MONTHS = 3

// Configure multer for customer files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const customerId = req.params.id
    const customerDir = path.join(__dirname, `../uploads/customers/${customerId}`)
    if (!fs.existsSync(customerDir)) {
      fs.mkdirSync(customerDir, { recursive: true })
    }
    cb(null, customerDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

const uploadAudio = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('מותר להעלות רק קבצי אודיו (למשל MP3, WAV, M4A)'))
    }
  }
})

function handleMulterAudioUpload(req, res, next) {
  uploadAudio.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message: err.message || 'שגיאה בהעלאת האודיו'
      })
    }
    next()
  })
}

// GET /api/admin/customers - Get all customers
router.get('/admin/customers', async (req, res, next) => {
  try {
    const customers = await Customer.find()
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
      .sort({ createdAt: -1 })
      .lean()
    
    // Calculate statistics and filter out null references
    const customersWithStats = customers.map(customer => {
      // Filter out null references from populate
      const bookings = Array.isArray(customer.bookings) 
        ? customer.bookings.filter(b => b !== null && b !== undefined && b._id)
        : []
      const purchases = Array.isArray(customer.purchases) 
        ? customer.purchases.filter(p => p !== null && p !== undefined && p._id)
        : []
      
      const confirmedBookings = bookings.filter(b => b && b.status === 'confirmed').length
      const completedPurchases = purchases.filter(p => p && p.status === 'completed').length
      
      return {
        ...customer,
        bookings: bookings, // Return filtered bookings
        purchases: purchases, // Return filtered purchases
        stats: {
          totalSessions: bookings.length,
          confirmedSessions: confirmedBookings,
          completedCourses: completedPurchases,
          totalSpent: purchases.reduce((sum, p) => sum + (p && p.price ? p.price : 0), 0)
        }
      }
    })
    
    res.json({
      message: 'Customers retrieved successfully',
      data: customersWithStats
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

// POST /api/admin/customers/:id/files - Upload file for customer
router.post('/admin/customers/:id/files', upload.single('file'), async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    
    // Determine file type
    const mimetype = req.file.mimetype
    let fileType = 'other'
    if (mimetype.startsWith('image/')) fileType = 'image'
    else if (mimetype === 'application/pdf') fileType = 'pdf'
    else if (mimetype.includes('video/')) fileType = 'video'
    else if (mimetype.includes('audio/')) fileType = 'audio'
    else if (mimetype.includes('document') || mimetype.includes('word') || mimetype.includes('msword') || mimetype.includes('vnd.openxmlformats-officedocument')) fileType = 'document'
    
    const fileUrl = `/uploads/customers/${req.params.id}/${req.file.filename}`
    
    customer.files.push({
      name: req.file.originalname,
      url: fileUrl,
      type: fileType,
      size: req.file.size,
      description: req.body.description || '',
      uploadedBy: 'admin'
    })
    
    await customer.save()
    
    res.json({
      message: 'File uploaded successfully',
      data: customer.files[customer.files.length - 1]
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    next(error)
  }
})

// POST /api/admin/customers/:id/audio — העלאת אודיו בלבד (נשמר ב־files עם type: audio)
router.post('/admin/customers/:id/audio', handleMulterAudioUpload, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'לא הועלה קובץ אודיו' })
    }
    const fileUrl = `/uploads/customers/${req.params.id}/${req.file.filename}`
    customer.files.push({
      name: req.file.originalname,
      url: fileUrl,
      type: 'audio',
      size: req.file.size,
      description: req.body.description || '',
      uploadedBy: 'admin'
    })
    await customer.save()
    res.json({
      message: 'קובץ אודיו הועלה בהצלחה',
      data: customer.files[customer.files.length - 1]
    })
  } catch (error) {
    console.error('Error uploading audio:', error)
    next(error)
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
    
    // Delete physical file
    const filePath = path.join(__dirname, `../uploads/customers/${req.params.id}/${file.url.split('/').pop()}`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
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

