import express from 'express'
import Customer from '../models/Customer.js'
import Booking from '../models/Booking.js'
import '../models/Course.js' // רישום מודל — נדרש ל-Purchase.populate('course') ב-activity-feed
import Purchase from '../models/Purchase.js'
import Review from '../models/Review.js'
import Contact from '../models/Contact.js'
import Transaction from '../models/Transaction.js'
import Lead from '../models/Lead.js'
import TriggerJournalEntry from '../models/TriggerJournalEntry.js'
import AdminNotificationRead from '../models/AdminNotificationRead.js'

const router = express.Router()

function logStatsError(route, err) {
  console.error(`[STATS:${route}]`, err?.name || 'Error', err?.message || String(err))
  if (process.env.NODE_ENV === 'development' && err?.stack) console.error(err.stack)
}

/** Promise.all עם לוג לכל שאילתה שנכשלה — ואז זריקת השגיאה הראשונה */
async function allStatsQueries(routeLabel, queryLabels, promises) {
  const settled = await Promise.allSettled(promises)
  settled.forEach((r, i) => {
    if (r.status === 'rejected') {
      const reason = r.reason
      console.error(
        `[STATS:${routeLabel}] נכשל שלב "${queryLabels[i]}":`,
        reason?.name,
        reason?.message || reason
      )
    }
  })
  const failed = settled.find((r) => r.status === 'rejected')
  if (failed) throw failed.reason
  return settled.map((r) => r.value)
}

const ACTIVITY_KINDS = new Set([
  'booking',
  'contact',
  'lead',
  'review',
  'purchase',
  'customer',
  'trigger_journal',
])

function rangeFromQuery(qs) {
  const { startDate, endDate } = qs
  const r = {}
  if (startDate) {
    const s = new Date(String(startDate))
    if (!Number.isNaN(s.getTime())) {
      s.setHours(0, 0, 0, 0)
      r.$gte = s
    }
  }
  if (endDate) {
    const e = new Date(String(endDate))
    if (!Number.isNaN(e.getTime())) {
      e.setHours(23, 59, 59, 999)
      r.$lte = e
    }
  }
  if (!Object.keys(r).length) return null
  return r
}

function transactionDateMatchFromQuery(qs) {
  const { startDate, endDate } = qs
  const r = {}
  if (startDate) {
    const s = new Date(String(startDate))
    if (!Number.isNaN(s.getTime())) r.$gte = s
  }
  if (endDate) {
    const e = new Date(String(endDate))
    if (!Number.isNaN(e.getTime())) {
      e.setHours(23, 59, 59, 999)
      r.$lte = e
    }
  }
  if (!Object.keys(r).length) return {}
  return { date: r }
}

