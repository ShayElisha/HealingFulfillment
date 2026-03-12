import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function BookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('intro') // 'intro', 'regular', או 'history'
  const [editingZoomLink, setEditingZoomLink] = useState(null) // ID של פגישה בעריכה
  const [zoomLinkValue, setZoomLinkValue] = useState('')
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryBooking, setSummaryBooking] = useState(null) // הפגישה שעבורה נוסיף סיכום
  const [sessionSummary, setSessionSummary] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [bookingsRes, customersRes] = await Promise.all([
        bookingService.getAll().catch(err => {
          console.error('Error loading bookings:', err)
          return { data: [] }
        }),
        customerService.getAll().catch(err => {
          console.error('Error loading customers:', err)
          return { data: [] }
        })
      ])
      
      const bookingsData = bookingsRes?.data || bookingsRes || []
      const customersData = customersRes?.data || customersRes || []
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error(`שגיאה בטעינת הנתונים: ${error.response?.data?.message || error.message}`)
      // Set empty arrays on error to prevent crashes
      setBookings([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const getCustomerForBooking = (booking) => {
    return customers.find(c => 
      c.email === booking.email || 
      c.phone === booking.phone ||
      c.name === booking.name
    )
  }

  const filteredBookings = bookings.filter(booking => {
    // סינון לפי טאב (פגישת היכרות, רגילה, או היסטוריה)
    if (activeTab === 'intro') {
      if (booking.isIntroMeeting && booking.status !== 'completed') {
        // פגישות היכרות פעילות בלבד
        if (filterStatus !== 'all' && booking.status !== filterStatus) return false
        if (filterType !== 'all' && booking.meetingType !== filterType) return false
        return true
      }
      return false
    }
    if (activeTab === 'regular') {
      if (!booking.isIntroMeeting && booking.status !== 'completed') {
        // פגישות רגילות פעילות בלבד
        if (filterStatus !== 'all' && booking.status !== filterStatus) return false
        if (filterType !== 'all' && booking.meetingType !== filterType) return false
        return true
      }
      return false
    }
    if (activeTab === 'history') {
      // רק פגישות שהושלמו
      if (booking.status === 'completed') {
        if (filterType !== 'all' && booking.meetingType !== filterType) return false
        return true
      }
      return false
    }
    
    return false
  })

  const handleEditZoomLink = (booking) => {
    setEditingZoomLink(booking._id)
    setZoomLinkValue(booking.zoomLink || '')
  }

  const handleCancelEditZoomLink = () => {
    setEditingZoomLink(null)
    setZoomLinkValue('')
  }

  const handleSaveZoomLink = async (bookingId) => {
    try {
      await bookingService.updateZoomLink(bookingId, zoomLinkValue)
      await loadData()
      setEditingZoomLink(null)
      setZoomLinkValue('')
      toast.success(zoomLinkValue ? 'קישור זום עודכן בהצלחה!' : 'קישור זום נמחק בהצלחה!')
    } catch (error) {
      console.error('Error updating zoom link:', error)
      toast.error('שגיאה בעדכון קישור זום')
    }
  }

  const handleDeleteZoomLink = async (bookingId) => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את קישור הזום?')
    if (!confirmed) {
      return
    }
    try {
      await bookingService.updateZoomLink(bookingId, '')
      await loadData()
      toast.success('קישור זום נמחק בהצלחה!')
    } catch (error) {
      console.error('Error deleting zoom link:', error)
      toast.error('שגיאה במחיקת קישור זום')
    }
  }

  const handleStatusChange = async (booking, newStatus) => {
    try {
      // עדכן את הסטטוס ישירות
      await bookingService.updateStatus(booking._id, newStatus)
      await loadData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('שגיאה בעדכון הסטטוס')
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

  const stats = {
    total: bookings.length,
    intro: bookings.filter(b => b.isIntroMeeting).length,
    regular: bookings.filter(b => !b.isIntroMeeting).length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    frontend: bookings.filter(b => b.meetingType === 'frontend').length,
    zoom: bookings.filter(b => b.meetingType === 'zoom').length
  }

  return (
    <>
      <Navbar activeTab="bookings" onTabChange={() => {}} purchasesCount={0} bookingsCount={bookings.length} customersCount={customers.length} contactsCount={0} />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              ← חזור לדף הראשי
            </button>
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
              ניהול פגישות
            </h1>
            <p className="text-neutral-600">כל הפגישות והזמנות</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-neutral-200">
            <button
              onClick={() => {
                setActiveTab('intro')
                setFilterStatus('all')
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'intro'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              פגישות היכרות ({bookings.filter(b => b.isIntroMeeting && b.status !== 'completed').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('regular')
                setFilterStatus('all')
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'regular'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              פגישות רגילות ({bookings.filter(b => !b.isIntroMeeting && b.status !== 'completed').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('history')
                setFilterStatus('all')
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'history'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              היסטוריית פגישות ({stats.completed})
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">סה"כ פגישות</h3>
              <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">ממתינות</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">מאושרות</h3>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">בוצעו</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </Card>
            <Card>
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
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="all">הכל</option>
                  <option value="pending">ממתין</option>
                  <option value="confirmed">אושר</option>
                  <option value="cancelled">בוטל</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-neutral-700">סוג פגישה</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="all">הכל</option>
                  <option value="frontend">פרונטאלי</option>
                  <option value="zoom">זום</option>
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
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg"
                >
                  <option value="all">הכל</option>
                  <option value="frontend">פרונטאלי</option>
                  <option value="zoom">זום</option>
                </select>
              </div>
            </div>
          )}

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-neutral-600">טוען...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">
                {bookings.length === 0 ? 'אין פגישות עדיין' : 'אין פגישות התואמות לסינון'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const customer = getCustomerForBooking(booking)
                return (
                  <Card key={booking._id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-neutral-900">
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
                            📅 תאריך: {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p>
                            💻 סוג פגישה: {booking.meetingType === 'zoom' ? 'זום' : 'פרונטאלי'}
                          </p>
                          {booking.isIntroMeeting && (
                            <p className="text-primary-600 font-medium">⭐ פגישת היכרות</p>
                          )}
                          {booking.meetingType === 'zoom' && (
                            <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                              {editingZoomLink === booking._id ? (
                                <div className="space-y-2">
                                  <label className="text-xs text-blue-700 font-medium block">
                                    🔗 קישור זום:
                                  </label>
                                  <input
                                    type="url"
                                    value={zoomLinkValue}
                                    onChange={(e) => setZoomLinkValue(e.target.value)}
                                    placeholder="https://zoom.us/j/..."
                                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveZoomLink(booking._id)}
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                    >
                                      שמור
                                    </button>
                                    <button
                                      onClick={handleCancelEditZoomLink}
                                      className="px-3 py-1 bg-neutral-200 text-neutral-700 text-xs rounded hover:bg-neutral-300"
                                    >
                                      ביטול
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-blue-700 font-medium">🔗 קישור זום:</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditZoomLink(booking)}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      >
                                        {booking.zoomLink ? 'ערוך' : 'הוסף קישור'}
                                      </button>
                                      {booking.zoomLink && (
                                        <button
                                          onClick={() => handleDeleteZoomLink(booking._id)}
                                          className="text-xs text-red-600 hover:text-red-800 underline"
                                        >
                                          מחק
                                        </button>
                                      )}
                                    </div>
                                  </div>
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
                            </div>
                          )}
                          {booking.notes && (
                            <p className="mt-2 text-neutral-500">📝 הערות: {booking.notes}</p>
                          )}
                          {booking.status === 'completed' && (
                            <div className="mt-3">
                              {booking.sessionSummary ? (
                                <div className="p-3 bg-green-50 rounded border border-green-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-green-700 font-medium">📋 סיכום פגישה:</p>
                                    <button
                                      onClick={() => handleOpenSummaryModal(booking)}
                                      className="text-xs text-green-600 hover:text-green-800 underline"
                                    >
                                      ערוך
                                    </button>
                                  </div>
                                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{booking.sessionSummary}</p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenSummaryModal(booking)}
                                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                                >
                                  + הוסף סיכום פגישה
                                </button>
                              )}
                            </div>
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
                      <div className="flex flex-col gap-2 items-end ml-4">
                        <span className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'אושר' :
                           booking.status === 'completed' ? 'בוצע' :
                           booking.status === 'cancelled' ? 'בוטל' :
                           'ממתין'}
                        </span>
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking, e.target.value)}
                          className="text-xs px-2 py-1 border border-neutral-300 rounded"
                        >
                          <option value="pending">ממתין</option>
                          <option value="confirmed">אושר</option>
                          <option value="completed">בוצע</option>
                          <option value="cancelled">בוטל</option>
                        </select>
                        {booking.status === 'completed' && (
                          <button
                            onClick={() => handleOpenSummaryModal(booking)}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors mt-2"
                          >
                            {booking.sessionSummary ? 'ערוך סיכום' : 'הוסף סיכום'}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummaryModal && summaryBooking && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCancelSummary}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-neutral-900">
                {summaryBooking?.sessionSummary ? 'ערוך סיכום פגישה' : 'הוסף סיכום פגישה'}
              </h2>
              <button
                onClick={handleCancelSummary}
                className="text-neutral-400 hover:text-neutral-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600 mb-1">
                  <strong>לקוח:</strong> {summaryBooking.name}
                </p>
                <p className="text-sm text-neutral-600 mb-1">
                  <strong>תאריך:</strong> {new Date(summaryBooking.preferredDate).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-neutral-600">
                  <strong>סוג פגישה:</strong> {summaryBooking.meetingType === 'zoom' ? 'זום' : 'פרונטאלי'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  סיכום הפגישה *
                </label>
                <textarea
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  rows="10"
                  className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="תאר את מה שקרה בפגישה, נושאים שדוברו, התקדמות, המלצות להמשך..."
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {sessionSummary.length}/5000 תווים
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-4">
              <button
                onClick={handleCancelSummary}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveSummary}
                disabled={!sessionSummary.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                שמור סיכום
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BookingsPage

