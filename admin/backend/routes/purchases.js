import express from 'express'
import Purchase from '../models/Purchase.js'
import Course from '../models/Course.js'
import Customer from '../models/Customer.js'
import Transaction from '../models/Transaction.js'
import { sendPurchaseConfirmationEmail } from '../services/emailService.js'
import {
  assertCardcomEnvConfigured,
  buildCardcomCallbackFromLowProfileIndicator,
  CardcomApiError,
  createCardcomCheckout,
  fetchCardcomLowProfileIndicator,
  isCardcomConfigured,
  parseCardcomCallback,
  verifyCardcomWebhookSecret,
} from '../services/cardcomService.js'
import { applyAutoCoachingWindowIfNeeded } from '../utils/coachingPurchaseWindow.js'
import { getChargeableAmount } from '../utils/coursePricing.js'
import {
  hasActiveSubscriptionForCustomerId,
  createSubscriptionForCompletedPurchase
} from '../utils/subscriptionFromPurchase.js'

const router = express.Router()
const ORDER_ID_PARAM_RE = /^HF-[A-Za-z0-9_-]+$/
const buildOrderId = () => `HF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

function isPaymentSucceededStatus(status) {
  return status === 'succeeded' || status === 'paid'
}

function cardcomAmountMatchesPurchase(purchase, cb) {
  if (cb.amount == null || purchase.amount == null) return true
  return Math.abs(cb.amount - purchase.amount) <= 0.02
}

async function runPaidSideEffects(purchase, course, createdBy = 'admin') {
  const email = (purchase.customerEmail || '').toLowerCase().trim()
  if (!email) throw new Error('Purchase missing customerEmail')

  let customer = purchase.customer ? await Customer.findById(purchase.customer) : null
  if (!customer) customer = await Customer.findOne({ email })
  if (!customer) {
    customer = new Customer({
      name: purchase.customerName || 'לקוח',
      email,
      phone: purchase.customerPhone || '',
      status: 'active',
    })
    await customer.save()
  }

  await Purchase.updateOne({ _id: purchase._id }, { $set: { customer: customer._id } })
  purchase.customer = customer._id

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
    await new Transaction({
      type: 'income',
      category: 'course_sales',
      amount: purchase.price,
      description: `רכישת מסלול: ${course?.title || 'מסלול'}`,
      date: new Date(),
      paymentMethod: paymentMethodMap[purchase.paymentMethod] || 'other',
      customer: customer._id || null,
      purchase: purchase._id,
      createdBy,
      notes: `נוצר אוטומטית מרכישה #${purchase._id}`,
    }).save()
  }

  if (customer.email) {
    try {
      await sendPurchaseConfirmationEmail(purchase, course, customer)
    } catch (emailError) {
      console.error('[Cardcom:email] confirmation failed', emailError?.message || emailError)
    }
  }
  try {
    await applyAutoCoachingWindowIfNeeded(purchase._id)
  } catch (err) {
    console.error('[coaching-window:auto] failed', err?.message || err)
  }
  try {
    await createSubscriptionForCompletedPurchase(purchase._id)
  } catch (err) {
    console.error('[subscription] create failed', err?.message || err)
  }
}

async function applyCardcomSuccessToPendingPurchase(purchase, cb) {
  const txnId = cb.internalDealNumber || cb.providerTransactionId
  const updated = await Purchase.findOneAndUpdate(
    {
      _id: purchase._id,
      orderId: cb.orderId,
      provider: 'cardcom',
      paymentStatus: 'pending',
    },
    {
      $set: {
        paymentStatus: 'succeeded',
        status: 'completed',
        paidAt: new Date(),
        transactionId: txnId,
        providerTransactionId: txnId,
        cardcomResponseCode: cb.responseCode,
        cardcomDescription: cb.description,
        providerResponse: cb.raw,
      },
    },
    { new: true }
  ).populate('course', 'title price sessionsCount installmentsCount')

  if (!updated) {
    const again = await Purchase.findOne({ orderId: cb.orderId })
    if (again && isPaymentSucceededStatus(again.paymentStatus)) {
      return { ok: true, duplicate: true, purchase: again }
    }
    return { ok: false, reason: 'state' }
  }

  await runPaidSideEffects(updated, updated.course, 'admin')
  return { ok: true, duplicate: false, purchase: updated }
}

