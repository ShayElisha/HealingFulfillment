import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authApi'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'
import RegulationsQuestionnaireModal from '../components/RegulationsQuestionnaireModal'
import RegulationsQuestionnaireTab from '../components/RegulationsQuestionnaireTab'
import TriggerJournalSection from '../components/TriggerJournalSection'
import { triggerConfetti } from '../utils/confetti'
import toast from 'react-hot-toast'
import { getAdminPanelBaseUrl } from '../utils/adminPanelUrl'
import { reviewsService } from '../services/reviewsApi'
import { bookingService } from '../services/api'

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

/**
 * חלון ליווי: שמור → תאריכי מסלול; אחרת חישוב מ־coachingProcessMonths + תאריך בסיס
 * (כמו «קבע תקופת ליווי» במנהל: עדיפות ל־caseOpenedAt, אחרת חיוב/רכישה)
 */
function getCoachingWindow(purchase, customer) {
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

function isCoachingCurrentlyActive(purchase, customer) {
  if (purchase?.status !== 'completed') return false
  const w = getCoachingWindow(purchase, customer)
  if (!w) return false
  const now = Date.now()
  return now >= w.start.getTime() && now <= w.end.getTime()
}

/** תקופת ליווי לתצוגה: אם יש מנוי שנוצר מאותה רכישה — משתמשים בתאריכי המנוי (גם כשהמנוי פג) */
function getCoachingPeriodForPurchaseDisplay(purchase, customerData) {
  const sub = customerData?.activeSubscription
  if (
    sub &&
    purchase?._id &&
    sub.purchase &&
    String(sub.purchase) === String(purchase._id)
  ) {
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

function purchaseDisplayDate(purchase) {
  if (purchase?.paidAt && purchase?.status === 'completed') {
    return new Date(purchase.paidAt)
  }
  return purchase?.createdAt ? new Date(purchase.createdAt) : null
}

/** קישורי קבצים: לרוב Cloudinary (URL מלא); נתיב ישן /uploads/ — בפיתוח פרוקסי Vite לשרת האדמין */
function resolveCustomerUploadUrl(urlPath) {
  if (!urlPath) return ''
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath
  if (import.meta.env.DEV) return urlPath
  const adminBase = import.meta.env.VITE_ADMIN_ASSET_URL?.replace(/\/$/, '')
  if (adminBase) return `${adminBase}${urlPath}`
  const apiBase = import.meta.env.VITE_API_URL
  if (apiBase) return apiBase.replace(/\/api\/?$/, '') + urlPath
  return urlPath
}

function toDateInputYmd(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getBookingDateTime(booking) {
  const dt = new Date(booking.preferredDate)
  if (booking.preferredTime && /^\d{1,2}:\d{2}$/.test(String(booking.preferredTime).trim())) {
    const [h, m] = String(booking.preferredTime).trim().split(':').map(Number)
    dt.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)
  } else {
    dt.setHours(23, 59, 59, 999)
  }
  return dt
}

function CustomerProfilePage() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isRegulationsModalOpen, setIsRegulationsModalOpen] = useState(false)
  const [isFirstBookingUnlocked, setIsFirstBookingUnlocked] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    content: '',
    video: null,
  })
  const [myReview, setMyReview] = useState(null)
  const [reviewEligibility, setReviewEligibility] = useState(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isUploadingReviewVideo, setIsUploadingReviewVideo] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    preferredDate: '',
    preferredTime: '',
    meetingType: 'frontend',
    notes: ''
  })
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingAvailability, setBookingAvailability] = useState({
    unavailableTimes: [],
    availableTimes: [],
    isDateUnavailable: false,
  })
  const [loadingBookingAvailability, setLoadingBookingAvailability] = useState(false)
  const [bookingAvailabilityLoadError, setBookingAvailabilityLoadError] = useState(false)

  const nonAudioFiles =
    customerData?.files?.filter((f) => f.type !== 'audio') ?? []
  const audioOnlyFiles =
    customerData?.files?.filter((f) => f.type === 'audio') ?? []

  useEffect(() => {
    // Unlock based on server value (DB) instead of localStorage
    const completed = Boolean(customerData?.regulationsQuestionnaire?.completed)
    setIsFirstBookingUnlocked(completed)
  }, [customerData])

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

  const loadMyReview = async () => {
    try {
      const response = await reviewsService.getMyReview()
      setReviewEligibility(response?.meta?.eligibility || null)
      if (response.data) {
        setMyReview(response.data)
        setReviewForm({
          rating: response.data.rating,
          content: response.data.content,
          video: response.data.video?.url ? response.data.video : null,
        })
      } else {
        setMyReview(null)
        setReviewForm({ rating: 0, content: '', video: null })
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
      toast.success('התנתקת בהצלחה')
    }
  }

  const handleGoToAdmin = () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      toast.error('צריך להתחבר כדי להיכנס למנהל')
      navigate('/customer/login')
      return
    }
    const adminBase = getAdminPanelBaseUrl()
    try {
      const url = new URL(adminBase, window.location.origin)
      url.searchParams.set('token', token)
      window.location.href = url.toString()
    } catch {
      window.location.href = `${adminBase}?token=${encodeURIComponent(token)}`
    }
  }

  useEffect(() => {
    if (!bookingForm.preferredDate) {
      setBookingAvailabilityLoadError(false)
      setBookingAvailability({
        unavailableTimes: [],
        availableTimes: [],
        isDateUnavailable: false,
      })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoadingBookingAvailability(true)
        setBookingAvailabilityLoadError(false)
        const response = await bookingService.getAvailability({
          date: bookingForm.preferredDate,
          meetingType: bookingForm.meetingType,
          isIntroMeeting: false,
        })
        if (cancelled) return
        const d = response?.data || {}
        setBookingAvailability({
          unavailableTimes: d.unavailableTimes || [],
          availableTimes: Array.isArray(d.availableTimes) ? d.availableTimes : [],
          isDateUnavailable: Boolean(d.isDateUnavailable),
        })
      } catch (err) {
        console.error('Error loading booking availability:', err)
        if (!cancelled) {
          setBookingAvailabilityLoadError(true)
          setBookingAvailability({
            unavailableTimes: [],
            availableTimes: [],
            isDateUnavailable: false,
          })
        }
      } finally {
        if (!cancelled) setLoadingBookingAvailability(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookingForm.preferredDate, bookingForm.meetingType])

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingBooking(true)
    setBookingError('')

    if (bookingAvailabilityLoadError) {
      setBookingError('לא ניתן לטעון זמינות. נסה שוב או בחר תאריך אחר.')
      setIsSubmittingBooking(false)
      return
    }
    if (bookingAvailability.isDateUnavailable) {
      setBookingError('התאריך שבחרת אינו זמין. אנא בחר תאריך אחר.')
      setIsSubmittingBooking(false)
      return
    }
    if (bookingForm.preferredTime) {
      if (
        bookingAvailability.availableTimes.length === 0 ||
        !bookingAvailability.availableTimes.includes(bookingForm.preferredTime)
      ) {
        setBookingError('השעה שבחרת אינה זמינה. אנא בחר שעה אחרת.')
        setIsSubmittingBooking(false)
        return
      }
    }

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

  const handleCancelBooking = async (booking) => {
    const ok = window.confirm('האם לשלוח ביטול לפגישה זו?')
    if (!ok) return
    try {
      const res = await authService.cancelBooking(booking._id)
      toast.success(res?.message || 'הבקשה בוצעה בהצלחה')
      await loadCustomerData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה בביטול הפגישה')
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

  const hasAnyBooking = (customerData.bookings || []).some((b) => b.status !== 'cancelled')
  const shouldGateFirstBooking = !hasAnyBooking && !isFirstBookingUnlocked

  const activeCoachingPurchases = (customerData.purchases || []).filter((p) =>
    isCoachingCurrentlyActive(p, customerData)
  )

  const todayYmd = toDateInputYmd(new Date())
  const subForBooking = customerData.activeSubscription
  const bookingPreferredDateMin = subForBooking
    ? (() => {
        const start = toDateInputYmd(subForBooking.startedAt) || todayYmd
        return start > todayYmd ? start : todayYmd
      })()
    : todayYmd
  const bookingPreferredDateMax = subForBooking?.endsAt
    ? toDateInputYmd(subForBooking.endsAt)
    : ''

  const canBookRegular =
    customerData.bookingUnlimitedBySubscription === true ||
    customerData.availableSessions > 0
  const canManageReview = Boolean(reviewEligibility?.canSubmit)

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
              { id: 'trigger-journal', label: 'זיהוי ותיעוד' },
              { id: 'files', label: `קבצים (${nonAudioFiles.length})` },
              { id: 'audio', label: `אודיו (${audioOnlyFiles.length})` },
              { id: 'bookings', label: `פגישות (${customerData.bookings?.filter((b) => b.status !== 'completed').length || 0})` },
              { id: 'new-booking', label: 'קביעת פגישות' },
              { id: 'purchases', label: `רכישות (${customerData.purchases?.length || 0})` },
              { id: 'history', label: `היסטוריית פגישות (${customerData.bookings?.filter((b) => b.status === 'completed').length || 0})` },
              { id: 'questionnaire', label: 'שאלון ותקנון' },
              { id: 'messages', label: `הודעות (${messages.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                  tab.id === 'new-booking' && shouldGateFirstBooking
                    ? 'opacity-70 text-neutral-500'
                    : activeTab === tab.id
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

              {customerData.activeSubscription && (
                <Card className="border-2 border-primary-200 bg-primary-50/50">
                  <h3 className="text-xl font-semibold mb-3 text-primary-900">תהליך ליווי בתוקף</h3>
                  <p className="font-medium text-neutral-800">
                    {customerData.activeSubscription.planSnapshot?.title || 'מסלול'}
                  </p>
                  <p className="text-sm text-neutral-600 mt-2">
                    תקופת המנוי (ליווי וקביעת פגישות):{' '}
                    {new Date(customerData.activeSubscription.startedAt).toLocaleDateString(
                      'he-IL',
                      dateLongHe
                    )}
                    {' – '}
                    {new Date(customerData.activeSubscription.endsAt).toLocaleDateString(
                      'he-IL',
                      dateLongHe
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    פרטי המנוי נשמרו בעת הרכישה ואינם משתנים כשמעדכנים את המסלול במערכת.
                  </p>
                </Card>
              )}

              {customerData.subscriptionDisplay?.state === 'expired' &&
                customerData.subscriptionDisplay?.subscription && (
                <Card className="border-2 border-amber-200 bg-amber-50/60">
                  <h3 className="text-xl font-semibold mb-3 text-amber-900">תהליך ליווי — פג תוקף</h3>
                  <p className="font-medium text-neutral-800">
                    {customerData.subscriptionDisplay.subscription.planSnapshot?.title || 'מסלול'}
                  </p>
                  <p className="text-sm text-neutral-700 mt-2">
                    תקופת המנוי לפי המערכת (נשמר בבסיס הנתונים):{' '}
                    {new Date(
                      customerData.subscriptionDisplay.subscription.startedAt
                    ).toLocaleDateString('he-IL', dateLongHe)}
                    {' – '}
                    {new Date(
                      customerData.subscriptionDisplay.subscription.endsAt
                    ).toLocaleDateString('he-IL', dateLongHe)}
                  </p>
                  <p className="text-xs text-neutral-600 mt-2">
                    סטטוס במערכת:{' '}
                    <span className="font-medium">
                      {customerData.subscriptionDisplay.subscription.status === 'expired'
                        ? 'פג תוקף'
                        : customerData.subscriptionDisplay.subscription.status === 'cancelled'
                          ? 'בוטל'
                          : 'לא בתוקף'}
                    </span>
                    {customerData.subscriptionDisplay.subscription.status === 'active' && (
                      <> (תאריך הסיום עבר)</>
                    )}
                  </p>
                </Card>
              )}

              {customerData.subscriptionDisplay?.state !== 'active' &&
                customerData.subscriptionDisplay?.state !== 'expired' &&
                activeCoachingPurchases.length > 0 && (
                <Card className="border-2 border-primary-200 bg-primary-50/50">
                  <h3 className="text-xl font-semibold mb-3 text-primary-900">תהליך ליווי בתוקף</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    ללא רשומת מנוי במערכת — מוצג חלון ליווי לפי הגדרות המסלול והרכישה.
                  </p>
                  <ul className="space-y-3">
                    {activeCoachingPurchases.map((p) => {
                      const w = getCoachingWindow(p, customerData)
                      return (
                        <li key={p._id} className="text-neutral-800 border-b border-primary-100 last:border-0 pb-3 last:pb-0">
                          <p className="font-medium">{p.course?.title || 'מסלול'}</p>
                          {w && (
                            <p className="text-sm text-neutral-600 mt-1">
                              {w.start.toLocaleDateString('he-IL', dateShortHe)} –{' '}
                              {w.end.toLocaleDateString('he-IL', dateShortHe)}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </Card>
              )}

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
              {canManageReview && (
                <div className="p-3 rounded-lg border border-primary-200 bg-primary-50 text-primary-900">
                  <p className="text-sm">
                    יש ברשותך אפשרות להוסיף ביקורת. תדע/י שהוספת סרטון ביקורת נותן לך שבוע נוסף לאחר אישור המנהל.
                  </p>
                </div>
              )}
              <div className="flex gap-4 flex-wrap">
                {customerData.isAdmin ? (
                  <Button onClick={handleGoToAdmin} variant="primary">
                    כניסה לפלטפורמת מנהל
                  </Button>
                ) : null}
                <Button
                  onClick={() => navigate('/customer/change-password')}
                  variant="soft"
                >
                  שנה סיסמה
                </Button>
                {canManageReview && (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    variant="primary"
                  >
                    {myReview ? 'ערוך ביקורת' : 'הוסף ביקורת'}
                  </Button>
                )}
                {!canManageReview && reviewEligibility?.message && (
                  <p className="text-sm text-neutral-500 self-center">{reviewEligibility.message}</p>
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


          {/* Questionnaire Tab */}
          {activeTab === 'questionnaire' && (
            <div className="space-y-4">
              <RegulationsQuestionnaireTab
                regulationsQuestionnaire={customerData.regulationsQuestionnaire}
              />
            </div>
          )}

          {activeTab === 'trigger-journal' && <TriggerJournalSection />}

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
                          תאריך רכישה:{' '}
                          {purchaseDisplayDate(purchase)?.toLocaleDateString('he-IL', dateLongHe) ?? '—'}
                        </p>
                        {(() => {
                          const period = getCoachingPeriodForPurchaseDisplay(purchase, customerData)
                          if (period) {
                            return (
                              <div className="mt-2">
                                <p className="text-sm text-neutral-700 font-medium">
                                  תקופת ליווי: {period.start.toLocaleDateString('he-IL', dateShortHe)} –{' '}
                                  {period.end.toLocaleDateString('he-IL', dateShortHe)}
                                </p>
                                {period.source === 'subscription' && !period.expired && (
                                  <p className="text-xs text-neutral-500 mt-1">
                                    לפי מנוי פעיל (תואם לזכאות לקביעת פגישות)
                                  </p>
                                )}
                                {period.source === 'subscription' && period.expired && (
                                  <p className="text-xs text-amber-700 mt-1">
                                    לפי רשומת המנוי בבסיס הנתונים — פג תוקף (ללא זכאות לפגישות לפי מנוי)
                                  </p>
                                )}
                                {period.source === 'derived' && period.derived && (
                                  <p className="text-xs text-neutral-500 mt-1">
                                    מחושב לפי תאריך פתיחת התיק או תאריך החיוב ומשך המסלול במערכת
                                  </p>
                                )}
                              </div>
                            )
                          }
                          if (purchase.course?.coachingProcessMonths) {
                            return (
                              <p className="text-sm text-neutral-600 mt-2">
                                משך ליווי במסלול: {purchase.course.coachingProcessMonths} חודשים (חסר תאריך בסיס
                                לחישוב טווח)
                              </p>
                            )
                          }
                          return (
                            <p className="text-sm text-neutral-500 mt-2">
                              תקופת הליווי תופיע כאן כשהמנהל יגדיר תאריכי התחלה וסיום או משך ליווי למסלול.
                            </p>
                          )
                        })()}
                        {purchase.course?.installmentsCount != null && purchase.course.installmentsCount >= 1 && (
                          <p className="text-sm text-neutral-600 mt-1">
                            {purchase.course.installmentsCount}{' '}
                            {purchase.course.installmentsCount === 1 ? 'תשלום' : 'תשלומים'}
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
                          {booking.meetingType === 'zoom' ? '💻 אונליין' : '🏢 פרונטאלי'}
                          {booking.isIntroMeeting && ' | ⭐ פגישת היכרות'}
                        </p>
                        {booking.preferredTime && (
                          <p className="text-sm text-neutral-600 mt-1">
                            🕐 שעה: {booking.preferredTime}
                          </p>
                        )}
                        <p className="text-xs text-amber-700 mt-2">
                          נא להודיע על ביטול עד 24 שעות לפני מועד הפגישה
                        </p>
                        {booking.meetingType === 'zoom' && booking.zoomLink && (
                          <div className="mt-2">
                            <a
                              href={booking.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
                            >
                              🔗 לינק אונליין
                              <span className="text-xs">(פתח בחדש)</span>
                            </a>
                          </div>
                        )}
                        {booking.meetingType === 'zoom' && !booking.zoomLink && (
                          <p className="text-xs text-neutral-500 mt-2 italic">
                            קישור אונליין יישלח בהמשך
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
                        booking.status === 'cancellation_requested' ? 'bg-orange-100 text-orange-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {booking.status === 'confirmed' ? 'אושר' :
                         booking.status === 'cancellation_requested' ? 'בקשת ביטול' :
                         booking.status === 'completed' ? 'בוצע' :
                         booking.status === 'cancelled' ? 'בוטל' :
                         'ממתין'}
                      </span>
                    </div>
                    {['pending', 'confirmed'].includes(booking.status) && (() => {
                      const hoursUntil = (getBookingDateTime(booking).getTime() - Date.now()) / (1000 * 60 * 60)
                      const isLate = hoursUntil < 24
                      return (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant={isLate ? 'soft' : 'danger'}
                            className="text-sm"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            {isLate ? 'בקשת ביטול' : 'ביטול פגישה'}
                          </Button>
                          {isLate && (
                            <p className="text-xs text-neutral-500 mt-2">
                              פחות מ-24 שעות לפגישה — נשלחת בקשת ביטול לאישור מנהל.
                            </p>
                          )}
                        </div>
                      )
                    })()}
                    {booking.status === 'cancellation_requested' && (
                      <p className="text-xs text-neutral-500 mt-3">
                        בקשת הביטול נשלחה וממתינה לאישור מנהל.
                      </p>
                    )}
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
                          {booking.meetingType === 'zoom' ? '💻 אונליין' : '🏢 פרונטאלי'}
                          {booking.isIntroMeeting && ' | ⭐ פגישת היכרות'}
                        </p>
                        {booking.preferredTime && (
                          <p className="text-sm text-neutral-600 mt-1">
                            🕐 שעה: {booking.preferredTime}
                          </p>
                        )}
                        <p className="text-xs text-amber-700 mt-2">
                          נא להודיע על ביטול עד 24 שעות לפני מועד הפגישה
                        </p>
                        {booking.meetingType === 'zoom' && booking.zoomLink && (
                          <div className="mt-2">
                            <a
                              href={booking.zoomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
                            >
                              🔗 לינק אונליין
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
                            {message.channels.includes('system') && '💬 מערכת'}
                            {message.channels.includes('system') && message.channels.includes('email') && ' • '}
                            {message.channels.includes('email') && '📧 אימייל'}
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
                
                {shouldGateFirstBooking ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                      <p className="text-yellow-800 font-medium mb-1">לפני קביעת הפגישה הראשונה צריך למלא תקנון ושאלון.</p>
                      <p className="text-yellow-700 text-sm">רק לאחר מילוי השאלון ניתן לשלוח בקשה לקביעת פגישה.</p>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setIsRegulationsModalOpen(true)}
                    >
                      פתיחת תקנון ושאלון
                    </Button>
                  </div>
                ) : canBookRegular ? (
                  <>
                    <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-primary-800 font-medium">
                        {customerData.bookingUnlimitedBySubscription &&
                        customerData.sessionEntitlementSource === 'subscription' &&
                        customerData.activeSubscription
                          ? 'מנוי פעיל — ניתן לקבוע פגישות לפי תאריכי המנוי (ללא הגבלת מספר מפגשים).'
                          : `יש לך ${customerData.availableSessions} מפגשים זמינים מתוך ${customerData.totalSessionsPurchased || 0} שנרכשו`}
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
                              onChange={(e) =>
                                setBookingForm({
                                  ...bookingForm,
                                  meetingType: e.target.value,
                                  preferredTime: '',
                                })
                              }
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
                              onChange={(e) =>
                                setBookingForm({
                                  ...bookingForm,
                                  meetingType: e.target.value,
                                  preferredTime: '',
                                })
                              }
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
                                <div className="font-medium text-neutral-900">פגישה באונליין</div>
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
                            onChange={(e) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                preferredDate: e.target.value,
                                preferredTime: '',
                              }))
                            }
                            min={bookingPreferredDateMin}
                            max={bookingPreferredDateMax || undefined}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          />
                          {loadingBookingAvailability && (
                            <p className="text-xs text-neutral-500 mt-2">בודק זמינות...</p>
                          )}
                          {!loadingBookingAvailability &&
                            bookingAvailabilityLoadError &&
                            bookingForm.preferredDate && (
                              <p className="text-xs text-red-500 mt-2">
                                שגיאה בטעינת זמינות. נסה לבחור תאריך מחדש.
                              </p>
                            )}
                          {!loadingBookingAvailability && bookingAvailability.isDateUnavailable && (
                            <p className="text-xs text-red-500 mt-2">התאריך אינו זמין. אנא בחר תאריך אחר.</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="preferredTime" className="block text-sm font-medium text-neutral-700 mb-2">
                            שעה מועדפת
                          </label>
                          <select
                            id="preferredTime"
                            value={bookingForm.preferredTime}
                            onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                            disabled={
                              loadingBookingAvailability ||
                              bookingAvailabilityLoadError ||
                              bookingAvailability.isDateUnavailable ||
                              !bookingForm.preferredDate
                            }
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-60"
                          >
                            <option value="">
                              {loadingBookingAvailability && bookingForm.preferredDate
                                ? 'טוען שעות…'
                                : bookingAvailabilityLoadError
                                  ? 'לא ניתן לטעון שעות'
                                  : bookingAvailability.isDateUnavailable
                                    ? 'אין שעות זמינות'
                                    : !bookingForm.preferredDate
                                      ? 'בחר תאריך תחילה'
                                      : bookingAvailability.availableTimes.length === 0
                                        ? 'אין חלונות פנויים'
                                        : 'בחר שעה'}
                            </option>
                            {(bookingAvailability.isDateUnavailable || bookingAvailabilityLoadError
                              ? []
                              : bookingAvailability.availableTimes
                            ).map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                          {!loadingBookingAvailability &&
                            bookingForm.preferredDate &&
                            !bookingAvailability.isDateUnavailable &&
                            bookingAvailability.availableTimes.length === 0 && (
                              <p className="text-xs text-neutral-500 mt-2">
                                אין חלונות פנויים לתאריך זה. נסה תאריך אחר.
                              </p>
                            )}
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
                          placeholder="האם יש מידע נוסף שתרצו לשתף כהכנה למפגש ?"
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
                    <p className="text-yellow-800 font-medium mb-4">אין לך מפגשים זמינים</p>
                    <p className="text-yellow-700 mb-4">
                      על מנת לקבוע פגישה, נא לרכוש מסלול טיפול או לפנות למנהל.
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
              {nonAudioFiles.length > 0 ? (
                nonAudioFiles.map((file) => (
                  <Card key={file._id}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{file.name}</h4>
                    </div>
                    {file.description && (
                      <p className="text-sm text-neutral-600 mb-2">{file.description}</p>
                    )}
                    <a
                      href={resolveCustomerUploadUrl(file.url)}
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

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <Card className="border border-neutral-200 bg-neutral-50/50">
                <p className="text-sm text-neutral-700">
                  כאן מוצגים קבצי אודיו שהועלו עבורך מהמטפל. ניתן להאזין בלבד — לא ניתן להעלות קבצים מכאן.
                </p>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audioOnlyFiles.length > 0 ? (
                  audioOnlyFiles.map((file) => (
                    <Card key={file._id}>
                      <h4 className="font-semibold text-neutral-900 mb-2">{file.name}</h4>
                      {file.description && (
                        <p className="text-sm text-neutral-600 mb-3">{file.description}</p>
                      )}
                      <audio
                        className="w-full"
                        controls
                        preload="metadata"
                        src={resolveCustomerUploadUrl(file.url)}
                      >
                        הדפדפן שלך לא תומך בהשמעת אודיו.
                      </audio>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full md:col-span-2">
                    <p className="text-center text-neutral-500 py-8">אין הודעות אודיו כרגע</p>
                  </Card>
                )}
              </div>
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
              if (isUploadingReviewVideo) {
                toast.error('אנא המתן לסיום העלאת הסרטון לפני שליחת חוות הדעת')
                return
              }
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
                await loadCustomerData()
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  סרטון חוות דעת (אופציונלי)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingReviewVideo || isSubmittingReview}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setIsUploadingReviewVideo(true)
                        const uploaded = await reviewsService.uploadVideo(file)
                        setReviewForm((prev) => ({ ...prev, video: uploaded?.data || null }))
                        toast.success('הסרטון הועלה בהצלחה')
                      } catch (error) {
                        toast.error(error.response?.data?.message || 'שגיאה בהעלאת הסרטון')
                      } finally {
                        setIsUploadingReviewVideo(false)
                        e.target.value = ''
                      }
                    }}
                    className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-4 file:py-2 file:text-primary-700 hover:file:bg-primary-200"
                  />
                  {isUploadingReviewVideo && (
                    <p className="text-xs text-neutral-500">מעלה סרטון...</p>
                  )}
                </div>
                {reviewForm.video?.url && (
                  <div className="mt-3 space-y-2">
                    <video
                      src={reviewForm.video.url}
                      controls
                      className="w-full max-h-56 rounded-lg border border-neutral-200"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-500">
                        {reviewForm.video.name || 'סרטון הועלה'}
                      </p>
                      <Button
                        type="button"
                        variant="soft"
                        className="text-xs"
                        onClick={() => setReviewForm((prev) => ({ ...prev, video: null }))}
                      >
                        הסר סרטון
                      </Button>
                    </div>
                    <p className="text-xs text-primary-700">
                      העלאת סרטון מזכה בשבוע נוסף למנוי לאחר אישור הביקורת על ידי המנהל.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button type="submit" variant="primary" disabled={isSubmittingReview || isUploadingReviewVideo}>
                  {isUploadingReviewVideo ? 'מעלה סרטון...' : isSubmittingReview ? 'שולח...' : (myReview ? 'עדכן ביקורת' : 'שלח ביקורת')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false)
                    if (!myReview) {
                      setReviewForm({ rating: 0, content: '', video: null })
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

      <RegulationsQuestionnaireModal
        isOpen={isRegulationsModalOpen}
        onClose={() => setIsRegulationsModalOpen(false)}
        customerId={customerData?._id}
        onCompleted={() => {
          setIsFirstBookingUnlocked(true)
          setIsRegulationsModalOpen(false)
        }}
      />
    </>
  )
}

export default CustomerProfilePage