/** GET /api/admin/stats/activity-feed — פעילות אחרונה לפעמון התראות */
router.get('/stats/activity-feed', async (req, res, next) => {
  try {
    const limit = Math.min(150, Math.max(20, parseInt(req.query.limit, 10) || 100))
    const perSource = Math.ceil(limit / 7) + 5

    const custFilter = { isAdmin: { $ne: true } }

    const [bookings, contacts, leads, reviews, purchases, customers, journals] = await allStatsQueries(
      'activity-feed',
      [
        'Booking.find',
        'Contact.find',
        'Lead.find',
        'Review.find',
        'Purchase.find+populate(course)',
        'Customer.find',
        'TriggerJournalEntry.find+populate(customer)',
      ],
      [
        Booking.find({})
          .sort({ createdAt: -1 })
          .limit(perSource)
          .select('name email phone preferredDate preferredTime status meetingType isIntroMeeting createdAt')
          .lean(),
        Contact.find({})
          .sort({ createdAt: -1 })
          .limit(perSource)
          .select('name email phone message isRead createdAt')
          .lean(),
        Lead.find({})
          .sort({ createdAt: -1 })
          .limit(perSource)
          .select('name phone email status createdAt')
          .lean(),
        Review.find({})
          .sort({ createdAt: -1 })
          .limit(perSource)
          .select('customerName rating content status createdAt')
          .lean(),
        Purchase.find({})
          .sort({ createdAt: -1 })
          .limit(perSource)
          .populate('course', 'title')
          .lean(),
        Customer.find(custFilter)
          .sort({ createdAt: -1 })
          .limit(perSource)
          .select('name email phone hasAccount createdAt')
          .lean(),
        TriggerJournalEntry.find({})
          .sort({ createdAt: -1 })
          .limit(perSource)
          .populate('customer', 'name')
          .select('customer entryDate partOfDay triggerDescription createdAt')
          .lean(),
      ]
    )

    const items = []

    for (const b of bookings) {
      const t = b.createdAt ? new Date(b.createdAt).getTime() : 0
      const intro = b.isIntroMeeting ? 'פגישת היכרות' : 'פגישה'
      items.push({
        id: String(b._id),
        kind: 'booking',
        title: `${intro}: ${b.name || 'ללא שם'}`,
        subtitle: [b.status, b.preferredDate ? new Date(b.preferredDate).toLocaleDateString('he-IL') : null]
          .filter(Boolean)
          .join(' · '),
        createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date(0).toISOString(),
        href: '/bookings',
        sortTime: t,
      })
    }

    for (const c of contacts) {
      const t = c.createdAt ? new Date(c.createdAt).getTime() : 0
      items.push({
        id: String(c._id),
        kind: 'contact',
        title: `פנייה: ${c.name || ''}`,
        subtitle: [c.email, c.isRead === false ? 'לא נקראה' : null].filter(Boolean).join(' · '),
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date(0).toISOString(),
        href: '/contacts',
        sortTime: t,
      })
    }

    for (const l of leads) {
      const t = l.createdAt ? new Date(l.createdAt).getTime() : 0
      items.push({
        id: String(l._id),
        kind: 'lead',
        title: `ליד: ${l.name || ''}`,
        subtitle: l.status === 'new' ? 'חדש' : (l.status || ''),
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date(0).toISOString(),
        href: '/leads',
        sortTime: t,
      })
    }

    for (const r of reviews) {
      const t = r.createdAt ? new Date(r.createdAt).getTime() : 0
      items.push({
        id: String(r._id),
        kind: 'review',
        title: `ביקורת: ${r.customerName || 'לקוח'}`,
        subtitle: r.status === 'pending' ? 'ממתינה לאישור' : (r.status || ''),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date(0).toISOString(),
        href: '/reviews',
        sortTime: t,
      })
    }

    for (const p of purchases) {
      const t = p.createdAt ? new Date(p.createdAt).getTime() : 0
      const courseTitle = p.course?.title || 'מסלול'
      items.push({
        id: String(p._id),
        kind: 'purchase',
        title: `רכישה: ${courseTitle}`,
        subtitle: p.status === 'completed' ? 'הושלמה' : (p.status || ''),
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date(0).toISOString(),
        href: '/purchase',
        sortTime: t,
      })
    }

    for (const cu of customers) {
      const t = cu.createdAt ? new Date(cu.createdAt).getTime() : 0
      items.push({
        id: String(cu._id),
        kind: 'customer',
        title: `לקוח חדש: ${cu.name || ''}`,
        subtitle: cu.hasAccount ? 'עם חשבון' : 'ללא חשבון',
        createdAt: cu.createdAt ? new Date(cu.createdAt).toISOString() : new Date(0).toISOString(),
        href: `/customer/${cu._id}`,
        sortTime: t,
      })
    }

    for (const j of journals) {
      const t = j.createdAt ? new Date(j.createdAt).getTime() : 0
      const custName = j.customer?.name || 'לקוח'
      items.push({
        id: String(j._id),
        kind: 'trigger_journal',
        title: `תיעוד תריגר: ${custName}`,
        subtitle: (j.triggerDescription || '').slice(0, 120) + ((j.triggerDescription || '').length > 120 ? '…' : ''),
        createdAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date(0).toISOString(),
        href: j.customer?._id ? `/customer/${j.customer._id}` : '/customers',
        sortTime: t,
      })
    }

    items.sort((a, b) => b.sortTime - a.sortTime)
    const trimmed = items.slice(0, limit).map(({ sortTime, ...rest }) => rest)

    const adminId = req.customerId
    let itemsOut = trimmed
    if (adminId && trimmed.length > 0) {
      const readDocs = await AdminNotificationRead.find({
        adminUser: adminId,
        $or: trimmed.map((i) => ({ activityKind: i.kind, activityId: i.id })),
      })
        .select('activityKind activityId')
        .lean()
      const readSet = new Set(readDocs.map((r) => `${r.activityKind}:${r.activityId}`))
      itemsOut = trimmed.map((i) => ({
        ...i,
        isRead: readSet.has(`${i.kind}:${i.id}`),
      }))
    } else {
      itemsOut = trimmed.map((i) => ({ ...i, isRead: false }))
    }

    res.json({
      data: {
        items: itemsOut,
      },
    })
  } catch (e) {
    logStatsError('activity-feed', e)
    next(e)
  }
})

