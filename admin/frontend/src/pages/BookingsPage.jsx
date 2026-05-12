import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import AdminModalLayout from '../components/AdminModalLayout'
import AdminPager from '../components/AdminPager'
import toast from 'react-hot-toast'

const BOOKINGS_PAGE_SIZE = 25

function BookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [bookingStats, setBookingStats] = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('intro') // 'intro', 'regular', או 'history'
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryBooking, setSummaryBooking] = useState(null) // הפגישה שעבורה נוסיף סיכום
  const [sessionSummary, setSessionSummary] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [bookingsRes, customersRes] = await Promise.all([
        bookingService
          .getAll({
            page,
            limit: BOOKINGS_PAGE_SIZE,
            tab: activeTab,
            status: filterStatus,
            meetingType: filterType,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
          })
          .catch((err) => {
            console.error('Error loading bookings:', err)
            return { data: [], pagination: null, stats: null }
          }),
        customerService
          .getAll({ forLookup: 1, page: 1, limit: 1000 })
          .catch((err) => {
            console.error('Error loading customers:', err)
            return { data: [] }
          }),
      ])

      const bookingsData = bookingsRes?.data || []
      const customersData = customersRes?.data || []

      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      setPagination(bookingsRes?.pagination || null)
      setBookingStats(bookingsRes?.stats || null)
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error(`שגיאה בטעינת הנתונים: ${error.response?.data?.message || error.message}`)
      setBookings([])
      setCustomers([])
      setPagination(null)
      setBookingStats(null)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab, filterStatus, filterType, debouncedSearch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const normalize = (value) => String(value || '').trim().toLowerCase()

  const customerLookup = useMemo(() => {
    const map = new Map()
    customers.forEach((c) => {
      const keys = [c?.email, c?.phone, c?.name].map(normalize).filter(Boolean)
      keys.forEach((k) => {
        if (!map.has(k)) map.set(k, c)
      })
    })
    return map
  }, [customers])

  const getCustomerForBooking = (booking) => {
    const keys = [booking?.email, booking?.phone, booking?.name].map(normalize).filter(Boolean)
    for (const key of keys) {
      const match = customerLookup.get(key)
      if (match) return match
    }
    return null
  }

  const handleStatusChange = async (booking, newStatus) => {
    try {
      await bookingService.updateStatus(booking._id, newStatus)
      await loadData()
      if (newStatus === 'confirmed') toast.success('הפגישה אושרה')
      if (newStatus === 'cancelled') toast.success('הפגישה נדחתה')
      if (newStatus === 'completed') toast.success('הפגישה סומנה כבוצעה — ניתן להוסיף סיכום')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('שגיאה בעדכון הסטטוס')
    }
  }

  const handleRejectBooking = (booking) => {
    if (!window.confirm('לדחות את בקשת הפגישה?')) return
    handleStatusChange(booking, 'cancelled')
  }

  const handleResolveCancellationRequest = async (booking, action) => {
    try {
      await bookingService.resolveCancellationRequest(booking._id, action)
      await loadData()
      toast.success(action === 'approve' ? 'בקשת הביטול אושרה' : 'בקשת הביטול נדחתה')
    } catch (error) {
      console.error('Error resolving cancellation request:', error)
      toast.error(error?.response?.data?.message || 'שגיאה בטיפול בבקשת הביטול')
    }
  }

  const handleDeleteBooking = async (booking) => {
    const whenText = booking?.preferredDate
      ? new Date(booking.preferredDate).toLocaleDateString('he-IL')
      : ''
    const ok = window.confirm(
      `למחוק את הפגישה של ${booking?.name || 'ללא שם'}${whenText ? ` בתאריך ${whenText}` : ''}? פעולה זו לא ניתנת לביטול.`
    )
    if (!ok) return
    try {
      await bookingService.delete(booking._id)
      await loadData()
      toast.success('הפגישה נמחקה')
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error(error?.response?.data?.message || 'שגיאה במחיקת הפגישה')
    }
  }

  const handleOpenSummaryModal = (booking) => {
    setSummaryBooking(booking)
    setSessionSummary(booking.sessionSummary || '')
    setShowSummaryModal(true)
  }

  const handleSaveSummary = async () => {
    if (!summaryBooking) return
    
    try {
      // שמור רק את הסיכום (הסטטוס כבר בוצע)
      await bookingService.updateSessionSummary(summaryBooking._id, sessionSummary)
      await loadData()
      setShowSummaryModal(false)
      setSummaryBooking(null)
      setSessionSummary('')
      toast.success('סיכום הפגישה נשמר בהצלחה!')
    } catch (error) {
      console.error('Error saving summary:', error)
      toast.error('שגיאה בשמירת הסיכום')
    }
  }

  const handleCancelSummary = () => {
    setShowSummaryModal(false)
    setSummaryBooking(null)
    setSessionSummary('')
  }

  const stats = bookingStats || {
    total: 0,
    intro: 0,
    regular: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    frontend: 0,
    zoom: 0,
    introOpen: 0,
    regularOpen: 0,
  }

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader title="ניהול פגישות" subtitle="כל הפגישות והזמנות במערכת" />

          <div className="admin-tabs-bar mb-8">
            <button
              type="button"
              onClick={() => {
                setPage(1)
                setActiveTab('intro')
                setFilterStatus('all')
              }}
              className={`admin-tab-btn ${
                activeTab === 'intro' ? 'admin-tab-btn-active' : 'admin-tab-btn-idle'
              }`}
            >
              פגישות היכרות ({stats.introOpen ?? 0})
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1)
                setActiveTab('regular')
                setFilterStatus('all')
              }}
              className={`admin-tab-btn ${
                activeTab === 'regular' ? 'admin-tab-btn-active' : 'admin-tab-btn-idle'
              }`}
            >
              פגישות רגילות ({stats.regularOpen ?? 0})
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1)
                setActiveTab('history')
                setFilterStatus('all')
              }}
              className={`admin-tab-btn ${
                activeTab === 'history' ? 'admin-tab-btn-active' : 'admin-tab-btn-idle'
              }`}
            >
              היסטוריית פגישות ({(stats.completed ?? 0) + (stats.cancelled ?? 0)})
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">סה"כ פגישות</h3>
              <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">ממתינות</h3>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">בקשות ביטול</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.cancellationRequested || 0}</p>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">מאושרות</h3>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">בוצעו</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">בוטלו</h3>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </Card>
          </div>

          {/* Filters */}
          {activeTab !== 'history' && (
            <div className="mb-6 flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">סטטוס</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setPage(1)
                    setFilterStatus(e.target.value)
                  }}
                  className="px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft"
                >
                  <option value="all">הכל</option>
                  <option value="pending">ממתין</option>
                  <option value="cancellation_requested">בקשת ביטול</option>
                  <option value="confirmed">אושר</option>
                  <option value="cancelled">בוטל</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">סוג פגישה</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setPage(1)
                    setFilterType(e.target.value)
                  }}
                  className="px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft"
                >
                  <option value="all">הכל</option>
                  <option value="frontend">פרונטאלי</option>
                  <option value="zoom">אונליין</option>
                </select>
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <div className="mb-6 flex gap-4 flex-wrap">
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">סוג פגישה</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setPage(1)
                    setFilterType(e.target.value)
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="all">הכל</option>
                  <option value="frontend">פרונטאלי</option>
                  <option value="zoom">אונליין</option>
                </select>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-neutral-700">חיפוש פגישה</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון או אימייל"
              className="w-full md:w-[420px] px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft"
            />
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-neutral-600">טוען...</p>
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">
                {pagination?.total === 0 ? 'אין פגישות עדיין' : 'אין פגישות התואמות לסינון'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const customer = getCustomerForBooking(booking)
                return (
                  <Card key={booking._id} className="hover:shadow-soft-lg transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-serif font-semibold text-neutral-900">
                            {booking.name}
                          </h3>
                          {customer && (
                            <Button
                              onClick={() => navigate(`/customer/${customer._id}`)}
                              variant="soft"
                              className="text-xs px-3 py-1"
                            >
                              פתח תיק לקוח
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-neutral-600">
                          {booking.email && <p>📧 {booking.email}</p>}
                          <p>📞 {booking.phone}</p>
                          <p>
                            📅 תאריך:{' '}
                            {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                            {booking.preferredTime
                              ? ` · 🕐 ${booking.preferredTime}`
                              : ''}
                          </p>
                          <p>
                            💻 סוג פגישה: {booking.meetingType === 'zoom' ? 'אונליין' : 'פרונטאלי'}
                          </p>
                          {booking.isIntroMeeting && (
                            <p className="text-primary-600 font-medium">⭐ פגישת היכרות</p>
                          )}
                          {booking.meetingType === 'zoom' && (
                            <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs text-blue-700 font-medium mb-1">🔗 קישור אונליין:</p>
                              {booking.zoomLink ? (
                                <a
                                  href={booking.zoomLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline break-all text-xs block"
                                >
                                  {booking.zoomLink}
                                </a>
                              ) : (
                                <p className="text-xs text-blue-600 italic">עדיין לא נוסף קישור</p>
                              )}
                            </div>
                          )}
                          {booking.notes && (
                            <p className="mt-2 text-neutral-500">📝 הערות: {booking.notes}</p>
                          )}
                          {booking.status === 'completed' && booking.sessionSummary && (
                            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                              <p className="text-xs text-green-700 font-medium mb-1">📋 סיכום פגישה:</p>
                              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{booking.sessionSummary}</p>
                            </div>
                          )}
                          {booking.status === 'completed' && !booking.sessionSummary && (
                            <p className="mt-3 text-xs text-neutral-500">לא הוזן סיכום — ניתן להוסיף בכפתור מימין.</p>
                          )}
                          <p className="text-xs text-neutral-400 mt-2">
                            נרשם ב: {new Date(booking.createdAt).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end ml-4 shrink-0 min-w-[9rem]">
                        <span
                          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium border ${
                            booking.status === 'confirmed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : booking.status === 'cancellation_requested'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : booking.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : booking.status === 'cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {booking.status === 'confirmed'
                            ? 'אושר'
                            : booking.status === 'cancellation_requested'
                              ? 'בקשת ביטול'
                            : booking.status === 'completed'
                              ? 'בוצע'
                              : booking.status === 'cancelled'
                                ? 'בוטל'
                                : 'ממתין'}
                        </span>
                        {activeTab !== 'history' && booking.status === 'pending' && (
                          <div className="flex flex-row-reverse flex-wrap gap-2 justify-end">
                            <Button
                              type="button"
                              variant="primary"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleStatusChange(booking, 'confirmed')}
                            >
                              אשר
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleRejectBooking(booking)}
                            >
                              דחה
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleDeleteBooking(booking)}
                            >
                              מחק
                            </Button>
                          </div>
                        )}
                        {activeTab !== 'history' && booking.status === 'confirmed' && (
                          <div className="flex flex-row-reverse flex-wrap gap-2 justify-end">
                            <Button
                              type="button"
                              variant="primary"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleStatusChange(booking, 'completed')}
                            >
                              בוצע
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleStatusChange(booking, 'cancelled')}
                            >
                              ביטול
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleDeleteBooking(booking)}
                            >
                              מחק
                            </Button>
                          </div>
                        )}
                        {activeTab !== 'history' && booking.status === 'cancellation_requested' && (
                          <div className="flex flex-row-reverse flex-wrap gap-2 justify-end">
                            <Button
                              type="button"
                              variant="danger"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleResolveCancellationRequest(booking, 'approve')}
                            >
                              אשר ביטול
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="!px-3 !py-1.5 text-xs"
                              onClick={() => handleResolveCancellationRequest(booking, 'reject')}
                            >
                              דחה בקשה
                            </Button>
                          </div>
                        )}
                        {activeTab !== 'history' && booking.status === 'cancelled' && (
                          <p className="text-xs text-neutral-500 text-right leading-snug">הפגישה בוטלה</p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
          <AdminPager
            page={pagination?.page ?? page}
            pages={pagination?.pages ?? 1}
            total={pagination?.total}
            loading={loading}
            onPageChange={setPage}
          />
      </AdminPageShell>

      {/* Session Summary Modal */}
      {showSummaryModal && summaryBooking && (
        <AdminModalLayout
          title={
            summaryBooking?.sessionSummary ? 'ערוך סיכום פגישה' : 'הוסף סיכום פגישה'
          }
          onClose={handleCancelSummary}
          footer={
            <>
              <button
                type="button"
                onClick={handleCancelSummary}
                className="btn-secondary flex-1 px-4 py-2.5"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSaveSummary}
                disabled={!sessionSummary.trim()}
                className="btn-primary flex-1 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                שמור סיכום
              </button>
            </>
          }
        >
          <div className="mb-4 rounded-xl bg-neutral-50 p-4">
            <p className="mb-1 text-sm text-neutral-600">
              <strong>לקוח:</strong> {summaryBooking.name}
            </p>
            <p className="mb-1 text-sm text-neutral-600">
              <strong>תאריך:</strong>{' '}
              {new Date(summaryBooking.preferredDate).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-sm text-neutral-600">
              <strong>סוג פגישה:</strong> {summaryBooking.meetingType === 'zoom' ? 'אונליין' : 'פרונטאלי'}
            </p>
          </div>

          <div className="mb-4">
            <label className="admin-label">סיכום הפגישה *</label>
            <textarea
              value={sessionSummary}
              onChange={(e) => setSessionSummary(e.target.value)}
              rows="10"
              className="admin-textarea resize-none"
              placeholder="תאר את מה שקרה בפגישה, נושאים שדוברו, התקדמות, המלצות להמשך..."
              required
            />
            <p className="mt-1 text-xs text-neutral-500">{sessionSummary.length}/5000 תווים</p>
          </div>
        </AdminModalLayout>
      )}
    </>
  )
}

export default BookingsPage

