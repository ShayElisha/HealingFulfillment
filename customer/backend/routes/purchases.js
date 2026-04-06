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
import { getChargeableAmount } from '../utils/coursePricing.js'
import { applyAutoCoachingWindowIfNeeded } from '../utils/coachingPurchaseWindow.js'
import {
  hasActiveSubscriptionForCustomerId,
  createSubscriptionForCompletedPurchase
} from '../utils/subscriptionFromPurchase.js'

const router = express.Router()

const buildOrderId = () => `HF-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

const ORDER_ID_PARAM_RE = /^HF-[A-Za-z0-9_-]+$/

/** תשלום הושלם בהצלחה (תומך ברשומות ישנות עם paid) */
function isPaymentSucceededStatus(status) {
  return status === 'succeeded' || status === 'paid'
}

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

/**
 * אחרי תשלום מאושר בלבד: מקשר/יוצר לקוח לפי אימייל (ללא כפילות), מעדכן רכישה, עסקה ומייל.
 */
async function runPaidSideEffects(purchase, course) {
  const email = (purchase.customerEmail || '').toLowerCase().trim()
  if (!email) {
    throw new Error('Purchase missing customerEmail')
  }

  let customer = null
  if (purchase.customer) {
    customer = await Customer.findById(purchase.customer)
  }
  if (!customer) {
    customer = await Customer.findOne({ email })
  }
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

    const transaction = new Transaction({
      type: 'income',
      category: 'course_sales',
      amount: purchase.price,
      description: `רכישת מסלול: ${course?.title || 'מסלול'}`,
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
      console.error('[Cardcom:email] confirmation failed', emailError?.message || emailError)
    }
  }

  try {
    await applyAutoCoachingWindowIfNeeded(purchase._id)
  } catch (e) {
    console.error('[coaching-window:auto] failed', e?.message || e)
  }

  try {
    await createSubscriptionForCompletedPurchase(purchase._id)
  } catch (subErr) {
    console.error('[subscription] create failed', subErr?.message || subErr)
  }
}

function cardcomAmountMatchesPurchase(purchase, cb) {
  if (cb.amount == null || purchase.amount == null) return true
  return Math.abs(cb.amount - purchase.amount) <= 0.02
}

/** מעבר pending→succeeded + runPaidSideEffects (אידמפוטנטי אם כבר הושלם) */
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

  await runPaidSideEffects(updated, updated.course)
  return { ok: true, duplicate: false, purchase: updated }
}

const finalizePurchaseIfPaid = async ({ purchase, course, providerTransactionId, providerResponse }) => {
  if (isPaymentSucceededStatus(purchase.paymentStatus) || purchase.status === 'completed') {
    return purchase
  }

  purchase.status = 'completed'
  purchase.paymentStatus = 'succeeded'
  purchase.providerTransactionId = providerTransactionId || purchase.providerTransactionId
  purchase.transactionId = providerTransactionId || purchase.transactionId
  purchase.providerResponse = providerResponse || purchase.providerResponse
  purchase.paidAt = new Date()
  await purchase.save()

  await runPaidSideEffects(purchase, course)

  return purchase
}

// POST /api/purchases/create-checkout - Start Cardcom checkout flow
router.post('/create-checkout', async (req, res, next) => {
  let pendingPurchase = null

  try {
    try {
      assertCardcomEnvConfigured()
    } catch (configErr) {
      console.error('[Cardcom:checkout] config error:', configErr.message)
      return res.status(503).json({
        message: configErr.message || 'Cardcom payment provider is not configured on server.',
      })
    }

    const { courseId, customerName, customerEmail, customerPhone, paymentMethod, notes } = req.body
    const frontendUrl = process.env.CUSTOMER_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    const backendUrl = process.env.CUSTOMER_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000'

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not available' })
    }

    const chargeAmount = getChargeableAmount(course)
    if (!chargeAmount || chargeAmount <= 0) {
      return res.status(400).json({
        message:
          'למסלול אין מחיר תקין לחיוב. עדכנו מחיר (או הנחה) במערכת הניהול.',
      })
    }

    const installmentsCount = Math.min(
      120,
      Math.max(1, Math.floor(Number(course.installmentsCount) || 1))
    )

    const emailLower = String(customerEmail || '')
      .trim()
      .toLowerCase()
    const existingWithLogin = await Customer.findOne({
      email: emailLower,
      hasAccount: true,
    }).select('_id')
    if (existingWithLogin) {
      return res.status(409).json({
        message:
          'כבר קיים חשבון לקוח עם אימייל זה. התחברו לתיק הלקוח לביצוע רכישה, או השתמשו באימייל אחר.',
      })
    }

    const existingCustomer = await Customer.findOne({ email: emailLower }).select('_id')
    if (
      existingCustomer &&
      (await hasActiveSubscriptionForCustomerId(existingCustomer._id))
    ) {
      return res.status(409).json({
        message:
          'קיים מנוי פעיל ללקוח עם אימייל זה. לא ניתן לבצע רכישה חדשה עד תום תקופת המנוי.',
      })
    }

    const orderId = buildOrderId()

    pendingPurchase = new Purchase({
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
    })
    await pendingPurchase.save()

    console.log('[Cardcom:payment] purchase created (pending)', {
      orderId,
      purchaseId: String(pendingPurchase._id),
      amount: pendingPurchase.amount,
    })

    console.log('[Cardcom:checkout] charge to Cardcom', {
      orderId,
      chargeAmount,
      installmentsMax: installmentsCount,
    })

    const checkout = await createCardcomCheckout({
      orderId,
      amount: chargeAmount,
      customerName,
      customerEmail,
      customerPhone,
      productName: course.title || 'רכישת מסלול',
      successUrl: `${frontendUrl}/payment/success?orderId=${encodeURIComponent(orderId)}`,
      failedUrl: `${frontendUrl}/payment/failed?orderId=${encodeURIComponent(orderId)}`,
      callbackUrl: `${backendUrl}/api/purchases/cardcom/webhook`,
      maxNumOfPayments: installmentsCount,
      minNumOfPayments: 1,
      defaultNumOfPayments: 1,
    })

    pendingPurchase.providerResponse = checkout.raw
    await pendingPurchase.save()

    console.log('[Cardcom:checkout] redirect to Cardcom issued', { orderId })

    res.status(201).json({
      message: 'Checkout created successfully',
      data: {
        purchaseId: pendingPurchase._id,
        orderId,
        checkoutUrl: checkout.checkoutUrl,
      },
    })
  } catch (error) {
    if (pendingPurchase?._id) {
      await Purchase.deleteOne({ _id: pendingPurchase._id, paymentStatus: 'pending' }).catch(() => {})
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map((e) => e.message),
      })
    }

    if (error instanceof CardcomApiError || error.code === 'CARDCOM_API') {
      console.error('[Cardcom:checkout] Cardcom API rejected:', error.message)
      return res.status(502).json({
        message: error.message,
        code: 'CARDCOM_REJECTED',
        ...(process.env.NODE_ENV === 'development' && error.responseCode
          ? { responseCode: error.responseCode }
          : {}),
      })
    }

    next(error)
  }
})

/**
 * Cardcom Indicator (webhook) — אימות לפי WebhookSecret בלבד.
 * תמיד מחזירים HTTP 200 אחרי עיבוד כדי שלא יינעלו חוזרים מיותרים מצד Cardcom.
 * אישור לקוח: webhook או POST /cardcom/confirm-from-redirect (אימות מול Cardcom לפי lowProfileCode מה-URL).
 */
router.post('/cardcom/webhook', async (req, res) => {
  const ok = (extra = {}) => {
    res.status(200).json({ ok: true, ...extra })
  }

  try {
    if (!isCardcomConfigured()) {
      console.error('[Cardcom:webhook] env incomplete — cannot verify')
      return ok({ processed: false, reason: 'config' })
    }

    if (!verifyCardcomWebhookSecret(req.body)) {
      console.warn('[Cardcom:webhook] invalid WebhookSecret (rejected)', {
        hasBody: Boolean(req.body && Object.keys(req.body).length),
      })
      return ok({ processed: false, reason: 'unauthorized' })
    }

    const cb = parseCardcomCallback(req.body)
    console.log('[Cardcom:webhook] received', {
      orderId: cb.orderId,
      responseCode: cb.responseCode,
    })

    if (!cb.orderId) {
      console.warn('[Cardcom:webhook] missing ReturnValue / orderId')
      return ok({ processed: false, reason: 'no_order' })
    }

    const purchase = await Purchase.findOne({
      orderId: cb.orderId,
      provider: 'cardcom',
    })

    if (!purchase) {
      console.warn('[Cardcom:webhook] purchase not in database', { orderId: cb.orderId })
      return ok({ processed: false, reason: 'not_found' })
    }

    if (isPaymentSucceededStatus(purchase.paymentStatus) && purchase.status === 'completed') {
      console.log('[Cardcom:webhook] idempotent — already succeeded', { orderId: cb.orderId })
      return ok({ processed: true, duplicate: true })
    }

    if (isPaymentSucceededStatus(purchase.paymentStatus)) {
      if (!cb.isSuccess) {
        console.warn('[Cardcom:webhook] ignoring failure notification for succeeded order', { orderId: cb.orderId })
        return ok({ processed: true, ignored: true })
      }
      return ok({ processed: true, duplicate: true })
    }

    if (purchase.paymentStatus === 'failed') {
      console.warn('[Cardcom:webhook] order already failed — no auto re-activation', { orderId: cb.orderId })
      return ok({ processed: false, reason: 'already_failed' })
    }

    if (!cardcomAmountMatchesPurchase(purchase, cb)) {
      console.error('[Cardcom:webhook] amount mismatch', {
        orderId: cb.orderId,
        expected: purchase.amount,
        got: cb.amount,
      })
      return ok({ processed: false, reason: 'amount_mismatch' })
    }

    const txnId = cb.internalDealNumber || cb.providerTransactionId

    if (!cb.isSuccess) {
      await Purchase.findOneAndUpdate(
        {
          _id: purchase._id,
          paymentStatus: 'pending',
          provider: 'cardcom',
        },
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
        },
        { new: true }
      )
      console.log('[Cardcom:payment] failed', {
        orderId: cb.orderId,
        responseCode: cb.responseCode,
        description: cb.description?.slice?.(0, 200),
      })
      return ok({ processed: true, success: false })
    }

    const result = await applyCardcomSuccessToPendingPurchase(purchase, cb)
    if (!result.ok) {
      console.warn('[Cardcom:webhook] pending→succeeded transition failed', { orderId: cb.orderId })
      return ok({ processed: false, reason: 'state' })
    }
    if (result.duplicate) {
      console.log('[Cardcom:webhook] concurrent update — already succeeded', { orderId: cb.orderId })
      return ok({ processed: true, duplicate: true })
    }

    console.log('[Cardcom:payment] approved (webhook)', {
      orderId: cb.orderId,
      transactionId: result.purchase.transactionId,
    })

    return ok({ processed: true, success: true })
  } catch (err) {
    console.error('[Cardcom:webhook] handler error', err?.message || err)
    return ok({ processed: false, reason: 'error' })
  }
})

/**
 * אחרי חזרה מ-SuccessRedirectUrl: מאמתים מול Cardcom (GetLowProfileIndicator) עם lowProfileCode מה-query.
 * נדרש כש-IndicatorUrl (webhook) לא נגיש — למשל localhost בלי ngrok.
 */
router.post('/cardcom/confirm-from-redirect', async (req, res, next) => {
  try {
    if (!isCardcomConfigured()) {
      return res.status(503).json({ message: 'תשלום Cardcom לא מוגדר בשרת' })
    }

    const orderId = String(req.body?.orderId || '').trim()
    const lowProfileCode = String(req.body?.lowProfileCode || '').trim()

    if (!ORDER_ID_PARAM_RE.test(orderId)) {
      return res.status(400).json({ message: 'מזהה הזמנה לא תקין' })
    }
    if (!lowProfileCode) {
      return res.status(400).json({ message: 'חסר lowProfileCode' })
    }

    const purchase = await Purchase.findOne({ orderId, provider: 'cardcom' })
    if (!purchase) {
      return res.status(404).json({ message: 'ההזמנה לא נמצאה' })
    }

    if (isPaymentSucceededStatus(purchase.paymentStatus)) {
      return res.json({
        message: 'ok',
        data: {
          orderId: purchase.orderId,
          paymentStatus: purchase.paymentStatus,
          status: purchase.status,
          paidAt: purchase.paidAt,
          provider: purchase.provider,
          alreadySucceeded: true,
        },
      })
    }

    if (purchase.paymentStatus === 'failed') {
      return res.json({
        message: 'ok',
        data: {
          orderId: purchase.orderId,
          paymentStatus: purchase.paymentStatus,
          status: purchase.status,
          paidAt: purchase.paidAt,
          provider: purchase.provider,
        },
      })
    }

    let indicator
    try {
      indicator = await fetchCardcomLowProfileIndicator(lowProfileCode)
    } catch (e) {
      if (e instanceof CardcomApiError) {
        console.warn('[Cardcom:confirm] GetLowProfileIndicator failed', e.message)
        return res.status(502).json({
          message: e.message || 'לא ניתן לאמת את העסקה מול Cardcom',
        })
      }
      throw e
    }

    if (String(indicator.apiResponseCode) !== '0') {
      console.warn('[Cardcom:confirm] API ResponseCode', {
        orderId,
        apiResponseCode: indicator.apiResponseCode,
        apiDescription: indicator.apiDescription,
      })
      return res.status(502).json({
        message: indicator.apiDescription || 'לא ניתן לאמת את העסקה מול Cardcom',
      })
    }

    if (indicator.returnValue !== orderId) {
      console.warn('[Cardcom:confirm] ReturnValue mismatch', { orderId, got: indicator.returnValue })
      return res.status(400).json({ message: 'הקישור לא תואם להזמנה' })
    }

    const cb = buildCardcomCallbackFromLowProfileIndicator(indicator)
    if (!cb.orderId || cb.orderId !== orderId) {
      return res.status(400).json({ message: 'הקישור לא תואם להזמנה' })
    }

    if (!cardcomAmountMatchesPurchase(purchase, cb)) {
      console.error('[Cardcom:confirm] amount mismatch', {
        orderId,
        expected: purchase.amount,
        got: cb.amount,
      })
      return res.status(400).json({ message: 'סכום העסקה לא תואם' })
    }

    if (!cb.isSuccess) {
      return res.json({
        message: 'ok',
        data: {
          orderId: purchase.orderId,
          paymentStatus: purchase.paymentStatus,
          status: purchase.status,
          paidAt: purchase.paidAt,
          provider: purchase.provider,
        },
      })
    }

    const result = await applyCardcomSuccessToPendingPurchase(purchase, cb)
    if (!result.ok) {
      return res.status(409).json({ message: 'לא ניתן לעדכן את מצב התשלום' })
    }

    const p = result.purchase
    return res.json({
      message: 'ok',
      data: {
        orderId: p.orderId,
        paymentStatus: p.paymentStatus,
        status: p.status,
        paidAt: p.paidAt,
        provider: p.provider,
        synced: !result.duplicate,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/purchases/payment-status/:orderId — לצורך דף הצלחה (poll), בלי לאשר תשלום בלקוח
router.get('/payment-status/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params
    if (!ORDER_ID_PARAM_RE.test(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' })
    }

    const purchase = await Purchase.findOne({ orderId }).select(
      'orderId paymentStatus status paidAt provider'
    )

    if (!purchase) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json({
      message: 'ok',
      data: {
        orderId: purchase.orderId,
        paymentStatus: purchase.paymentStatus,
        status: purchase.status,
        paidAt: purchase.paidAt,
        provider: purchase.provider,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/purchases - Backward compatible manual purchase creation (לא Cardcom)
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
      paymentStatus: 'pending',
      status: 'pending',
    })
    await purchase.save()

    await finalizePurchaseIfPaid({
      purchase,
      course,
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
      data: purchases,
    })
  } catch (error) {
    next(error)
  }
})

export default router