router.post('/create-checkout', async (req, res, next) => {
  let pendingPurchase = null
  try {
    assertCardcomEnvConfigured()
    const { courseId, customerName, customerEmail, customerPhone, paymentMethod, notes } = req.body
    const frontendUrl = process.env.ADMIN_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001'
    const backendUrl = process.env.ADMIN_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5001'

    const course = await Course.findById(courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    if (!course.isActive) return res.status(400).json({ message: 'Course is not available' })

    const chargeAmount = getChargeableAmount(course)
    if (!chargeAmount || chargeAmount <= 0) {
      return res.status(400).json({ message: 'למסלול אין מחיר תקין לחיוב.' })
    }

    const emailLower = String(customerEmail || '').trim().toLowerCase()
    const existingCustomer = await Customer.findOne({ email: emailLower }).select('_id')
    if (existingCustomer && (await hasActiveSubscriptionForCustomerId(existingCustomer._id))) {
      return res.status(409).json({
        message: 'קיים מנוי פעיל ללקוח עם אימייל זה. לא ניתן לבצע רכישה חדשה עד תום תקופת המנוי.',
      })
    }

    const installmentsCount = Math.min(120, Math.max(1, Math.floor(Number(course.installmentsCount) || 1)))
    const orderId = buildOrderId()
    pendingPurchase = await new Purchase({
      course: courseId,
      customerName,
      customerEmail,
      customerPhone,
      price: chargeAmount,
      amount: Number(Number(chargeAmount).toFixed(2)),
      paymentMethod: paymentMethod || 'credit_card',
      notes: notes || '',
      orderId,
      provider: 'cardcom',
      status: 'pending',
      paymentStatus: 'pending',
    }).save()

    const returnBase = `${frontendUrl}/purchase?orderId=${encodeURIComponent(orderId)}`
    const checkout = await createCardcomCheckout({
      orderId,
      amount: chargeAmount,
      customerName,
      customerEmail,
      customerPhone,
      productName: course.title || 'רכישת מסלול',
      successUrl: `${returnBase}&cardcom=success`,
      failedUrl: `${returnBase}&cardcom=failed`,
      callbackUrl: `${backendUrl}/api/purchases/cardcom/webhook`,
      maxNumOfPayments: installmentsCount,
      minNumOfPayments: 1,
      defaultNumOfPayments: 1,
    })

    pendingPurchase.providerResponse = checkout.raw
    await pendingPurchase.save()

    return res.status(201).json({
      message: 'Checkout created successfully',
      data: { purchaseId: pendingPurchase._id, orderId, checkoutUrl: checkout.checkoutUrl },
    })
  } catch (error) {
    if (pendingPurchase?._id) {
      await Purchase.deleteOne({ _id: pendingPurchase._id, paymentStatus: 'pending' }).catch(() => {})
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: Object.values(error.errors).map((e) => e.message) })
    }
    if (error instanceof CardcomApiError || error.code === 'CARDCOM_API') {
      return res.status(502).json({ message: error.message, code: 'CARDCOM_REJECTED' })
    }
    next(error)
  }
})

router.post('/cardcom/webhook', async (req, res) => {
  const ok = (extra = {}) => res.status(200).json({ ok: true, ...extra })
  try {
    if (!isCardcomConfigured()) return ok({ processed: false, reason: 'config' })
    if (!verifyCardcomWebhookSecret(req.body)) return ok({ processed: false, reason: 'unauthorized' })

    const cb = parseCardcomCallback(req.body)
    if (!cb.orderId) return ok({ processed: false, reason: 'no_order' })
    const purchase = await Purchase.findOne({ orderId: cb.orderId, provider: 'cardcom' })
    if (!purchase) return ok({ processed: false, reason: 'not_found' })
    if (isPaymentSucceededStatus(purchase.paymentStatus)) return ok({ processed: true, duplicate: true })
    if (purchase.paymentStatus === 'failed') return ok({ processed: false, reason: 'already_failed' })
    if (!cardcomAmountMatchesPurchase(purchase, cb)) return ok({ processed: false, reason: 'amount_mismatch' })

    const txnId = cb.internalDealNumber || cb.providerTransactionId
    if (!cb.isSuccess) {
      await Purchase.findOneAndUpdate(
        { _id: purchase._id, paymentStatus: 'pending', provider: 'cardcom' },
        {
          $set: {
            paymentStatus: 'failed',
            status: 'cancelled',
            cardcomResponseCode: cb.responseCode,
            cardcomDescription: cb.description,
            providerResponse: cb.raw,
            transactionId: txnId || purchase.transactionId,
            providerTransactionId: txnId || purchase.providerTransactionId,
          },
        }
      )
      return ok({ processed: true, success: false })
    }

    const result = await applyCardcomSuccessToPendingPurchase(purchase, cb)
    if (!result.ok) return ok({ processed: false, reason: 'state' })
    return ok({ processed: true, success: true, duplicate: Boolean(result.duplicate) })
  } catch (err) {
    console.error('[Cardcom:webhook] handler error', err?.message || err)
    return ok({ processed: false, reason: 'error' })
  }
})

