import express from 'express'
import Customer from '../models/Customer.js'
import Booking from '../models/Booking.js'
import Purchase from '../models/Purchase.js'
import Review from '../models/Review.js'
import Contact from '../models/Contact.js'
import Transaction from '../models/Transaction.js'

const router = express.Router()

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

/** GET /api/admin/stats/nav-counts */
router.get('/stats/nav-counts', async (req, res, next) => {
  try {
    const custF = { isAdmin: { $ne: true } }
    const [customersCount, bookingsCount, contactsCount] = await Promise.all([
      Customer.countDocuments(custF),
      Booking.countDocuments({}),
      Contact.countDocuments({}),
    ])
    res.json({
      data: { customersCount, bookingsCount, contactsCount },
    })
  } catch (e) {
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
    ] = await Promise.all([
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
            .sort({ preferredDate: 1 })
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
    ])

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
    next(e)
  }
})

export default router
