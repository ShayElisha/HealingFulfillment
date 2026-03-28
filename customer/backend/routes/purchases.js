import express from 'express'
import Purchase from '../models/Purchase.js'
import Course from '../models/Course.js'
import Customer from '../models/Customer.js'
import Transaction from '../models/Transaction.js'
import { sendPurchaseConfirmationEmail } from '../services/emailService.js'
import {
  createCardcomCheckout,
  isCardcomConfigured,
  parseCardcomCallback,
  verifyCardcomCallbackSignature,
} from '../services/cardcomService.js'

const router = express.Router()

const buildOrderId = () => `HF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const getOrCreateCustomer = async ({ customerName, customerEmail, customerPhone }) => {
  let customer = await Customer.findOne({ email: customerEmail.toLowerCase() })

  if (!customer) {
    customer = new Customer({
      name: customerName,
      email: customerEmail.toLowerCase(),
      phone: customerPhone,
      status: 'active',
    })
    await customer.save()
  }

  return customer
}

const finalizePurchaseIfPaid = async ({ purchase, course, customer, providerTransactionId, providerResponse }) => {
  if (purchase.paymentStatus === 'paid' || purchase.status === 'completed') {
    return purchase
  }

  purchase.status = 'completed'
  purchase.paymentStatus = 'paid'
  purchase.providerTransactionId = providerTransactionId || purchase.providerTransactionId
  purchase.providerResponse = providerResponse || purchase.providerResponse
  purchase.paidAt = new Date()
  await purchase.save()

  if (!customer.purchases.some((id) => id.toString() === purchase._id.toString())) {
    customer.purchases.push(purchase._id)
  }
  customer.totalSpent += purchase.price
  await customer.save()

  const existingTransaction = await Transaction.findOne({ purchase: purchase._id })
  if (!existingTransaction) {
    const paymentMethodMap = {
      credit_card: 'credit_card',
      bank_transfer: 'bank_transfer',
      paypal: 'bank_transfer',
      other: 'other',
    }

    const transaction = new Transaction({
      type: 'income',
      category: 'course_sales',
      amount: purchase.price,
      description: `רכישת מסלול: ${course.title || 'מסלול'}`,
      date: new Date(),
      paymentMethod: paymentMethodMap[purchase.paymentMethod] || 'other',
      customer: customer._id || null,
      purchase: purchase._id,
      createdBy: 'customer',
      notes: `נוצר אוטומטית מרכישה #${purchase._id}`,
    })
    await transaction.save()
  }

  if (customer.email) {
    try {
      await sendPurchaseConfirmationEmail(purchase, course, customer)
    } catch (emailError) {
      console.error('❌ Error sending purchase confirmation email:', emailError)
    }
  }

  return purchase
}

// POST /api/purchases/create-checkout - Start Cardcom checkout flow
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { courseId, customerName, customerEmail, customerPhone, paymentMethod, notes } = req.body
    const frontendUrl = process.env.CUSTOMER_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    const backendUrl = process.env.CUSTOMER_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000'

    if (!isCardcomConfigured()) {
      return res.status(503).json({
        message: 'Cardcom payment provider is not configured on server.',
      })
    }

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not available' })
    }

    const customer = await getOrCreateCustomer({ customerName, customerEmail, customerPhone })
    const orderId = buildOrderId()

    const purchase = new Purchase({
      course: courseId,
      customer: customer._id,
      customerName,
      customerEmail,
      customerPhone,
      price: course.price,
      paymentMethod: paymentMethod || 'credit_card',
      notes: notes || '',
      orderId,
      provider: 'cardcom',
      status: 'pending',
      paymentStatus: 'pending',
    })
    await purchase.save()

    const checkout = await createCardcomCheckout({
      orderId,
      amount: course.price,
      customerName,
      customerEmail,
      customerPhone,
      productName: course.title || 'רכישת מסלול',
      successUrl: `${frontendUrl}/payment/success?orderId=${encodeURIComponent(orderId)}`,
      failedUrl: `${frontendUrl}/payment/failed?orderId=${encodeURIComponent(orderId)}`,
      callbackUrl: `${backendUrl}/api/purchases/cardcom/webhook`,
    })

    purchase.providerResponse = checkout.raw
    await purchase.save()

    res.status(201).json({
      message: 'Checkout created successfully',
      data: {
        purchaseId: purchase._id,
        orderId,
        checkoutUrl: checkout.checkoutUrl,
      },
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

// POST /api/purchases/cardcom/webhook - Cardcom server-to-server callback
router.post('/cardcom/webhook', async (req, res, next) => {
  try {
    if (!verifyCardcomCallbackSignature(req.body)) {
      return res.status(401).json({ message: 'Invalid callback signature' })
    }

    const callbackData = parseCardcomCallback(req.body)
    if (!callbackData.orderId) {
      return res.status(400).json({ message: 'Missing order id in callback' })
    }

    const purchase = await Purchase.findOne({ orderId: callbackData.orderId }).populate('course').populate('customer')
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' })
    }

    if (!callbackData.isSuccess) {
      purchase.paymentStatus = 'failed'
      purchase.status = 'cancelled'
      purchase.providerTransactionId = callbackData.providerTransactionId || purchase.providerTransactionId
      purchase.providerResponse = callbackData.raw
      await purchase.save()
      return res.json({ message: 'Payment marked as failed' })
    }

    const customer = purchase.customer?._id ? purchase.customer : await Customer.findById(purchase.customer)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found for purchase' })
    }

    await finalizePurchaseIfPaid({
      purchase,
      course: purchase.course || {},
      customer,
      providerTransactionId: callbackData.providerTransactionId,
      providerResponse: callbackData.raw,
    })

    res.json({ message: 'Payment callback processed successfully' })
  } catch (error) {
    next(error)
  }
})

// POST /api/purchases - Backward compatible manual purchase creation
router.post('/', async (req, res, next) => {
  try {
    const { courseId, customerName, customerEmail, customerPhone, paymentMethod, notes } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }
    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not available' })
    }

    const customer = await getOrCreateCustomer({ customerName, customerEmail, customerPhone })

    const purchase = new Purchase({
      course: courseId,
      customer: customer._id,
      customerName,
      customerEmail,
      customerPhone,
      price: course.price,
      paymentMethod: paymentMethod || 'other',
      notes: notes || '',
      provider: 'manual',
      paymentStatus: 'pending',
      status: 'pending',
    })
    await purchase.save()

    await finalizePurchaseIfPaid({
      purchase,
      course,
      customer,
      providerTransactionId: null,
      providerResponse: { source: 'manual-route' },
    })

    await purchase.populate('course', 'title')
    await purchase.populate('customer', 'name email phone')

    res.status(201).json({
      message: 'Purchase created successfully',
      data: purchase,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map((e) => e.message),
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