/** POST /api/admin/stats/notifications/mark-read — סימון התראת פעילות כנקראה (למנהל מחובר) */
router.post('/stats/notifications/mark-read', async (req, res, next) => {
  try {
    const adminId = req.customerId
    if (!adminId) {
      return res.status(401).json({ message: 'לא מאומת' })
    }
    const { kind, activityId } = req.body || {}
    const k = kind != null ? String(kind).trim() : ''
    const aid = activityId != null ? String(activityId).trim() : ''
    if (!k || !aid || !ACTIVITY_KINDS.has(k)) {
      return res.status(400).json({ message: 'חסר או לא תקין kind / activityId' })
    }
    await AdminNotificationRead.findOneAndUpdate(
      { adminUser: adminId, activityKind: k, activityId: aid },
      { $set: { readAt: new Date() } },
      { upsert: true, new: true }
    )
    res.json({ message: 'נשמר', data: { kind: k, activityId: aid, isRead: true } })
  } catch (e) {
    next(e)
  }
})

/** POST /api/admin/stats/notifications/mark-all-read — סימון מרובה (למנהל מחובר) */
router.post('/stats/notifications/mark-all-read', async (req, res, next) => {
  try {
    const adminId = req.customerId
    if (!adminId) {
      return res.status(401).json({ message: 'לא מאומת' })
    }
    const raw = req.body?.items
    if (!Array.isArray(raw) || raw.length === 0) {
      return res.status(400).json({ message: 'חסר מערך items' })
    }
    const maxItems = 200
    const seen = new Set()
    const pairs = []
    for (const x of raw.slice(0, maxItems)) {
      const k = x?.kind != null ? String(x.kind).trim() : ''
      const aid = x?.activityId != null ? String(x.activityId).trim() : ''
      if (!k || !aid || !ACTIVITY_KINDS.has(k)) continue
      const key = `${k}:${aid}`
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push({ k, aid })
    }
    if (!pairs.length) {
      return res.status(400).json({ message: 'אין פריטים תקינים' })
    }
    const now = new Date()
    await AdminNotificationRead.bulkWrite(
      pairs.map(({ k, aid }) => ({
        updateOne: {
          filter: { adminUser: adminId, activityKind: k, activityId: aid },
          update: { $set: { readAt: now } },
          upsert: true,
        },
      }))
    )
    res.json({ message: 'נשמר', data: { count: pairs.length } })
  } catch (e) {
    next(e)
  }
})

