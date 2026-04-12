import express from 'express'
import Contact from '../models/Contact.js'
import { validateContact } from '../validation/contactValidation.js'

const router = express.Router()

// GET /api/contact - Get all contact submissions (admin); ?page=&limit=&read=all|read|unread
router.get('/', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(150, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    const read = String(req.query.read || 'all').trim()
    const listFilter = {}
    if (read === 'unread') listFilter.isRead = false
    if (read === 'read') listFilter.isRead = true

    if (!usePaging) {
      const contacts = await Contact.find(listFilter).sort({ createdAt: -1 }).lean()
      return res.json({
        message: 'Contact submissions retrieved successfully',
        data: contacts,
      })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [contacts, total, unreadTotal, todayCount, weekCount] = await Promise.all([
      Contact.find(listFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(listFilter),
      Contact.countDocuments({ isRead: false }),
      Contact.countDocuments({ createdAt: { $gte: todayStart } }),
      Contact.countDocuments({ createdAt: { $gte: weekAgo } }),
    ])

    const allTotal = await Contact.countDocuments({})

    res.json({
      message: 'Contact submissions retrieved successfully',
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        total: allTotal,
        unread: unreadTotal,
        today: todayCount,
        thisWeek: weekCount,
      },
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/contact/:id/read - Mark contact as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    )
    
    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found'
      })
    }
    
    res.json({
      message: 'Contact marked as read',
      data: contact
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/contact
router.post('/', validateContact, async (req, res, next) => {
  try {
    console.log('[Contact Route] POST /contact called')
    console.log('[Contact Route] Request body:', JSON.stringify(req.body))
    console.log('[Contact Route] Request body type:', typeof req.body)
    console.log('[Contact Route] Request headers:', JSON.stringify(req.headers).substring(0, 300))
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('[Contact Route] Request body is empty or undefined')
      return res.status(400).json({
        message: 'Request body is required',
        error: 'Body is empty or undefined'
      })
    }
    
    const contact = new Contact(req.body)
    await contact.save()
    
    console.log('[Contact Route] Contact saved successfully:', contact._id)
    
    res.status(201).json({
      message: 'Contact form submitted successfully',
      data: {
        id: contact._id,
        name: contact.name
      }
    })
  } catch (error) {
    console.error('[Contact Route] Error:', error.message)
    console.error('[Contact Route] Error stack:', error.stack)
    next(error)
  }
})

export default router

