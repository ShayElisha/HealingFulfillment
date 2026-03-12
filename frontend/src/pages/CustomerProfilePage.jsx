import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authApi'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'
import { triggerConfetti } from '../utils/confetti'
import toast from 'react-hot-toast'
import { reviewsService } from '../services/reviewsApi'

function CustomerProfilePage() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    content: ''
  })
  const [myReview, setMyReview] = useState(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    preferredDate: '',
    preferredTime: '',
    meetingType: 'frontend',
    notes: ''
  })
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    // אם לא מחובר, הפנה לדף התחברות
    if (!isAuthenticated) {
      navigate('/customer/login')
      return
    }
    loadCustomerData()
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'messages') {
      loadMessages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadMyReview = async () => {
    try {
      const response = await reviewsService.getMyReview()
      if (response.data) {
        setMyReview(response.data)
        setReviewForm({
          rating: response.data.rating,
          content: response.data.content
        })
      }
    } catch (error) {
      console.error('Error loading review:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated && customerData) {
      loadMyReview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, customerData])

  const loadMessages = async () => {
    try {
      setMessagesLoading(true)
      const response = await authService.getMessages()
      const messagesData = response?.data || []
      setMessages(Array.isArray(messagesData) ? messagesData : [])
    } catch (error) {
      console.error('Error loading messages:', error)
      // Don't show error toast if it's just authentication issue
      if (error.response?.status !== 401) {
        toast.error('שגיאה בטעינת הודעות')
      }
    } finally {
      setMessagesLoading(false)
    }
  }

  const loadCustomerData = async () => {
    try {
      setLoading(true)
      const response = await authService.getMe()
      setCustomerData(response.data)
    } catch (error) {
      console.error('Error loading customer data:', error)
      toast.error('שגיאה בטעינת פרטי הלקוח')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      logout()
      navigate('/customer/login')
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingBooking(true)
    setBookingError('')

    try {
      await authService.createBooking(bookingForm)
      triggerConfetti()
      toast.success('פגישה נקבעה בהצלחה! ניצור איתך קשר בקרוב לאישור הפגישה.')
      setBookingForm({
        preferredDate: '',
        preferredTime: '',
        meetingType: 'frontend',
        notes: ''
      })
      // טען מחדש את הנתונים
      await loadCustomerData()
      // עבור לטאב פגישות
      setActiveTab('bookings')
    } catch (error) {
      setBookingError(error.response?.data?.message || 'שגיאה בקביעת הפגישה. אנא נסה שוב.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>תיק לקוח | טוען...</title>
        </Helmet>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <p className="text-xl text-neutral-600">טוען...</p>
        </div>
      </>
    )
  }

  if (!customerData) {
    return (
      <>
        <Helmet>
          <title>תיק לקוח | שגיאה</title>
        </Helmet>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-neutral-600 mb-4">שגיאה בטעינת הנתונים</p>
            <Button onClick={loadCustomerData} variant="primary">
              נסה שוב
            </Button>
          </div>
        </div>
      </>
    )
  }

  const stats = {
    totalSessions: customerData.bookings?.length || 0,
    confirmedSessions: customerData.bookings?.filter(b => b.status === 'confirmed').length || 0,
    completedCourses: customerData.purchases?.filter(p => p.status === 'completed').length || 0,
    totalSpent: customerData.purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0
  }

  return (
    <>
      <Helmet>
        <title>תיק לקוח | {customerData.name}</title>
        <meta
          name="description"
          content="תיק הלקוח שלך - רכישות, פגישות וקבצים"
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                תיק לקוח
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                שלום {customerData.name}, כאן תוכל לצפות בפרטים האישיים שלך, רכישות ופגישות
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Profile Content */}
      <Section variant="white">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-neutral-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'סקירה כללית' },
              { id: 'purchases', label: `רכישות (${customerData.purchases?.length || 0})` },
              { id: 'bookings', label: `פגישות (${customerData.bookings?.filter(b => b.status !== 'completed').length || 0})` },
              { id: 'history', label: `היסטוריית פגישות (${customerData.bookings?.filter(b => b.status === 'completed').length || 0})` },
              { id: 'messages', label: `הודעות (${messages.length})` },
              { id: 'new-booking', label: 'קבע פגישה' },
              { id: 'files', label: `קבצים (${customerData.files?.length || 0})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-neutral-600 hover:text-primary-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Info */}
              <Card>
                <h3 className="text-xl font-semibold mb-4">פרטים אישיים</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">שם מלא</p>
                    <p className="font-semibold">{customerData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">אימייל</p>
                    <p className="font-semibold">{customerData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">טלפון</p>
                    <p className="font-semibold">{customerData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">סטטוס</p>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      customerData.status === 'active' ? 'bg-green-100 text-green-700' :
                      customerData.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {customerData.status === 'active' ? 'פעיל' :
                       customerData.status === 'completed' ? 'הושלם' :
                       'לא פעיל'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-700">פגישות</h3>
                  <p className="text-3xl font-bold text-primary-600">
                    {stats.totalSessions}
                  </p>
                  <p className="text-sm text-neutral-600 mt-2">
                    {stats.confirmedSessions} מאושרות
                  </p>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-700">רכישות</h3>
                  <p className="text-3xl font-bold text-primary-600">
                    {customerData.purchases?.length || 0}
                  </p>
                  <p className="text-sm text-neutral-600 mt-2">
                    {stats.completedCourses} הושלמו
                  </p>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-700">סה"כ הוצאה</h3>
                  <p className="text-3xl font-bold text-primary-600">
                    ₪{stats.totalSpent}
                  </p>
                </Card>
                <Card>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-700">פגישות הושלמו</h3>
                  <p className="text-3xl font-bold text-primary-600">
                    {customerData.completedSessions || 0}
                  </p>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex gap-4 flex-wrap">
                <Button
                  onClick={() => navigate('/customer/change-password')}
                  variant="soft"
                >
                  שנה סיסמה
                </Button>
                {(customerData.bookings?.filter(b => b.status === 'completed').length || 0) > 0 && (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    variant="primary"
                  >
                    {myReview ? 'ערוך ביקורת' : 'הוסף ביקורת'}
                  </Button>
                )}
                <Button
                  onClick={handleLogout}
                  variant="soft"
                  className="text-red-600 hover:text-red-700"
                >
                  התנתק
                </Button>
              </div>
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {customerData.purchases && customerData.purchases.length > 0 ? (
                customerData.purchases.map((purchase) => (
                  <Card key={purchase._id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {purchase.course?.title || 'מסלול'}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          תאריך רכישה: {new Date(purchase.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {purchase.course?.sessionsCount && (
                          <p className="text-sm text-neutral-600 mt-1">
                            כמות מפגשים: {purchase.course.sessionsCount}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-bold text-primary-600 mb-2">
                          ₪{purchase.price}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          purchase.status === 'completed' ? 'bg-green-100 text-green-700' :
                          purchase.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {purchase.status === 'completed' ? 'הושלם' :
                           purchase.status === 'cancelled' ? 'בוטל' :
                           'ממתין'}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין רכישות עדיין</p>
                </Card>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {customerData.bookings && customerData.bookings.filter(b => b.status !== 'completed').length > 0 ? (
                customerData.bookings.filter(b => b.status !== 'completed').map((booking) => (
                  <Card key={booking._id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          פגישה ב-{new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {booking.meetingType === 'zoom' ? '💻 זום' : '🏢 פרונטאלי'}
                          {booking.isIntroMeeting && ' | ⭐ פגישת היכרות'}
                        </p>
                        {booking.meetingType === 'zoom' && booking.zoomLink && (
                          <div className="mt-2">
                            <a
                              href={booking.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
                            >
                              🔗 לינק זום
                              <span className="text-xs">(פתח בחדש)</span>
                            </a>
                          </div>
                        )}
                        {booking.meetingType === 'zoom' && !booking.zoomLink && (
                          <p className="text-xs text-neutral-500 mt-2 italic">
                            קישור זום יישלח בהמשך
                          </p>
                        )}
                        {booking.sessionSummary && (
                          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-green-700 font-medium mb-1">📋 סיכום פגישה:</p>
                            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{booking.sessionSummary}</p>
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
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
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין פגישות פעילות</p>
                </Card>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {customerData.bookings && customerData.bookings.filter(b => b.status === 'completed').length > 0 ? (
                customerData.bookings.filter(b => b.status === 'completed').map((booking) => (
                  <Card key={booking._id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          פגישה ב-{new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {booking.meetingType === 'zoom' ? '💻 זום' : '🏢 פרונטאלי'}
                          {booking.isIntroMeeting && ' | ⭐ פגישת היכרות'}
                        </p>
                        {booking.preferredTime && (
                          <p className="text-sm text-neutral-600 mt-1">
                            🕐 שעה: {booking.preferredTime}
                          </p>
                        )}
                        {booking.meetingType === 'zoom' && booking.zoomLink && (
                          <div className="mt-2">
                            <a
                              href={booking.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
                            >
                              🔗 לינק זום
                              <span className="text-xs">(פתח בחדש)</span>
                            </a>
                          </div>
                        )}
                        {booking.sessionSummary && (
                          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-green-700 font-medium mb-1">📋 סיכום פגישה:</p>
                            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{booking.sessionSummary}</p>
                          </div>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs whitespace-nowrap bg-blue-100 text-blue-700">
                        בוצע
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין פגישות שהושלמו</p>
                </Card>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messagesLoading ? (
                <Card>
                  <p className="text-center text-neutral-500 py-8">טוען הודעות...</p>
                </Card>
              ) : messages.length === 0 ? (
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין הודעות חדשות</p>
                </Card>
              ) : (
                messages.map((message) => (
                  <Card key={message._id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {message.subject}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            message.status === 'sent' ? 'bg-green-100 text-green-700' :
                            message.status === 'failed' ? 'bg-red-100 text-red-700' :
                            message.status === 'partially_sent' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {message.status === 'sent' ? 'נשלח' :
                             message.status === 'failed' ? 'נכשל' :
                             message.status === 'partially_sent' ? 'חלקי' :
                             'ממתין'}
                          </span>
                        </div>
                        <div className="text-neutral-700 whitespace-pre-wrap mb-3">
                          {message.content}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                          <span>
                            {message.channels.includes('email') && '📧 אימייל'}
                            {message.channels.includes('email') && message.channels.includes('whatsapp') && ' • '}
                            {message.channels.includes('whatsapp') && '💬 וואטסאפ'}
                          </span>
                          <span>📅 {new Date(message.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* New Booking Tab */}
          {activeTab === 'new-booking' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-2xl font-semibold mb-4">קבע פגישה חדשה</h3>
                
                {customerData.availableSessions > 0 ? (
                  <>
                    <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-primary-800 font-medium">
                        יש לך {customerData.availableSessions} מפגשים זמינים מתוך {customerData.totalSessionsPurchased || 0} שנרכשו
                      </p>
                    </div>

                    <form onSubmit={handleBookingSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          סוג פגישה *
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            bookingForm.meetingType === 'frontend'
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-300 hover:border-primary-300'
                          }`}>
                            <input
                              type="radio"
                              name="meetingType"
                              value="frontend"
                              checked={bookingForm.meetingType === 'frontend'}
                              onChange={(e) => setBookingForm({ ...bookingForm, meetingType: e.target.value })}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                bookingForm.meetingType === 'frontend'
                                  ? 'border-primary-500'
                                  : 'border-neutral-400'
                              }`}>
                                {bookingForm.meetingType === 'frontend' && (
                                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-neutral-900">פגישה פרונטאלית</div>
                                <div className="text-sm text-neutral-600">פגישה במשרד</div>
                              </div>
                            </div>
                          </label>
                          <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            bookingForm.meetingType === 'zoom'
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-300 hover:border-primary-300'
                          }`}>
                            <input
                              type="radio"
                              name="meetingType"
                              value="zoom"
                              checked={bookingForm.meetingType === 'zoom'}
                              onChange={(e) => setBookingForm({ ...bookingForm, meetingType: e.target.value })}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                bookingForm.meetingType === 'zoom'
                                  ? 'border-primary-500'
                                  : 'border-neutral-400'
                              }`}>
                                {bookingForm.meetingType === 'zoom' && (
                                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-neutral-900">פגישה בזום</div>
                                <div className="text-sm text-neutral-600">פגישה מקוונת</div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="preferredDate" className="block text-sm font-medium text-neutral-700 mb-2">
                            תאריך מועדף *
                          </label>
                          <input
                            type="date"
                            id="preferredDate"
                            required
                            value={bookingForm.preferredDate}
                            onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label htmlFor="preferredTime" className="block text-sm font-medium text-neutral-700 mb-2">
                            שעה מועדפת
                          </label>
                          <select
                            id="preferredTime"
                            value={bookingForm.preferredTime}
                            onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          >
                            <option value="">בחר שעה</option>
                            <option value="09:00">09:00</option>
                            <option value="10:00">10:00</option>
                            <option value="11:00">11:00</option>
                            <option value="12:00">12:00</option>
                            <option value="13:00">13:00</option>
                            <option value="14:00">14:00</option>
                            <option value="15:00">15:00</option>
                            <option value="16:00">16:00</option>
                            <option value="17:00">17:00</option>
                            <option value="18:00">18:00</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-2">
                          הערות נוספות
                        </label>
                        <textarea
                          id="notes"
                          rows="4"
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                          placeholder="יש משהו נוסף שתרצה שנדע לפני הפגישה?"
                        />
                      </div>

                      {bookingError && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                          {bookingError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full md:w-auto"
                        disabled={isSubmittingBooking}
                      >
                        {isSubmittingBooking ? 'שולח...' : 'קבע פגישה'}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                    <p className="text-yellow-800 font-medium mb-4">
                      אין לך מפגשים זמינים
                    </p>
                    <p className="text-yellow-700 mb-4">
                      על מנת לקבוע פגישה נוספת, נא לרכוש מסלול טיפול.
                    </p>
                    <Button
                      onClick={() => navigate('/courses')}
                      variant="primary"
                    >
                      רכוש מסלול
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerData.files && customerData.files.length > 0 ? (
                customerData.files.map((file) => (
                  <Card key={file._id}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{file.name}</h4>
                    </div>
                    {file.description && (
                      <p className="text-sm text-neutral-600 mb-2">{file.description}</p>
                    )}
                    <a
                      href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm"
                    >
                      צפה בקובץ
                    </a>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <p className="text-center text-neutral-500 py-8">אין קבצים עדיין</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              {myReview ? 'ערוך ביקורת' : 'הוסף ביקורת'}
            </h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (reviewForm.rating === 0) {
                toast.error('אנא בחר דירוג')
                return
              }
              if (!reviewForm.content.trim()) {
                toast.error('אנא כתוב ביקורת')
                return
              }
              
              setIsSubmittingReview(true)
              try {
                if (myReview) {
                  await reviewsService.update(myReview._id, reviewForm)
                  toast.success('ביקורת עודכנה בהצלחה')
                } else {
                  await reviewsService.create(reviewForm)
                  toast.success('ביקורת נשלחה בהצלחה וממתינה לאישור')
                }
                setShowReviewModal(false)
                await loadMyReview()
              } catch (error) {
                console.error('Error submitting review:', error)
                toast.error(error.response?.data?.message || 'שגיאה בשליחת הביקורת')
              } finally {
                setIsSubmittingReview(false)
              }
            }} className="space-y-6">
              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  דירוג *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="text-4xl focus:outline-none transition-transform hover:scale-110"
                    >
                      {star <= reviewForm.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                {reviewForm.rating > 0 && (
                  <p className="text-sm text-neutral-600 mt-2">
                    בחרת {reviewForm.rating} {reviewForm.rating === 1 ? 'כוכב' : 'כוכבים'}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label htmlFor="reviewContent" className="block text-sm font-medium text-neutral-700 mb-2">
                  תוכן הביקורת *
                </label>
                <textarea
                  id="reviewContent"
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  rows="6"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="שתף את החוויה שלך..."
                  maxLength={1000}
                  required
                />
                <p className="text-sm text-neutral-500 mt-2">
                  {reviewForm.content.length}/1000 תווים
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button type="submit" variant="primary" disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'שולח...' : (myReview ? 'עדכן ביקורת' : 'שלח ביקורת')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false)
                    if (!myReview) {
                      setReviewForm({ rating: 0, content: '' })
                    }
                  }}
                  variant="soft"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default CustomerProfilePage

