import express from 'express'
import Contact from '../models/Contact.js'
import { validateContact } from '../validation/contactValidation.js'

const router = express.Router()

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

