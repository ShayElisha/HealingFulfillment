import express from 'express'
import Purchase from '../models/Purchase.js'
import Course from '../models/Course.js'
import Customer from '../models/Customer.js'
import Booking from '../models/Booking.js'
import TriggerJournalEntry from '../models/TriggerJournalEntry.js'
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
  cancelCardcomDealByInternalId,
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
const REFUND_WINDOW_HOURS = 24
const REFUND_TRIGGER_MIN_PER_DAY = 3

function startOfUtcDay(d) {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function endOfUtcDay(d) {
  const x = new Date(d)
  x.setUTCHours(23, 59, 59, 999)
  return x
}

function ymdUtc(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function dayDiffInclusive(start, end) {
  const ms = endOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1
}

async function getRefundEligibility(purchase) {
  const base = {
    eligible: false,
    reasons: [],
    checks: {
      providerIsCardcom: purchase.provider === 'cardcom',
      paymentCompleted: isPaymentSucceededStatus(purchase.paymentStatus),
      hasCustomer: Boolean(purchase.customer),
      within24Hours: false,
      hasLessThanThreeCompletedMeetings: false,
      hasThreeTriggerLogsPerDay: false,
    },
    metrics: {
      hoursSincePurchase: null,
      completedMeetingsCount: 0,
      triggerDaysEvaluated: 0,
      triggerDaysMeetingThreshold: 0,
      triggerThresholdPerDay: REFUND_TRIGGER_MIN_PER_DAY,
    },
  }

  if (!base.checks.providerIsCardcom) base.reasons.push('החזר תהליךי זמין רק לרכישות Cardcom')
  if (!base.checks.paymentCompleted) base.reasons.push('התשלום לא הושלם ולכן לא ניתן להתחיל תהליך החזר')
  if (!base.checks.hasCustomer) base.reasons.push('הרכישה לא מקושרת ללקוח במערכת')
  if (base.reasons.length) return base

  const purchaseDate = purchase.paidAt || purchase.createdAt
  if (purchaseDate) {
    const hoursSincePurchase = (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60)
    base.metrics.hoursSincePurchase = Number(hoursSincePurchase.toFixed(2))
    base.checks.within24Hours = hoursSincePurchase <= REFUND_WINDOW_HOURS
  }

  const completedMeetings = await Booking.find({
    customer: purchase.customer,
    status: 'completed',
    isIntroMeeting: false,
  })
    .sort({ preferredDate: 1, createdAt: 1 })
    .select('preferredDate')
    .lean()

  base.metrics.completedMeetingsCount = completedMeetings.length
  base.checks.hasLessThanThreeCompletedMeetings = completedMeetings.length < 3

  if (base.checks.hasLessThanThreeCompletedMeetings && completedMeetings.length > 0) {
    const firstMeetingDate = startOfUtcDay(completedMeetings[0].preferredDate)
    const thirdMeetingDate = completedMeetings[2]?.preferredDate
    const endDateRaw = thirdMeetingDate || new Date()
    const rangeStart = firstMeetingDate
    const rangeEnd = endOfUtcDay(endDateRaw)

    const grouped = await TriggerJournalEntry.aggregate([
      {
        $match: {
          customer: purchase.customer,
          entryDate: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$entryDate', timezone: 'UTC' },
          },
          count: { $sum: 1 },
        },
      },
    ])

    const byDay = new Map(grouped.map((g) => [g._id, g.count]))
    const totalDays = dayDiffInclusive(rangeStart, rangeEnd)
    let okDays = 0
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(rangeStart)
      d.setUTCDate(d.getUTCDate() + i)
      const key = ymdUtc(d)
      if ((byDay.get(key) || 0) >= REFUND_TRIGGER_MIN_PER_DAY) okDays += 1
    }
    base.metrics.triggerDaysEvaluated = totalDays
    base.metrics.triggerDaysMeetingThreshold = okDays
    base.checks.hasThreeTriggerLogsPerDay = totalDays > 0 && okDays === totalDays
  }

  const ruleOne = base.checks.within24Hours
  const ruleTwo = base.checks.hasLessThanThreeCompletedMeetings && base.checks.hasThreeTriggerLogsPerDay
  base.eligible = ruleOne || ruleTwo

  if (!base.eligible) {
    base.reasons.push('לא עומד בתנאי 24 שעות מהרכישה')
    base.reasons.push('לא עומד בתנאי מפגשים/תיעודי טריגרים עד למפגש השלישי')
  }

  return base
}

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
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
    // תמיד מחזירים לפלטפורמת המנהל בלבד (לא ללקוח/public)
    const frontendUrl =
      process.env.ADMIN_FRONTEND_URL ||
      (isProd && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')
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

    const returnBase = `${frontendUrl}/customers?orderId=${encodeURIComponent(orderId)}`
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
    const normalizedName = String(customerName || '').trim()
    const normalizedEmail = String(customerEmail || '').trim().toLowerCase()
    const normalizedPhone = String(customerPhone || '').trim()

    if (!normalizedName || !normalizedEmail || !normalizedPhone) {
      return res.status(400).json({
        message: 'חובה למלא שם מלא, אימייל וטלפון ברכישה ידנית.',
      })
    }

    // Get course details
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not available' })
    }

    // Find or create customer
    let customer = await Customer.findOne({ email: normalizedEmail })
    
    if (!customer) {
      // Create new customer (resilient to race conditions on unique email)
      try {
        customer = new Customer({
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          status: 'active',
          caseOpenedAt: new Date(),
        })
        await customer.save()
      } catch (customerCreateError) {
        if (customerCreateError?.code === 11000) {
          customer = await Customer.findOne({ email: normalizedEmail })
        } else {
          throw customerCreateError
        }
      }
    }

    if (!customer) {
      return res.status(500).json({
        message: 'הרכישה נשמרה ללא יצירת לקוח עקב שגיאה בלתי צפויה. נסה שוב.',
      })
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
      customerName: normalizedName,
      customerEmail: normalizedEmail,
      customerPhone: normalizedPhone,
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

// GET /api/purchases/:id/refund-eligibility - evaluate refund process rules
router.get('/:id/refund-eligibility', async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id).lean()
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' })
    const eligibility = await getRefundEligibility(purchase)
    return res.json({
      message: 'Refund eligibility evaluated',
      data: { purchaseId: purchase._id, eligibility },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/purchases/:id/refund-request - start refund process
router.post('/:id/refund-request', async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' })

    const eligibility = await getRefundEligibility(purchase.toObject())
    if (!eligibility.eligible) {
      return res.status(400).json({
        message: 'הרכישה אינה עומדת בתנאי פתיחת תהליך החזר',
        data: { eligibility },
      })
    }

    purchase.refundStatus = 'requested'
    purchase.refundRequestedAt = new Date()
    purchase.refundRequestReason = String(req.body?.reason || '').trim()
    purchase.refundDecisionReason = ''
    purchase.refundEligibilitySnapshot = eligibility
    await purchase.save()

    return res.json({
      message: 'תהליך החזר נפתח בהצלחה',
      data: purchase,
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/purchases/:id/refund-request - manager decision/progress
router.put('/:id/refund-request', async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' })

    const action = String(req.body?.action || '').trim()
    const reason = String(req.body?.reason || '').trim()
    const now = new Date()

    if (!['approve', 'reject', 'mark_refunded', 'mark_failed'].includes(action)) {
      return res.status(400).json({ message: 'action חייב להיות approve/reject/mark_refunded/mark_failed' })
    }

    if (action === 'approve') {
      purchase.refundStatus = 'approved'
      purchase.refundReviewedAt = now
      purchase.refundDecisionReason = reason

      if (purchase.provider === 'cardcom') {
        const internalDealNumber = purchase.providerTransactionId || purchase.transactionId
        if (!internalDealNumber) {
          return res.status(400).json({
            message: 'לא נמצא מזהה עסקה ל-Cardcom. לא ניתן לבצע זיכוי אוטומטי.',
          })
        }

        try {
          const refundRes = await cancelCardcomDealByInternalId({
            internalDealNumber,
            amount: purchase.amount || purchase.price,
          })
          purchase.refundStatus = 'refunded'
          purchase.refundCompletedAt = new Date()
          purchase.paymentStatus = 'cancelled'
          purchase.status = 'cancelled'
          purchase.providerResponse = {
            ...(purchase.providerResponse || {}),
            refundResponse: refundRes,
          }
        } catch (refundErr) {
          purchase.refundStatus = 'failed'
          purchase.refundCompletedAt = new Date()
          purchase.refundDecisionReason = reason || `Cardcom refund failed: ${refundErr?.message || 'unknown error'}`
        }
      }
    } else if (action === 'reject') {
      purchase.refundStatus = 'rejected'
      purchase.refundReviewedAt = now
      purchase.refundDecisionReason = reason
    } else if (action === 'mark_refunded') {
      purchase.refundStatus = 'refunded'
      purchase.refundCompletedAt = now
      purchase.refundDecisionReason = reason || purchase.refundDecisionReason
      purchase.paymentStatus = 'cancelled'
      purchase.status = 'cancelled'
    } else if (action === 'mark_failed') {
      purchase.refundStatus = 'failed'
      purchase.refundCompletedAt = now
      purchase.refundDecisionReason = reason || purchase.refundDecisionReason
    }

    await purchase.save()
    return res.json({
      message: 'סטטוס תהליך ההחזר עודכן',
      data: purchase,
    })
  } catch (error) {
    next(error)
  }
})

export default router

