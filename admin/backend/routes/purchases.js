import express from 'express'
import Purchase from '../models/Purchase.js'
import Course from '../models/Course.js'
import Customer from '../models/Customer.js'
import Transaction from '../models/Transaction.js'
import { sendPurchaseConfirmationEmail } from '../services/emailService.js'

const router = express.Router()

// POST /api/purchases - Create new purchase
router.post('/', async (req, res, next) => {
  try {
    const { courseId, customerName, customerEmail, customerPhone, paymentMethod, notes, status } = req.body

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
      notes: notes || '',
      status: status || 'pending' // Allow setting status on creation
    })

    await purchase.save()
    
    // Add purchase to customer
    customer.purchases.push(purchase._id)
    customer.totalSpent += course.price
    await customer.save()
    
    await purchase.populate('course', 'title')
    await purchase.populate('customer', 'name email phone')

    // Create income transaction if purchase is completed
    if (purchase.status === 'completed') {
      try {
        // Check if transaction already exists for this purchase
        const existingTransaction = await Transaction.findOne({ purchase: purchase._id })
        
        if (!existingTransaction) {
          // Map payment method from purchase to transaction format
          const paymentMethodMap = {
            'credit_card': 'credit_card',
            'bank_transfer': 'bank_transfer',
            'paypal': 'bank_transfer', // PayPal is similar to bank transfer
            'other': 'other'
          }
          
          const transaction = new Transaction({
            type: 'income',
            category: 'course_sales',
            amount: purchase.price,
            description: `רכישת מסלול: ${purchase.course?.title || 'מסלול'}`,
            date: new Date(),
            paymentMethod: paymentMethodMap[purchase.paymentMethod] || 'other',
            customer: purchase.customer?._id || purchase.customer || null,
            purchase: purchase._id,
            createdBy: 'admin',
            notes: `נוצר אוטומטית מרכישה ידנית #${purchase._id}`
          })
          
          await transaction.save()
          console.log(`✅ Created income transaction for manual purchase ${purchase._id}: ₪${purchase.price}`)
        } else {
          console.log(`ℹ️ Transaction already exists for purchase ${purchase._id}`)
        }
      } catch (transactionError) {
        // Log error but don't fail the purchase creation
        console.error('❌ Error creating income transaction:', transactionError)
      }
    }

    // שלח אימייל אישור רכישה
    if (customer.email) {
      console.log('📧 Attempting to send purchase confirmation email to:', customer.email)
      try {
        const emailResult = await sendPurchaseConfirmationEmail(purchase, course, customer)
        if (emailResult.success) {
          console.log('✅ Purchase confirmation email sent successfully')
        } else {
          console.error('❌ Failed to send purchase confirmation email:', emailResult.error || emailResult.message)
        }
      } catch (emailError) {
        console.error('❌ Error sending purchase confirmation email:', emailError)
        // לא נכשל את הבקשה אם האימייל נכשל
      }
    } else {
      console.warn('⚠️  No email address for customer, skipping email')
    }

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

