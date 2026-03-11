import express from 'express'
import Contact from '../models/Contact.js'
import { validateContact } from '../validation/contactValidation.js'

const router = express.Router()

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

