const dateShortHe = { year: 'numeric', month: 'short', day: 'numeric' }
const dateLongHe = { year: 'numeric', month: 'long', day: 'numeric' }

/** כמו בשרת (admin): הוספת חודשים לתאריך */
function addCalendarMonths(date, months) {
  const m = Math.min(120, Math.max(1, parseInt(months, 10) || 1))
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setMonth(d.getMonth() + m)
  if (d.getDate() < day) d.setDate(0)
  return d
}

export function getCoachingWindow(purchase, customer) {
  const c = purchase?.course
  const exStart = purchase?.coachingStartedAt || c?.coachingProcessStartAt
  const exEnd = purchase?.coachingEndsAt || c?.coachingProcessEndAt
  if (exStart && exEnd) {
    return { start: new Date(exStart), end: new Date(exEnd), derived: false }
  }

  const months = c?.coachingProcessMonths
  if (purchase?.status !== 'completed' || months == null || Number(months) < 1) {
    return null
  }

  const anchorRaw = customer?.caseOpenedAt || purchase?.paidAt || purchase?.createdAt
  if (!anchorRaw) return null

  const start = new Date(anchorRaw)
  const end = addCalendarMonths(start, Number(months))
  return { start, end, derived: true }
}

export function isCoachingCurrentlyActive(purchase, customer) {
  if (purchase?.status !== 'completed') return false
  const w = getCoachingWindow(purchase, customer)
  if (!w) return false
  const now = Date.now()
  return now >= w.start.getTime() && now <= w.end.getTime()
}

export function getCoachingPeriodForPurchaseDisplay(purchase, customerData) {
  const sub = customerData?.activeSubscription
  if (sub && purchase?._id && sub.purchase && String(sub.purchase) === String(purchase._id)) {
    return {
      source: 'subscription',
      start: new Date(sub.startedAt),
      end: new Date(sub.endsAt),
      derived: false,
      expired: false,
    }
  }

  const disp = customerData?.subscriptionDisplay
  const expiredSub = disp?.state === 'expired' ? disp?.subscription : null
  if (
    expiredSub &&
    purchase?._id &&
    expiredSub.purchase &&
    String(expiredSub.purchase) === String(purchase._id)
  ) {
    return {
      source: 'subscription',
      start: new Date(expiredSub.startedAt),
      end: new Date(expiredSub.endsAt),
      derived: false,
      expired: true,
    }
  }

  const w = getCoachingWindow(purchase, customerData)
  if (!w) return null
  return { source: 'derived', start: w.start, end: w.end, derived: w.derived, expired: false }
}

export function purchaseDisplayDate(purchase) {
  if (purchase?.paidAt && purchase?.status === 'completed') {
    return new Date(purchase.paidAt)
  }
  return purchase?.createdAt ? new Date(purchase.createdAt) : null
}

export function resolveCustomerUploadUrl(urlPath) {
  if (!urlPath) return ''
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath
  if (import.meta.env.DEV) return urlPath
  const adminBase = import.meta.env.VITE_ADMIN_ASSET_URL?.replace(/\/$/, '')
  if (adminBase) return `${adminBase}${urlPath}`
  const apiBase = import.meta.env.VITE_API_URL
  if (apiBase) return apiBase.replace(/\/api\/?$/, '') + urlPath
  return urlPath
}

export function toDateInputYmd(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getBookingDateTime(booking) {
  const dt = new Date(booking.preferredDate)
  if (booking.preferredTime && /^\d{1,2}:\d{2}$/.test(String(booking.preferredTime).trim())) {
    const [h, m] = String(booking.preferredTime).trim().split(':').map(Number)
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)
  } else {
    dt.setHours(23, 59, 59, 999)
  }
  return dt
}

export { dateShortHe, dateLongHe }
