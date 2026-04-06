import Subscription from '../models/Subscription.js'
import Purchase from '../models/Purchase.js'
import Customer from '../models/Customer.js'
import Course from '../models/Course.js'
import { addCalendarMonths } from './coachingPurchaseWindow.js'

const DEFAULT_COACHING_MONTHS = 3

export function buildPlanSnapshot(course) {
  if (!course) return undefined
  const doc = typeof course.toObject === 'function' ? course.toObject() : { ...course }
  const months = doc.coachingProcessMonths
  return {
    title: doc.title || '',
    description: doc.description || '',
    price: doc.price != null ? Number(doc.price) : 0,
    discount: doc.discount != null ? Number(doc.discount) : 0,
    coachingProcessMonths:
      months != null && Number(months) >= 1 ? Math.min(120, Number(months)) : null,
    installmentsCount: Math.min(120, Math.max(1, Math.floor(Number(doc.installmentsCount) || 1))),
    sessionsCount: doc.sessionsCount != null ? Number(doc.sessionsCount) : null,
    capturedAt: new Date()
  }
}

export function computeSubscriptionBounds(customer, purchase, months) {
  const m =
    months != null && Number(months) >= 1
      ? Math.min(120, Number(months))
      : DEFAULT_COACHING_MONTHS
  const anchorRaw = customer?.caseOpenedAt || purchase?.paidAt || purchase?.createdAt
  if (!anchorRaw) return null
  const startedAt = new Date(anchorRaw)
  const endsAt = addCalendarMonths(startedAt, m)
  return { startedAt, endsAt, monthsUsed: m }
}

export async function hasActiveSubscriptionForCustomerId(customerId) {
  if (!customerId) return false
  const now = new Date()
  const sub = await Subscription.findOne({
    customer: customerId,
    status: 'active',
    endsAt: { $gt: now }
  })
    .select('_id')
    .lean()
  return Boolean(sub)
}

export async function hasActiveSubscriptionForEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase()
  if (!e) return false
  const customer = await Customer.findOne({ email: e }).select('_id').lean()
  if (!customer) return false
  return hasActiveSubscriptionForCustomerId(customer._id)
}

/**
 * יוצר מנוי מרכישה שהושלמה. אידמפוטנטי לפי purchase (ייחודי).
 * @returns {Promise<boolean>} true אם נוצר או כבר היה קיים
 */
export async function createSubscriptionForCompletedPurchase(purchaseId) {
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase || purchase.status !== 'completed' || !purchase.customer) {
    return false
  }

  const existing = await Subscription.findOne({ purchase: purchase._id }).select('_id').lean()
  if (existing) {
    return true
  }

  const customer = await Customer.findById(purchase.customer)
  if (!customer) return false

  const course = await Course.findById(purchase.course)
  const planSnapshot = buildPlanSnapshot(course)
  const months =
    planSnapshot?.coachingProcessMonths != null && Number(planSnapshot.coachingProcessMonths) >= 1
      ? planSnapshot.coachingProcessMonths
      : course?.coachingProcessMonths != null && Number(course.coachingProcessMonths) >= 1
        ? Math.min(120, Number(course.coachingProcessMonths))
        : DEFAULT_COACHING_MONTHS

  const bounds = computeSubscriptionBounds(customer, purchase, months)
  if (!bounds) return false

  const sub = new Subscription({
    customer: customer._id,
    purchase: purchase._id,
    course: purchase.course,
    planSnapshot,
    status: 'active',
    startedAt: bounds.startedAt,
    endsAt: bounds.endsAt
  })
  await sub.save()
  return true
}
