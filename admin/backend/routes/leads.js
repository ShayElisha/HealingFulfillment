import express from 'express'
import Lead from '../models/Lead.js'

const router = express.Router()

// GET /api/leads - Get all leads (admin); ?page=&limit=&status=
router.get('/', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 60))
    const skip = (page - 1) * limit

    const st = String(req.query.status || 'all').trim()
    const listFilter = {}
    if (st !== 'all') listFilter.status = st

    if (!usePaging) {
      const leads = await Lead.find(listFilter).sort({ createdAt: -1 }).lean()
      return res.json({
        message: 'Leads retrieved successfully',
        data: leads,
      })
    }

    const [leads, total, totalAll, newC, contactedC, convertedC, notInterestedC] = await Promise.all([
      Lead.find(listFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(listFilter),
      Lead.countDocuments({}),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({ status: 'contacted' }),
      Lead.countDocuments({ status: 'converted' }),
      Lead.countDocuments({ status: 'not_interested' }),
    ])

    res.json({
      message: 'Leads retrieved successfully',
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        total: totalAll,
        new: newC,
        contacted: contactedC,
        converted: convertedC,
        not_interested: notInterestedC,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/leads/:id - Get lead by ID
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).lean()

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' })
    }

    res.json({
      message: 'Lead retrieved successfully',
      data: lead
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/leads/:id/status - Update lead status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body

    if (!status || !['new', 'contacted', 'converted', 'not_interested'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' })
    }

    const updateData = { status }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    if (status === 'contacted') {
      updateData.contactedAt = new Date()
    } else if (status === 'converted') {
      updateData.convertedAt = new Date()
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' })
    }

    res.json({
      message: 'Lead status updated successfully',
      data: lead
    })
  } catch (error) {
    next(error)
  }
})

export default router

