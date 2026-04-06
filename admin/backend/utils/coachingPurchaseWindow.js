import Purchase from '../models/Purchase.js'
import Customer from '../models/Customer.js'
import Course from '../models/Course.js'

const DEFAULT_COACHING_MONTHS = 3

export function addCalendarMonths(date, months) {
  const m = Math.min(120, Math.max(1, parseInt(months, 10) || DEFAULT_COACHING_MONTHS))
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setMonth(d.getMonth() + m)
  if (d.getDate() < day) d.setDate(0)
  return d
}

/**
 * שמירה אוטומטית של תקופת ליווי על רכישה (אם עדיין אין תאריכים).
 * תאריך בסיס: פתיחת תיק → תאריך חיוב → תאריך יצירת רכישה.
 */
export async function applyAutoCoachingWindowIfNeeded(purchaseId) {
  const purchase = await Purchase.findById(purchaseId)
  if (!purchase || purchase.status !== 'completed') return false
  if (purchase.coachingStartedAt && purchase.coachingEndsAt) return false
  if (!purchase.customer) return false

  const customer = await Customer.findById(purchase.customer)
  if (!customer) return false

  const course = await Course.findById(purchase.course).select('coachingProcessMonths')
  const months =
    course?.coachingProcessMonths != null && Number(course.coachingProcessMonths) >= 1
      ? Math.min(120, Number(course.coachingProcessMonths))
      : DEFAULT_COACHING_MONTHS

  const anchorRaw = customer.caseOpenedAt || purchase.paidAt || purchase.createdAt
  if (!anchorRaw) return false

  const start = new Date(anchorRaw)
  const end = addCalendarMonths(start, months)
  purchase.coachingStartedAt = start
  purchase.coachingEndsAt = end
  await purchase.save()
  return true
}

export async function applyAutoCoachingWindowForAllCompletedPurchases(customerId) {
  const purchases = await Purchase.find({ customer: customerId, status: 'completed' }).select('_id')
  let updated = 0
  for (const p of purchases) {
    if (await applyAutoCoachingWindowIfNeeded(p._id)) updated += 1
  }
  return { updated }
}
