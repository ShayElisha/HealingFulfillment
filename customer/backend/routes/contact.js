import express from 'express'
import Contact from '../models/Contact.js'
import { validateContact } from '../validation/contactValidation.js'

const router = express.Router()

// GET /api/contact - Get all contact submissions (admin)
router.get('/', async (req, res, next) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 }) // Newest first
      .lean()
    
    res.json({
      message: 'Contact submissions retrieved successfully',
      data: contacts
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/contact
router.post('/', validateContact, async (req, res, next) => {
  try {
    const contact = new Contact(req.body)
    await contact.save()
    
    res.status(201).json({
      message: 'Contact form submitted successfully',
      data: {
        id: contact._id,
        name: contact.name
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router

