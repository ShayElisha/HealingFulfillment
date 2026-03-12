import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryService, courseService, purchaseService, bookingService, contactService, reviewService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [stats, setStats] = useState({
    customers: { total: 0, active: 0, new: 0 },
    bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, upcoming: [] },
    purchases: { total: 0, pending: 0, completed: 0, revenue: 0 },
    reviews: { total: 0, pending: 0, approved: 0, averageRating: 0 },
    contacts: { total: 0, unread: 0 }
  })

  useEffect(() => {
    loadDashboardData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [dateRange])

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDatePicker])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [
        customersRes,
        bookingsRes,
        purchasesRes,
        reviewsRes,
        contactsRes
      ] = await Promise.all([
        customerService.getAll(),
        bookingService.getAll(),
        purchaseService.getAll(),
        reviewService.getAll(),
        contactService.getAll()
      ])

      let customers = customersRes?.data || []
      let bookings = bookingsRes?.data || []
      let purchases = purchasesRes?.data || []
      let reviewsData = reviewsRes?.data || []
      let contacts = contactsRes?.data || []
      
      // Filter by date range if selected
      if (dateRange.startDate || dateRange.endDate) {
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null
        
        if (startDate) {
          startDate.setHours(0, 0, 0, 0)
        }
        if (endDate) {
          endDate.setHours(23, 59, 59, 999)
        }

        // Filter bookings by preferredDate
        if (startDate || endDate) {
          bookings = bookings.filter(b => {
            const bookingDate = new Date(b.preferredDate)
            if (startDate && bookingDate < startDate) return false
            if (endDate && bookingDate > endDate) return false
            return true
          })
        }

        // Filter purchases by createdAt
        if (startDate || endDate) {
          purchases = purchases.filter(p => {
            const purchaseDate = new Date(p.createdAt)
            if (startDate && purchaseDate < startDate) return false
            if (endDate && purchaseDate > endDate) return false
            return true
          })
        }

        // Filter customers by createdAt
        if (startDate || endDate) {
          customers = customers.filter(c => {
            if (!c.createdAt) return false
            const customerDate = new Date(c.createdAt)
            if (startDate && customerDate < startDate) return false
            if (endDate && customerDate > endDate) return false
            return true
          })
        }

        // Filter contacts by createdAt
        if (startDate || endDate) {
          contacts = contacts.filter(c => {
            if (!c.createdAt) return false
            const contactDate = new Date(c.createdAt)
            if (startDate && contactDate < startDate) return false
            if (endDate && contactDate > endDate) return false
            return true
          })
        }

        // Filter reviews by createdAt
        if (startDate || endDate) {
          reviewsData = reviewsData.filter(r => {
            if (!r.createdAt) return false
            const reviewDate = new Date(r.createdAt)
            if (startDate && reviewDate < startDate) return false
            if (endDate && reviewDate > endDate) return false
            return true
          })
        }
      }
      
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])

      // Calculate upcoming bookings (next 7 days)
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      const upcomingBookings = bookings
        .filter(b => {
          const bookingDate = new Date(b.preferredDate)
          return bookingDate >= today && bookingDate <= nextWeek && 
                 (b.status === 'pending' || b.status === 'confirmed')
        })
        .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate))
        .slice(0, 5)

      // Calculate stats
      const completedPurchases = purchases.filter(p => p.status === 'completed')
      const revenue = completedPurchases.reduce((sum, p) => sum + (p.price || 0), 0)

      const approvedReviews = reviewsData.filter(r => r.status === 'approved')
      const averageRating = approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
        : 0

      // Calculate revenue growth (last 30 days vs previous 30 days)
      // Calculate revenue growth only if no date filter is applied
      let revenueGrowth = 0
      if (!dateRange.startDate && !dateRange.endDate) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        
        const recentRevenue = completedPurchases
          .filter(p => new Date(p.createdAt) >= thirtyDaysAgo)
          .reduce((sum, p) => sum + (p.price || 0), 0)
        
        const previousRevenue = completedPurchases
          .filter(p => {
            const date = new Date(p.createdAt)
            return date >= sixtyDaysAgo && date < thirtyDaysAgo
          })
          .reduce((sum, p) => sum + (p.price || 0), 0)
        
        revenueGrowth = previousRevenue > 0 
          ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
          : recentRevenue > 0 ? 100 : 0
      }

      setStats({
        customers: {
          total: customers.length,
          active: customers.filter(c => c.hasAccount === true).length,
          new: customers.filter(c => {
            if (!c.createdAt) return false
            const createdDate = new Date(c.createdAt)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return createdDate >= weekAgo
          }).length
        },
        bookings: {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          upcoming: upcomingBookings
        },
        purchases: {
          total: purchases.length,
          pending: purchases.filter(p => p.status === 'pending').length,
          completed: completedPurchases.length,
          revenue: revenue,
          revenueGrowth: parseFloat(revenueGrowth)
        },
        reviews: {
          total: reviewsData.length,
          pending: reviewsData.filter(r => r.status === 'pending').length,
          approved: approvedReviews.length,
          averageRating: Math.round(averageRating * 10) / 10
        },
        contacts: {
          total: contacts.length,
          unread: contacts.filter(c => !c.read || c.read === false).length
        }
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error(`שגיאה בטעינת נתוני הדאשבורד: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon, gradient, trend, trendValue, onClick }) => (
    <div 
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-white/20`}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <span className="text-2xl">{icon}</span>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trendValue >= 0 ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
            }`}>
              <span>{trendValue >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trendValue)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-white/80 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
      </div>
    </div>
  )

  const MiniChart = ({ data, color }) => {
    const max = Math.max(...data)
    return (
      <div className="flex items-end gap-1 h-12">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-white/30 rounded-t transition-all duration-300 hover:bg-white/40"
            style={{ height: `${(value / max) * 100}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <Navbar activeTab="dashboard" onTabChange={() => {}} purchasesCount={stats.purchases.pending} bookingsCount={stats.bookings.pending} customersCount={stats.customers.total} contactsCount={stats.contacts.unread} />
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">לוח בקרה</h1>
                <p className="text-primary-100 text-lg">סקירה כללית של המערכת</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Date Range Picker */}
                <div className="relative date-picker-container">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 border border-white/30"
                  >
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-medium">
                      {dateRange.startDate || dateRange.endDate 
                        ? `${dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString('he-IL') : 'תחילת טווח'} - ${dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString('he-IL') : 'סוף טווח'}`
                        : 'בחר טווח תאריכים'}
                    </span>
                    {(dateRange.startDate || dateRange.endDate) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDateRange({ startDate: null, endDate: null })
                          setShowDatePicker(false)
                        }}
                        className="text-white/80 hover:text-white ml-2"
                      >
                        ✕
                      </button>
                    )}
                  </button>
                  
                  {showDatePicker && (
                    <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl p-6 z-50 min-w-[320px] border border-neutral-200">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-neutral-900 mb-4">בחר טווח תאריכים</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              מתאריך
                            </label>
                            <input
                              type="date"
                              value={dateRange.startDate || ''}
                              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              עד תאריך
                            </label>
                            <input
                              type="date"
                              value={dateRange.endDate || ''}
                              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                              min={dateRange.startDate || ''}
                              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => {
                              setShowDatePicker(false)
                            }}
                            variant="primary"
                            className="flex-1"
                          >
                            החל
                          </Button>
                          <Button
                            onClick={() => {
                              setDateRange({ startDate: null, endDate: null })
                              setShowDatePicker(false)
                            }}
                            variant="soft"
                            className="flex-1"
                          >
                            אפס
                          </Button>
                        </div>
                        {/* Quick Date Presets */}
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <p className="text-xs font-medium text-neutral-600 mb-2">בחירות מהירות:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                const today = new Date()
                                const weekAgo = new Date()
                                weekAgo.setDate(today.getDate() - 7)
                                setDateRange({
                                  startDate: weekAgo.toISOString().split('T')[0],
                                  endDate: today.toISOString().split('T')[0]
                                })
                                setShowDatePicker(false)
                              }}
                              className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 transition-colors"
                            >
                              שבוע אחרון
                            </button>
                            <button
                              onClick={() => {
                                const today = new Date()
                                const monthAgo = new Date()
                                monthAgo.setDate(today.getDate() - 30)
                                setDateRange({
                                  startDate: monthAgo.toISOString().split('T')[0],
                                  endDate: today.toISOString().split('T')[0]
                                })
                                setShowDatePicker(false)
                              }}
                              className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 transition-colors"
                            >
                              30 יום אחרונים
                            </button>
                            <button
                              onClick={() => {
                                const today = new Date()
                                const threeMonthsAgo = new Date()
                                threeMonthsAgo.setMonth(today.getMonth() - 3)
                                setDateRange({
                                  startDate: threeMonthsAgo.toISOString().split('T')[0],
                                  endDate: today.toISOString().split('T')[0]
                                })
                                setShowDatePicker(false)
                              }}
                              className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 transition-colors"
                            >
                              3 חודשים אחרונים
                            </button>
                            <button
                              onClick={() => {
                                const today = new Date()
                                const yearAgo = new Date()
                                yearAgo.setFullYear(today.getFullYear() - 1)
                                setDateRange({
                                  startDate: yearAgo.toISOString().split('T')[0],
                                  endDate: today.toISOString().split('T')[0]
                                })
                                setShowDatePicker(false)
                              }}
                              className="text-xs px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 transition-colors"
                            >
                              שנה אחרונה
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-primary-200 mb-1">תאריך עדכון אחרון</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleDateString('he-IL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>
            
            {/* Date Range Indicator */}
            {(dateRange.startDate || dateRange.endDate) && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 text-primary-100">
                  <span className="text-sm">📊 נתונים מוצגים עבור:</span>
                  <span className="text-sm font-semibold">
                    {dateRange.startDate 
                      ? new Date(dateRange.startDate).toLocaleDateString('he-IL')
                      : 'כל התאריכים'}
                    {' - '}
                    {dateRange.endDate 
                      ? new Date(dateRange.endDate).toLocaleDateString('he-IL')
                      : 'כל התאריכים'}
                  </span>
                </div>
              </div>
            )}
          </div>
          </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                <p className="text-neutral-600 text-lg">טוען נתונים...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="לקוחות"
                  value={stats.customers.total}
                  subtitle={`${stats.customers.active} פעילים • ${stats.customers.new} חדשים השבוע`}
                  icon="👥"
                  gradient="from-blue-500 via-blue-600 to-blue-700"
                  onClick={() => navigate('/customers')}
                />
                <StatCard
                  title="פגישות"
                  value={stats.bookings.total}
                  subtitle={`${stats.bookings.pending} ממתינות • ${stats.bookings.confirmed} מאושרות`}
                  icon="📅"
                  gradient="from-green-500 via-green-600 to-green-700"
                  onClick={() => navigate('/bookings')}
                />
                <StatCard
                  title="הכנסות"
                  value={`₪${stats.purchases.revenue.toLocaleString()}`}
                  subtitle={`${stats.purchases.completed} רכישות הושלמו${dateRange.startDate || dateRange.endDate ? ' בטווח הנבחר' : ''}`}
                  icon="💰"
                  gradient="from-purple-500 via-purple-600 to-purple-700"
                  trend={!dateRange.startDate && !dateRange.endDate}
                  trendValue={stats.purchases.revenueGrowth}
                  onClick={() => navigate('/')}
                />
                <StatCard
                  title="ביקורות"
                  value={stats.reviews.total}
                  subtitle={`${stats.reviews.pending} ממתינות • ⭐ ${stats.reviews.averageRating || 0}`}
                  icon="⭐"
                  gradient="from-yellow-500 via-yellow-600 to-yellow-700"
                  onClick={() => navigate('/reviews')}
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">פניות יצירת קשר</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats.contacts.total}</p>
                      <p className="text-xs text-red-600 mt-1">{stats.contacts.unread} לא נקראו</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-full">
                      <span className="text-3xl">📧</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/contacts')}
                    variant="soft"
                    className="w-full mt-4"
                  >
                    צפה בפניות
                  </Button>
                </Card>

                <Card className="bg-white border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">סטטוס פגישות</p>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">ממתינות</span>
                          <span className="font-bold text-yellow-600">{stats.bookings.pending}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">מאושרות</span>
                          <span className="font-bold text-green-600">{stats.bookings.confirmed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">הושלמו</span>
                          <span className="font-bold text-blue-600">{stats.bookings.completed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-full">
                      <span className="text-3xl">📊</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">סטטוס רכישות</p>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">ממתינות</span>
                          <span className="font-bold text-yellow-600">{stats.purchases.pending}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">הושלמו</span>
                          <span className="font-bold text-green-600">{stats.purchases.completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">סה"כ הכנסות</span>
                          <span className="font-bold text-primary-600">₪{stats.purchases.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-full">
                      <span className="text-3xl">💳</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Upcoming Bookings */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">פגישות קרובות</h2>
                      <p className="text-sm text-neutral-600 mt-1">7 הימים הבאים</p>
                    </div>
                    <Button
                      onClick={() => navigate('/bookings')}
                      variant="soft"
                      className="text-sm"
                    >
                      צפה בכל →
                    </Button>
                  </div>
                  {stats.bookings.upcoming.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">📅</div>
                      <p className="text-neutral-500">אין פגישות קרובות</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.bookings.upcoming.map((booking, index) => (
                        <div
                          key={booking._id}
                          className="p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl hover:from-primary-50 hover:to-primary-50 cursor-pointer transition-all duration-300 border border-neutral-200 hover:border-primary-300 hover:shadow-md transform hover:-translate-y-0.5"
                          onClick={() => navigate('/bookings')}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-neutral-900">{booking.name}</p>
                                {booking.isIntroMeeting && (
                                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                                    ⭐ היכרות
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-600 mb-1">
                                📍 {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {booking.preferredTime && ` • 🕐 ${booking.preferredTime}`}
                              </p>
                              {booking.meetingType === 'zoom' && booking.zoomLink && (
                                <p className="text-xs text-blue-600 mt-1">🔗 זום</p>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.status === 'confirmed' ? '✓ מאושר' : '⏳ ממתין'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Pending Reviews */}
                <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">ביקורות ממתינות</h2>
                      <p className="text-sm text-neutral-600 mt-1">{stats.reviews.pending} ממתינות לאישור</p>
                    </div>
                    <Button
                      onClick={() => navigate('/reviews')}
                      variant="soft"
                      className="text-sm"
                    >
                      צפה בכל →
                    </Button>
                  </div>
                  {stats.reviews.pending === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">⭐</div>
                      <p className="text-neutral-500">אין ביקורות ממתינות</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.filter(r => r.status === 'pending').slice(0, 3).map((review) => (
                        <div
                          key={review._id}
                          className="p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl hover:from-yellow-50 hover:to-yellow-50 cursor-pointer transition-all duration-300 border border-neutral-200 hover:border-yellow-300 hover:shadow-md transform hover:-translate-y-0.5"
                          onClick={() => navigate('/reviews')}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-neutral-900 mb-2">
                                {review.customerName || review.customer?.name || 'לקוח'}
                              </p>
                              <div className="flex text-yellow-500 text-lg mb-2">
                                {'⭐'.repeat(review.rating)}
                                {'☆'.repeat(5 - review.rating)}
                              </div>
                              <p className="text-sm text-neutral-600 line-clamp-2 italic">
                                "{review.content}"
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold whitespace-nowrap">
                              ממתין
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200 shadow-lg">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">פעולות מהירות</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => navigate('/admin?tab=categories')}
                    variant="primary"
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <span className="text-2xl">💆</span>
                    <span>ניהול טיפולים</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/admin?tab=courses')}
                    variant="primary"
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <span className="text-2xl">📚</span>
                    <span>ניהול מסלולים</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/admin?tab=new-booking')}
                    variant="primary"
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <span className="text-2xl">➕</span>
                    <span>צור פגישה</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/messages')}
                    variant="primary"
                    className="flex flex-col items-center gap-2 py-4"
                  >
                    <span className="text-2xl">💬</span>
                    <span>שלח הודעה</span>
                  </Button>
                  </div>
                </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default DashboardPage