/** GET /api/admin/stats/nav-counts */
router.get('/stats/nav-counts', async (req, res, next) => {
  try {
    const custF = { isAdmin: { $ne: true } }
    const [customersCount, bookingsCount, contactsCount] = await allStatsQueries(
      'nav-counts',
      ['Customer.countDocuments', 'Booking.countDocuments', 'Contact.countDocuments'],
      [Customer.countDocuments(custF), Booking.countDocuments({}), Contact.countDocuments({})]
    )
    res.json({
      data: { customersCount, bookingsCount, contactsCount },
    })
  } catch (e) {
    logStatsError('nav-counts', e)
    next(e)
  }
})

/** GET /api/admin/stats/dashboard?startDate=&endDate= */
router.get('/stats/dashboard', async (req, res, next) => {
  try {
    const hasDateFilter = Boolean(req.query.startDate || req.query.endDate)
    const bookingDateRange = rangeFromQuery(req.query)
    const createdRange = rangeFromQuery(req.query)

    const custFilter = { isAdmin: { $ne: true } }
    if (createdRange) custFilter.createdAt = createdRange

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const newLast7Filter = { isAdmin: { $ne: true }, createdAt: { $gte: sevenDaysAgo } }
    if (createdRange?.$gte) {
      const g = new Date(createdRange.$gte)
      newLast7Filter.createdAt.$gte = new Date(
        Math.max(newLast7Filter.createdAt.$gte.getTime(), g.getTime())
      )
    }
    if (createdRange?.$lte) newLast7Filter.createdAt.$lte = createdRange.$lte

    const txnBaseMatch = transactionDateMatchFromQuery(req.query)

    const purchaseFilter = {}
    if (createdRange) purchaseFilter.createdAt = createdRange

    const contactFilter = {}
    if (createdRange) contactFilter.createdAt = createdRange

    const reviewFilter = {}
    if (createdRange) reviewFilter.createdAt = createdRange

    const bookingFilter = {}
    if (bookingDateRange) bookingFilter.preferredDate = bookingDateRange

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    weekEnd.setHours(23, 59, 59, 999)

    let upcomingLow = todayStart
    let upcomingHigh = weekEnd
    if (bookingDateRange) {
      if (bookingDateRange.$gte) {
        const g = new Date(bookingDateRange.$gte)
        upcomingLow = new Date(Math.max(upcomingLow.getTime(), g.getTime()))
      }
      if (bookingDateRange.$lte) {
        const e = new Date(bookingDateRange.$lte)
        upcomingHigh = new Date(Math.min(upcomingHigh.getTime(), e.getTime()))
      }
    }

    const upcomingQuery =
      upcomingLow <= upcomingHigh
        ? {
            status: { $in: ['pending', 'confirmed'] },
            preferredDate: { $gte: upcomingLow, $lte: upcomingHigh },
          }
        : null

    const [
      totalCustomers,
      activeCustomers,
      newLast7Days,
      bookingStatusCounts,
      purchaseByStatus,
      purchaseRevenueRow,
      reviewStatusCounts,
      totalContacts,
      unreadContacts,
      upcomingBookings,
      pendingReviews,
      incomeAgg,
      expenseAgg,
    ] = await allStatsQueries(
      'dashboard',
      [
        'Customer.countDocuments(custFilter)',
        'Customer.countDocuments(active)',
        'Customer.countDocuments(newLast7)',
        'Booking.aggregate(status)',
        'Purchase.aggregate(byStatus)',
        'Purchase.aggregate(revenue)',
        'Review.aggregate(status)',
        'Contact.countDocuments',
        'Contact.countDocuments(unread)',
        'Booking.find(upcoming)',
        'Review.find(pending)',
        'Transaction.aggregate(income)',
        'Transaction.aggregate(expense)',
      ],
      [
        Customer.countDocuments(custFilter),
        Customer.countDocuments({ ...custFilter, hasAccount: true }),
        Customer.countDocuments(newLast7Filter),
        Booking.aggregate([
          { $match: bookingFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Purchase.aggregate([
          { $match: purchaseFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Purchase.aggregate([
          { $match: { ...purchaseFilter, status: 'completed' } },
          { $group: { _id: null, s: { $sum: '$price' } } },
        ]),
        Review.aggregate([
          { $match: reviewFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Contact.countDocuments(contactFilter),
        Contact.countDocuments({ ...contactFilter, isRead: false }),
        upcomingQuery
          ? Booking.find(upcomingQuery)
              .sort({ preferredDate: 1, preferredTime: 1 })
              .limit(5)
              .select(
                'name preferredDate preferredTime status meetingType zoomLink isIntroMeeting'
              )
              .lean()
          : Promise.resolve([]),
        Review.find({ ...reviewFilter, status: 'pending' })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('customerName rating content status createdAt')
          .lean(),
        Transaction.aggregate([
          { $match: { ...txnBaseMatch, type: 'income' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { ...txnBaseMatch, type: 'expense' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]
    )

    const bMap = Object.fromEntries(bookingStatusCounts.map((x) => [x._id, x.count]))
    const bookingsTotal = Object.values(bMap).reduce((a, b) => a + b, 0)

    const pMap = Object.fromEntries(purchaseByStatus.map((x) => [x._id, x.count]))
    const purchasesTotal = Object.values(pMap).reduce((a, b) => a + b, 0)
    const completedN = pMap.completed || 0
    const revenue = purchaseRevenueRow[0]?.s || 0

    const rMap = Object.fromEntries(reviewStatusCounts.map((x) => [x._id, x.count]))
    const reviewsTotal = Object.values(rMap).reduce((a, b) => a + b, 0)
    const approvedN = rMap.approved || 0
    const pendingN = rMap.pending || 0

    let averageRating = 0
    if (approvedN > 0) {
      const agg = await Review.aggregate([
        { $match: { ...reviewFilter, status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ])
      averageRating = Math.round((agg[0]?.avg || 0) * 10) / 10
    }

    let revenueGrowth = 0
    if (!hasDateFilter) {
      const now = new Date()
      const t30 = new Date(now)
      t30.setDate(t30.getDate() - 30)
      const t60 = new Date(now)
      t60.setDate(t60.getDate() - 60)
      const [recentAgg, prevAgg] = await Promise.all([
        Purchase.aggregate([
          { $match: { status: 'completed', createdAt: { $gte: t30 } } },
          { $group: { _id: null, s: { $sum: '$price' } } },
        ]),
        Purchase.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: t60, $lt: t30 },
            },
          },
          { $group: { _id: null, s: { $sum: '$price' } } },
        ]),
      ])
      const recentRev = recentAgg[0]?.s || 0
      const prevRev = prevAgg[0]?.s || 0
      revenueGrowth =
        prevRev > 0
          ? parseFloat((((recentRev - prevRev) / prevRev) * 100).toFixed(1))
          : recentRev > 0
            ? 100
            : 0
    }

    const income = incomeAgg[0]?.total || 0
    const expense = expenseAgg[0]?.total || 0

    res.json({
      data: {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          new: newLast7Days,
        },
        bookings: {
          total: bookingsTotal,
          pending: bMap.pending || 0,
          confirmed: bMap.confirmed || 0,
          completed: bMap.completed || 0,
          upcoming: upcomingBookings,
        },
        purchases: {
          total: purchasesTotal,
          pending: pMap.pending || 0,
          completed: completedN,
          revenue,
          revenueGrowth,
        },
        reviews: {
          total: reviewsTotal,
          pending: pendingN,
          approved: approvedN,
          averageRating,
        },
        contacts: {
          total: totalContacts,
          unread: unreadContacts,
        },
        transactions: {
          totalIncome: income,
          totalExpense: expense,
          balance: income - expense,
        },
        pendingReviewsPreview: pendingReviews,
      },
    })
  } catch (e) {
    logStatsError('dashboard', e)
    next(e)
  }
})

export default router
