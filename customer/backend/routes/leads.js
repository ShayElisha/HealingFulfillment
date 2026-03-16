import express from 'express'
import Lead from '../models/Lead.js'

const router = express.Router()

// POST /api/leads - Submit questionnaire
router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email, answers, additionalNotes, nextStep } = req.body

    // Validation
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' })
    }
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'At least one answer is required' })
    }
    if (!nextStep || !['book_appointment', 'wait_for_contact'].includes(nextStep)) {
      return res.status(400).json({ message: 'Valid nextStep is required' })
    }

    // Create lead
    const lead = new Lead({
      name,
      phone,
      email,
      answers,
      additionalNotes,
      nextStep,
      status: 'new'
    })

    await lead.save()

    res.status(201).json({
      message: 'Questionnaire submitted successfully',
      data: {
        id: lead._id,
        nextStep: lead.nextStep
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/leads - Get all leads (admin)
router.get('/', async (req, res, next) => {
  try {
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      message: 'Leads retrieved successfully',
      data: leads
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

