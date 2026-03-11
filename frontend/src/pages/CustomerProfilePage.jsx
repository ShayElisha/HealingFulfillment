import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authApi'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function CustomerProfilePage() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const loadCustomerData = async () => {
    try {
      setLoading(true)
      const response = await authService.getMe()
      setCustomerData(response.data)
    } catch (error) {
      console.error('Error loading customer data:', error)
      alert('שגיאה בטעינת פרטי הלקוח')
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
      alert('פגישה נקבעה בהצלחה! ניצור איתך קשר בקרוב לאישור הפגישה.')
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
              { id: 'bookings', label: `פגישות (${customerData.bookings?.length || 0})` },
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
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/customer/change-password')}
                  variant="soft"
                >
                  שנה סיסמה
                </Button>
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
              {customerData.bookings && customerData.bookings.length > 0 ? (
                customerData.bookings.map((booking) => (
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
                          {booking.preferredTime && `🕐 ${booking.preferredTime} | `}
                          {booking.meetingType === 'zoom' ? '💻 זום' : '🏢 פרונטאלי'}
                        </p>
                        {booking.zoomLink && booking.status === 'confirmed' && booking.meetingType === 'zoom' && (
                          <a
                            href={booking.zoomLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm mt-2 inline-block"
                          >
                            🔗 לינק זום
                          </a>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status === 'confirmed' ? 'אושר' :
                         booking.status === 'cancelled' ? 'בוטל' :
                         'ממתין'}
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין פגישות עדיין</p>
                </Card>
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
                      href={file.url.startsWith('http') ? file.url : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') + file.url : file.url)}
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
    </>
  )
}

export default CustomerProfilePage