router.post('/cardcom/confirm-from-redirect', async (req, res, next) => {
  try {
    if (!isCardcomConfigured()) return res.status(503).json({ message: 'תשלום Cardcom לא מוגדר בשרת' })
    const orderId = String(req.body?.orderId || '').trim()
    const lowProfileCode = String(req.body?.lowProfileCode || '').trim()
    if (!ORDER_ID_PARAM_RE.test(orderId)) return res.status(400).json({ message: 'מזהה הזמנה לא תקין' })
    if (!lowProfileCode) return res.status(400).json({ message: 'חסר lowProfileCode' })

    const purchase = await Purchase.findOne({ orderId, provider: 'cardcom' })
    if (!purchase) return res.status(404).json({ message: 'ההזמנה לא נמצאה' })
    if (isPaymentSucceededStatus(purchase.paymentStatus) || purchase.paymentStatus === 'failed') {
      return res.json({ message: 'ok', data: purchase })
    }

    const indicator = await fetchCardcomLowProfileIndicator(lowProfileCode)
    if (String(indicator.apiResponseCode) !== '0') {
      return res.status(502).json({ message: indicator.apiDescription || 'לא ניתן לאמת את העסקה מול Cardcom' })
    }
    if (indicator.returnValue !== orderId) return res.status(400).json({ message: 'הקישור לא תואם להזמנה' })

    const cb = buildCardcomCallbackFromLowProfileIndicator(indicator)
    if (!cb.orderId || cb.orderId !== orderId) return res.status(400).json({ message: 'הקישור לא תואם להזמנה' })
    if (!cardcomAmountMatchesPurchase(purchase, cb)) return res.status(400).json({ message: 'סכום העסקה לא תואם' })
    if (!cb.isSuccess) return res.json({ message: 'ok', data: purchase })

    const result = await applyCardcomSuccessToPendingPurchase(purchase, cb)
    if (!result.ok) return res.status(409).json({ message: 'לא ניתן לעדכן את מצב התשלום' })
    return res.json({ message: 'ok', data: result.purchase })
  } catch (error) {
    if (error instanceof CardcomApiError || error.code === 'CARDCOM_API') {
      return res.status(502).json({ message: error.message })
    }
    next(error)
  }
})

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

    if (await hasActiveSubscriptionForCustomerId(customer._id)) {
      return res.status(409).json({
        message:
          'קיים מנוי פעיל ללקוח עם אימייל זה. לא ניתן לבצע רכישה חדשה עד תום תקופת המנוי.',
      })
    }

    const manualCharge = getChargeableAmount(course)
    const purchase = new Purchase({
      course: courseId,
      customer: customer._id,
      customerName,
      customerEmail,
      customerPhone,
      price: manualCharge,
      amount: Number(Number(manualCharge || 0).toFixed(2)),
      paymentMethod: paymentMethod || 'other',
      notes: notes || '',
      provider: 'manual',
      paymentStatus: status === 'completed' ? 'succeeded' : 'pending',
      status: status || 'pending'
    })

    await purchase.save()
    
    // Add purchase to customer
    customer.purchases.push(purchase._id)
    customer.totalSpent += purchase.price
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

      try {
        await applyAutoCoachingWindowIfNeeded(purchase._id)
      } catch (coachingErr) {
        console.error('[coaching-window:auto] admin create purchase', coachingErr?.message || coachingErr)
      }

      try {
        await createSubscriptionForCompletedPurchase(purchase._id)
      } catch (subErr) {
        console.error('[subscription] admin create purchase', subErr?.message || subErr)
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

// GET /api/purchases - Get all purchases (admin); ?page=&limit= לעימוד
router.get('/', async (req, res, next) => {
  try {
    const usePaging = req.query.page !== undefined || req.query.limit !== undefined
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 80))
    const skip = (page - 1) * limit

    const base = () =>
      Purchase.find().populate('course', 'title price').sort({ createdAt: -1 })

    if (!usePaging) {
      const purchases = await base().lean()
      return res.json({
        message: 'Purchases retrieved successfully',
        data: purchases,
      })
    }

    const [purchases, total] = await Promise.all([
      base().skip(skip).limit(limit).lean(),
      Purchase.countDocuments({}),
    ])

    res.json({
      message: 'Purchases retrieved successfully',
      data: purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router

