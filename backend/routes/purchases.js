import express from 'express'
import Purchase from '../models/Purchase.js'
import Course from '../models/Course.js'
import Customer from '../models/Customer.js'

const router = express.Router()

// POST /api/purchases - Create new purchase
router.post('/', async (req, res, next) => {
  try {
    const { courseId, customerName, customerEmail, customerPhone, paymentMethod, notes } = req.body

    // Get course details
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not available' })
    }

    // Find or create customer
    let customer = await Customer.findOne({ email: customerEmail.toLowerCase() })
    
    if (!customer) {
      // Create new customer
      customer = new Customer({
        name: customerName,
        email: customerEmail.toLowerCase(),
        phone: customerPhone,
        status: 'active'
      })
      await customer.save()
    }

    const purchase = new Purchase({
      course: courseId,
      customer: customer._id,
      customerName,
      customerEmail,
      customerPhone,
      price: course.price,
      paymentMethod: paymentMethod || 'other',
      notes: notes || ''
    })

    await purchase.save()
    
    // Add purchase to customer
    customer.purchases.push(purchase._id)
    customer.totalSpent += course.price
    await customer.save()
    
    await purchase.populate('course', 'title')
    await purchase.populate('customer', 'name email phone')

    res.status(201).json({
      message: 'Purchase request created successfully',
      data: purchase
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      })
    }
    next(error)
  }
})

// GET /api/purchases - Get all purchases (admin)
router.get('/', async (req, res, next) => {
  try {
    const purchases = await Purchase.find()
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
    
    res.json({
      message: 'Purchases retrieved successfully',
      data: purchases
    })
  } catch (error) {
    next(error)
  }
})

export default router

