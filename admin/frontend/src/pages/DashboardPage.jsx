import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { purchaseService, statsService } from '../services/adminApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
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
    contacts: { total: 0, unread: 0 },
    transactions: { totalIncome: 0, totalExpense: 0, balance: 0 }
  })

  const loadDashboardData = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true)
        const params = {}
        if (dateRange.startDate) params.startDate = dateRange.startDate
        if (dateRange.endDate) params.endDate = dateRange.endDate
        const res = await statsService.getDashboard(params)
        const d = res?.data
        if (!d) throw new Error('אין נתונים מהשרת')
        setStats({
          customers: d.customers,
          bookings: d.bookings,
          purchases: d.purchases,
          reviews: d.reviews,
          contacts: d.contacts,
          transactions: d.transactions,
        })
        setReviews(Array.isArray(d.pendingReviewsPreview) ? d.pendingReviewsPreview : [])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        console.error('Error details:', error.response?.data || error.message)
        if (!silent) {
          toast.error(`שגיאה בטעינת נתוני הדאשבורד: ${error.response?.data?.message || error.message}`)
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [dateRange.startDate, dateRange.endDate]
  )

  useEffect(() => {
    loadDashboardData({ silent: false })
    const interval = setInterval(() => loadDashboardData({ silent: true }), 30000)
    const handleFocus = () => loadDashboardData({ silent: true })
    window.addEventListener('focus', handleFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadDashboardData])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const lowProfileCode = searchParams.get('lowprofilecode') || searchParams.get('LowProfileCode')
    const orderId = searchParams.get('orderId')
    const cardcomFlag = searchParams.get('cardcom')
    if (!orderId || !cardcomFlag) return

    let cancelled = false
    ;(async () => {
      try {
        if (cardcomFlag === 'success') {
          if (!lowProfileCode) {
            toast.error('הרכישה לא אושרה: חסר קוד אימות מהסולק')
          } else {
            await purchaseService.confirmFromRedirect({ orderId, lowProfileCode })
            if (!cancelled) {
              toast.success('הרכישה הושלמה בהצלחה! לקוח נוצר ונקלט במערכת')
              await loadDashboardData({ silent: true })
            }
          }
        } else {
          toast.error('הרכישה לא הושלמה')
        }
      } catch (error) {
        if (!cancelled) {
          const msg = error?.response?.data?.message || 'לא ניתן לאמת את העסקה מול Cardcom'
          toast.error(msg)
        }
      } finally {
        if (!cancelled) {
          const sp = new URLSearchParams(location.search)
          sp.delete('orderId')
          sp.delete('cardcom')
          sp.delete('lowprofilecode')
          sp.delete('LowProfileCode')
          navigate({ pathname: location.pathname, search: sp.toString() ? `?${sp}` : '' }, { replace: true })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search, navigate, loadDashboardData])

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

  const StatCard = ({ title, value, subtitle, icon, gradient, trend, trendValue, onClick }) => (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className="admin-stat-pill group relative cursor-pointer overflow-hidden text-right transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
      onClick={onClick}
    >
      <div className={`pointer-events-none absolute top-0 right-0 h-36 w-36 ${gradient} rounded-full opacity-[0.12] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.2] -mt-12 -mr-12`} />
      <div className="relative z-10">
        <div className="mb-4 flex flex-row-reverse items-start justify-between gap-3">
          <div className={`rounded-xl p-3 ${gradient} shadow-soft-md transition-transform duration-200 group-hover:scale-105`}>
            <span className="text-2xl" aria-hidden>
              {icon}
            </span>
          </div>
          {trend ? (
            <div
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                trendValue >= 0 ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <span>{trendValue >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trendValue)}%</span>
            </div>
          ) : null}
        </div>
        <h3 className="mb-1 text-sm font-medium text-neutral-600">{title}</h3>
        <p className="mb-1 font-serif text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
        {subtitle ? <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{subtitle}</p> : null}
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
      <Navbar />
      <main className="admin-page-main min-h-screen">
        <div className="admin-page-noise" aria-hidden="true" />
        <div className="relative z-[1]">
        {/* z-20 מול admin-inner (z-0) — כדי שחלונית טווח תאריכים (overflow) לא תיעלם מתחת לכרטיסים */}
        <div className="admin-dashboard-hero relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-3">
                <h1 className="admin-page-title">לוח בקרה</h1>
                <p className="admin-page-subtitle max-w-xl">סקירה כללית של המערכת — לקוחות, פגישות, הכנסות וביקורות במקום אחד.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {/* Date Range Picker */}
                <div className="relative date-picker-container isolate">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white/90 px-4 py-2.5 text-neutral-700 shadow-soft backdrop-blur-sm transition-all duration-200 hover:border-primary-200 hover:bg-white hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
                  >
                    <span className="text-base">📅</span>
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
                        className="rounded-lg p-0.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                      >
                        ✕
                      </button>
                    )}
                  </button>
                  
                  {showDatePicker && (
                    <div className="absolute end-0 top-full z-[110] mt-2 min-w-[320px] rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-premium">
                      <div className="mb-4">
                        <h3 className="mb-4 font-serif text-lg font-semibold text-neutral-900">בחר טווח תאריכים</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="admin-label">
                              מתאריך
                            </label>
                            <input
                              type="date"
                              value={dateRange.startDate || ''}
                              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                              className="admin-input"
                            />
                          </div>
                          <div>
                            <label className="admin-label">
                              עד תאריך
                            </label>
                            <input
                              type="date"
                              value={dateRange.endDate || ''}
                              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                              min={dateRange.startDate || ''}
                              className="admin-input"
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
                              type="button"
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
                              className="admin-chip text-xs"
                            >
                              שבוע אחרון
                            </button>
                            <button
                              type="button"
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
                              className="admin-chip text-xs"
                            >
                              30 יום אחרונים
                            </button>
                            <button
                              type="button"
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
                              className="admin-chip text-xs"
                            >
                              3 חודשים אחרונים
                            </button>
                            <button
                              type="button"
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
                              className="admin-chip text-xs"
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
                  <p className="text-sm text-neutral-500 mb-1">תאריך עדכון אחרון</p>
                  <p className="text-base font-medium text-neutral-700">{new Date().toLocaleDateString('he-IL', { 
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
              <div className="mt-4 pt-4 border-t border-neutral-200/60">
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="text-sm">📊 נתונים מוצגים עבור:</span>
                  <span className="text-sm font-medium text-neutral-700">
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

        <div className="admin-inner relative z-0 !pt-8 md:!pt-10 !pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
                <p className="text-neutral-600 text-lg">טוען נתונים...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Financial Balance Card */}
              <div className="mb-10">
                <Card className="border border-primary-100/60 bg-gradient-to-br from-primary-50/40 via-white to-luxe-50/30 shadow-soft-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-neutral-900">מאזן תזרימי</h2>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/transactions')}
                      className="text-sm"
                    >
                      צפה בכל הרשומות →
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        ₪{stats.transactions.totalIncome.toLocaleString()}
                      </div>
                      <div className="text-sm text-neutral-600 font-medium">סה"כ הכנסות</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <div className="text-3xl font-bold text-red-600 mb-1">
                        ₪{stats.transactions.totalExpense.toLocaleString()}
                      </div>
                      <div className="text-sm text-neutral-600 font-medium">סה"כ הוצאות</div>
                    </div>
                    <div className={`text-center p-4 rounded-xl ${stats.transactions.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <div className={`text-3xl font-bold mb-1 ${stats.transactions.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        ₪{stats.transactions.balance.toLocaleString()}
                      </div>
                      <div className="text-sm text-neutral-600 font-medium">מאזן תזרימי</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="לקוחות"
                  value={stats.customers.total}
                  subtitle={`${stats.customers.active} פעילים • ${stats.customers.new} חדשים השבוע`}
                  icon="👥"
                  gradient="bg-blue-50"
                  onClick={() => navigate('/customers')}
                />
                <StatCard
                  title="פגישות"
                  value={stats.bookings.total}
                  subtitle={`${stats.bookings.pending} ממתינות • ${stats.bookings.confirmed} מאושרות`}
                  icon="📅"
                  gradient="bg-emerald-50"
                  onClick={() => navigate('/bookings')}
                />
                <StatCard
                  title="הכנסות"
                  value={`₪${stats.purchases.revenue.toLocaleString()}`}
                  subtitle={`${stats.purchases.completed} רכישות הושלמו${dateRange.startDate || dateRange.endDate ? ' בטווח הנבחר' : ''}`}
                  icon="💰"
                  gradient="bg-violet-50"
                  trend={!dateRange.startDate && !dateRange.endDate}
                  trendValue={stats.purchases.revenueGrowth}
                  onClick={() => navigate('/purchase')}
                />
                <StatCard
                  title="ביקורות"
                  value={stats.reviews.total}
                  subtitle={`${stats.reviews.pending} ממתינות • ⭐ ${stats.reviews.averageRating || 0}`}
                  icon="⭐"
                  gradient="bg-amber-50"
                  onClick={() => navigate('/reviews')}
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white border-l-4 border-blue-200 shadow-soft hover:shadow-soft-lg transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">פניות יצירת קשר</p>
                      <p className="text-2xl font-bold text-neutral-900">{stats.contacts.total}</p>
                      <p className="text-xs text-red-600 mt-1 font-medium">{stats.contacts.unread} לא נקראו</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl shadow-soft">
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

                <Card className="bg-white border-l-4 border-green-200 shadow-soft hover:shadow-soft-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">סטטוס פגישות</p>
                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">ממתינות</span>
                          <span className="font-semibold text-amber-600">{stats.bookings.pending}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">מאושרות</span>
                          <span className="font-semibold text-green-600">{stats.bookings.confirmed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">הושלמו</span>
                          <span className="font-semibold text-blue-600">{stats.bookings.completed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl shadow-soft">
                      <span className="text-3xl">📊</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-l-4 border-purple-200 shadow-soft hover:shadow-soft-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">סטטוס רכישות</p>
                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">ממתינות</span>
                          <span className="font-semibold text-amber-600">{stats.purchases.pending}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">הושלמו</span>
                          <span className="font-semibold text-green-600">{stats.purchases.completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">סה"כ הכנסות</span>
                          <span className="font-semibold text-primary-600">₪{stats.purchases.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl shadow-soft">
                      <span className="text-3xl">💳</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Upcoming Bookings */}
                <Card className="bg-white shadow-soft hover:shadow-soft-lg transition-all duration-200">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200/60">
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-neutral-900">פגישות קרובות</h2>
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
                          className="p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl hover:from-primary-50/50 hover:to-primary-50/30 cursor-pointer transition-all duration-200 border border-neutral-200 hover:border-primary-200 hover:shadow-soft transform hover:-translate-y-0.5"
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
                <Card className="bg-white shadow-soft hover:shadow-soft-lg transition-all duration-200">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200/60">
                    <div>
                      <h2 className="text-xl font-serif font-semibold text-neutral-900">ביקורות ממתינות</h2>
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
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">⭐</div>
                      <p className="text-neutral-500">אין ביקורות ממתינות</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div
                          key={review._id}
                          className="p-4 bg-gradient-to-r from-neutral-50 to-white rounded-xl hover:from-amber-50/50 hover:to-amber-50/30 cursor-pointer transition-all duration-200 border border-neutral-200 hover:border-amber-200 hover:shadow-soft transform hover:-translate-y-0.5"
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
              <Card className="bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30 border border-primary-100 shadow-soft">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">פעולות מהירות</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => navigate('/categories')}
                    variant="secondary"
                    className="flex flex-col items-center gap-2 py-4 hover:bg-primary-50"
                  >
                    <span className="text-2xl">💆</span>
                    <span className="text-sm">ניהול טיפולים</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/courses')}
                    variant="secondary"
                    className="flex flex-col items-center gap-2 py-4 hover:bg-primary-50"
                  >
                    <span className="text-2xl">📚</span>
                    <span className="text-sm">ניהול מסלולים</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/new-booking')}
                    variant="secondary"
                    className="flex flex-col items-center gap-2 py-4 hover:bg-primary-50"
                  >
                    <span className="text-2xl">➕</span>
                    <span className="text-sm">צור פגישה</span>
                  </Button>
                  <Button
                    onClick={() => navigate('/messages')}
                    variant="secondary"
                    className="flex flex-col items-center gap-2 py-4 hover:bg-primary-50"
                  >
                    <span className="text-2xl">💬</span>
                    <span className="text-sm">שלח הודעה</span>
                  </Button>
                  </div>
                </Card>
            </>
          )}
        </div>
        </div>
      </main>
    </>
  )
}

export default DashboardPage
