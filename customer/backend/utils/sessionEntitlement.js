import Subscription from '../models/Subscription.js'
import Booking from '../models/Booking.js'
import Purchase from '../models/Purchase.js'

/**
 * מנוי פעיל (לפי endsAt) — אם יש כמה, לוקחים את הארוך ביותר.
 */
export async function getActiveSubscriptionForCustomer(customerId) {
  if (!customerId) return null
  return Subscription.findOne({
    customer: customerId,
    status: 'active',
    endsAt: { $gt: new Date() },
  })
    .sort({ endsAt: -1 })
    .select('planSnapshot startedAt endsAt purchase course status')
    .lean()
}

/**
 * פגישות רגילות שנספרות מול המכסה (לא היכרות, לא בוטלו).
 * אם מועבר חלון — רק פגישות שתאריך המפגש המועדף נופל בטווח (תקופת מנוי).
 */
export async function countUsedRegularBookings(customerId, window = null) {
  const q = {
    customer: customerId,
    isIntroMeeting: false,
    status: { $in: ['pending', 'confirmed', 'completed'] },
  }
  if (window?.start && window?.end) {
    const endInclusive = new Date(window.end)
    endInclusive.setHours(23, 59, 59, 999)
    q.preferredDate = { $gte: window.start, $lte: endInclusive }
  }
  return Booking.countDocuments(q)
}

async function computePurchasesOnlyEntitlement(customerId) {
  const purchases = await Purchase.find({ customer: customerId, status: 'completed' })
    .populate('course', 'sessionsCount')
    .lean()
  const totalSessionsPurchased = purchases.reduce(
    (sum, p) => sum + (p.course?.sessionsCount != null ? Number(p.course.sessionsCount) : 0),
    0
  )
  const usedBookings = await countUsedRegularBookings(customerId)
  return {
    totalSessionsPurchased,
    usedBookings,
    availableSessions: Math.max(0, totalSessionsPurchased - usedBookings),
    bookingUnlimitedBySubscription: false,
    activeSubscription: null,
    entitlementSource: 'purchases',
  }
}

/**
 * זכאות למפגשים: אם יש מנוי בתוקף — קביעה לפי תוקף המנוי בלבד (ללא מכסת מספר פגישות).
 * אחרת — סכימת רכישות שהושלמו מול פגישות שנקבעו.
 */
export async function computeSessionEntitlementForCustomerId(customerId) {
  const sub = await getActiveSubscriptionForCustomer(customerId)
  if (sub) {
    const usedBookings = await countUsedRegularBookings(customerId, {
      start: sub.startedAt,
      end: sub.endsAt,
    })
    return {
      totalSessionsPurchased: null,
      usedBookings,
      availableSessions: 1,
      bookingUnlimitedBySubscription: true,
      activeSubscription: sub,
      entitlementSource: 'subscription',
    }
  }
  return computePurchasesOnlyEntitlement(customerId)
}

function startOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfLocalDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** בדיקה: תאריך מועד לפגישה בתוך תקופת המנוי (יום מלא בתחילה ובסוף) */
export function preferredDateWithinSubscription(preferredDate, sub) {
  if (!sub || !preferredDate) return true
  const pd = startOfLocalDay(preferredDate)
  const start = startOfLocalDay(sub.startedAt)
  const end = endOfLocalDay(sub.endsAt)
  return pd >= start && pd <= end
}
