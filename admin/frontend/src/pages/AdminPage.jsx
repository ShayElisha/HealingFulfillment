import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  categoryService,
  courseService,
  purchaseService,
  bookingService,
  availabilityPreviewService,
} from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Section from '../components/Section'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import { useNavCounts } from '../context/NavCountsContext'
import { triggerConfetti } from '../utils/confetti'
import BookingCard from '../components/admin/BookingCard'
import {
  formatCourseCoachingLine,
  effectiveCoachingMonthsForForm,
  courseTimelineLabelForSelect,
} from '../utils/courseCoaching'
import toast from 'react-hot-toast'

const DEFAULT_COACHING_MONTHS = 3

const ADMIN_SECTION_PATHS = {
  '/categories': 'categories',
  '/courses': 'courses',
  '/purchase': 'purchase',
  '/new-booking': 'new-booking'
}

function AdminPage() {
  const { refreshNavCounts } = useNavCounts()
  const navigate = useNavigate()
  const location = useLocation()
  const section = useMemo(() => ADMIN_SECTION_PATHS[location.pathname] || 'categories', [location.pathname])
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [purchases, setPurchases] = useState([])
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    symptoms: [],
    copingMethods: [],
    therapeuticApproach: [],
    order: 0,
    isActive: true,
    purchaseCTA: 'מוכן להתחיל את המסע? קבע פגישה או רכוש את המסלול המלא',
    videos: [],
    files: []
  })
  
  const [newSymptom, setNewSymptom] = useState('')
  const [newCopingMethod, setNewCopingMethod] = useState('')
  const [newTherapeuticApproach, setNewTherapeuticApproach] = useState('')

  const [newCategoryVideo, setNewCategoryVideo] = useState({
    title: '',
    url: '',
    description: ''
  })

  const [courseForm, setCourseForm] = useState(() => ({
    title: '',
    description: '',
    price: 0,
    discount: 0,
    installmentsCount: 1,
    isActive: true,
    videos: [],
    coachingProcessMonths: DEFAULT_COACHING_MONTHS
  }))

  const [purchaseForm, setPurchaseForm] = useState({
    courseId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentProvider: 'manual',
    paymentMethod: 'other',
    notes: '',
    status: 'pending'
  })

  const [bookingForm, setBookingForm] = useState({
    customerId: '', // לקוח קיים או ריק לאדם חדש
    name: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    meetingType: 'frontend',
    notes: '',
    status: 'pending',
    isIntroMeeting: false // false = פגישה רגילה, true = פגישת היכרות
  })

  const [adminBookingAvailability, setAdminBookingAvailability] = useState({
    availableTimes: [],
    isDateUnavailable: false,
  })
  const [loadingAdminBookingAvailability, setLoadingAdminBookingAvailability] = useState(false)
  const [adminBookingAvailabilityError, setAdminBookingAvailabilityError] = useState(false)

  useEffect(() => {
    if (!bookingForm.preferredDate) {
      setAdminBookingAvailabilityError(false)
      setAdminBookingAvailability({ availableTimes: [], isDateUnavailable: false })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoadingAdminBookingAvailability(true)
        setAdminBookingAvailabilityError(false)
        const res = await availabilityPreviewService.getDay({
          date: bookingForm.preferredDate,
          meetingType: bookingForm.meetingType,
          isIntroMeeting: bookingForm.isIntroMeeting,
        })
        if (cancelled) return
        const d = res?.data || {}
        if (d.error) {
          setAdminBookingAvailability({ availableTimes: [], isDateUnavailable: true })
          return
        }
        setAdminBookingAvailability({
          availableTimes: Array.isArray(d.availableTimes) ? d.availableTimes : [],
          isDateUnavailable: Boolean(d.isDateUnavailable),
        })
      } catch (err) {
        console.error('Admin availability preview:', err)
        if (!cancelled) {
          setAdminBookingAvailabilityError(true)
          setAdminBookingAvailability({ availableTimes: [], isDateUnavailable: false })
        }
      } finally {
        if (!cancelled) setLoadingAdminBookingAvailability(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookingForm.preferredDate, bookingForm.meetingType, bookingForm.isIntroMeeting])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const lowProfileCode = searchParams.get('lowprofilecode') || searchParams.get('LowProfileCode')
    const orderId = searchParams.get('orderId')
    const cardcomFlag = searchParams.get('cardcom')
    if (!orderId || !lowProfileCode) {
      if (cardcomFlag === 'failed') {
        toast.error('התשלום ב-Cardcom לא הושלם')
      }
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await purchaseService.confirmFromRedirect({ orderId, lowProfileCode })
        if (!cancelled) {
          toast.success('התשלום אושר בהצלחה')
          await loadData()
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
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab')
    const legacyRoutes = {
      categories: '/categories',
      courses: '/courses',
      purchase: '/purchase',
      'new-booking': '/new-booking'
    }
    const target = tab && legacyRoutes[tab]
    if (!target) return
    if (location.pathname !== target) {
      navigate(target, { replace: true })
      return
    }
    const sp = new URLSearchParams(location.search)
    if (sp.has('tab')) {
      sp.delete('tab')
      const qs = sp.toString()
      navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  const loadData = async (retryCount = 0) => {
    setLoading(true)
    try {
      const [categoriesRes, coursesRes, purchasesRes, bookingsRes, customersRes] = await Promise.all([
        categoryService.getAll(),
        courseService.getAll(),
        purchaseService.getAll(),
        bookingService.getAll(),
        customerService.getAll()
      ])
      
      // Debug logging
      console.log('AdminPage - Raw responses:', {
        categoriesRes,
        coursesRes,
        purchasesRes,
        bookingsRes,
        customersRes
      })
      
      // API returns { message, data }, and adminApi already extracts response.data from axios
      // So categoriesRes is already { message, data } (the parsed JSON response)
      // We need to extract the 'data' property from each response
      
      // Helper function to safely extract array data
      const extractDataArray = (response) => {
        if (!response) return []
        
        // If response is already an array, return it
        if (Array.isArray(response)) {
          return response
        }
        
        // If response has a 'data' property that is an array, return it
        if (response.data && Array.isArray(response.data)) {
          return response.data
        }
        
        // If response.data exists but is not an array, wrap it
        if (response.data && !Array.isArray(response.data)) {
          console.warn('AdminPage: Expected array but got object:', response.data)
          return []
        }
        
        // Fallback: return empty array
        return []
      }
      
      const categoriesData = extractDataArray(categoriesRes)
      const coursesData = extractDataArray(coursesRes)
      const purchasesData = extractDataArray(purchasesRes)
      const bookingsData = extractDataArray(bookingsRes)
      const customersData = extractDataArray(customersRes)
      
      console.log('AdminPage - Extracted data:', {
        categoriesData: { count: categoriesData.length, type: typeof categoriesData, isArray: Array.isArray(categoriesData) },
        coursesData: { count: coursesData.length, type: typeof coursesData, isArray: Array.isArray(coursesData), sample: coursesData[0] },
        purchasesData: { count: purchasesData.length, type: typeof purchasesData, isArray: Array.isArray(purchasesData) },
        bookingsData: { count: bookingsData.length, type: typeof bookingsData, isArray: Array.isArray(bookingsData) },
        customersData: { count: customersData.length, type: typeof customersData, isArray: Array.isArray(customersData) }
      })
      
      setCategories(categoriesData)
      setCourses(coursesData)
      setPurchases(purchasesData)
      setBookings(bookingsData)
      setCustomers(customersData)
      await refreshNavCounts()
    } catch (error) {
      console.error('Error loading data:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      // Handle rate limiting (429) with retry
      if (error.response?.status === 429 && retryCount < 2) {
        const retryAfter = error.response?.headers?.['retry-after'] || 2
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`)
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        return loadData(retryCount + 1)
      }
      
      const errorMessage = error.response?.status === 429 
        ? 'יותר מדי בקשות. אנא נסה שוב בעוד כמה רגעים.'
        : error.message || 'שגיאה לא ידועה'
      
      toast.error(`שגיאה בטעינת הנתונים: ${errorMessage}`)
      // Set empty arrays on error to prevent crashes
      setCategories([])
      setCourses([])
      setPurchases([])
      setBookings([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory._id, categoryForm)
      } else {
        await categoryService.create(categoryForm)
        triggerConfetti()
      }
      await loadData()
      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        description: '',
        order: 0,
        isActive: true,
        purchaseCTA: 'מוכן להתחיל את המסע? קבע פגישה או רכוש את המסלול המלא',
        videos: [],
        files: []
      })
      setNewCategoryVideo({ title: '', url: '', description: '' })
    } catch (error) {
      console.error('Error saving category:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          error.message || 
                          'שגיאה בשמירת הקטגוריה'
      toast.error(`שגיאה בשמירת הקטגוריה: ${errorMessage}`)
    }
  }

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    try {
      const months = Math.min(60, Math.max(1, parseInt(courseForm.coachingProcessMonths, 10) || DEFAULT_COACHING_MONTHS))
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        price: courseForm.price,
        discount: courseForm.discount,
        installmentsCount: courseForm.installmentsCount,
        isActive: courseForm.isActive,
        videos: courseForm.videos || [],
        coachingProcessMonths: months
      }
      if (editingCourse) {
        await courseService.update(editingCourse._id, payload)
      } else {
        await courseService.create(payload)
        triggerConfetti()
      }
      await loadData()
      setShowCourseForm(false)
      setEditingCourse(null)
      setCourseForm({
        title: '',
        description: '',
        price: 0,
        discount: 0,
        installmentsCount: 1,
        isActive: true,
        videos: [],
        coachingProcessMonths: DEFAULT_COACHING_MONTHS
      })
    } catch (error) {
      console.error('Error saving course:', error)
      toast.error('שגיאה בשמירת המסלול')
    }
  }

  const handleDeleteCategory = async (id) => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו? כל המסלולים בקטגוריה זו יימחקו גם כן.')
    if (!confirmed) {
      return
    }
    try {
      await categoryService.delete(id)
      await loadData()
      toast.success('קטגוריה נמחקה בהצלחה!')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('שגיאה במחיקת הקטגוריה')
    }
  }

  const handleDeleteCourse = async (id) => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק מסלול זה?')
    if (!confirmed) {
      return
    }
    try {
      await courseService.delete(id)
      await loadData()
      toast.success('מסלול נמחק בהצלחה!')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('שגיאה במחיקת המסלול')
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      symptoms: category.symptoms || [],
      copingMethods: category.copingMethods || [],
      therapeuticApproach: category.therapeuticApproach || [],
      order: category.order || 0,
      isActive: category.isActive !== false,
      purchaseCTA: category.purchaseCTA || 'מוכן להתחיל את המסע? קבע פגישה או רכוש את המסלול המלא',
      videos: category.videos || [],
      files: category.files || []
    })
    setNewSymptom('')
    setNewCopingMethod('')
    setNewTherapeuticApproach('')
    setShowCategoryForm(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('אנא העלה קובץ וידאו בלבד (MP4, MOV, AVI וכו\')')
      e.target.value = ''
      return
    }

    try {
      // העלאת וידאו ל-Cloudinary דרך /api/upload
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to upload file')
      }

      const result = await response.json()
      const uploadedFile = result.data

      const fileUrl =
        typeof uploadedFile.url === 'string' && uploadedFile.url.startsWith('http')
          ? uploadedFile.url
          : `${window.location.origin}${uploadedFile.url}`

      const newFile = {
        name: uploadedFile.name,
        url: fileUrl,
        type: 'video', // וידאו מ-Cloudinary
        size: uploadedFile.size
      }

      setCategoryForm({
        ...categoryForm,
        files: [...(categoryForm.files || []), newFile]
      })

      // Reset input
      e.target.value = ''
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(`שגיאה בהעלאת הקובץ: ${error.message}. אנא נסה שוב.`)
    }
  }

  const removeFileFromCategory = (index) => {
    setCategoryForm({
      ...categoryForm,
      files: (categoryForm.files || []).filter((_, i) => i !== index)
    })
  }

  const addVideoToCategory = () => {
    if (!newCategoryVideo.title || !newCategoryVideo.url) {
      toast.error('אנא מלא כותרת וקישור לסרטון')
      return
    }
    setCategoryForm({
      ...categoryForm,
      videos: [...categoryForm.videos, { ...newCategoryVideo, order: categoryForm.videos.length }]
    })
    setNewCategoryVideo({ title: '', url: '', description: '' })
  }

  const removeVideoFromCategory = (index) => {
    setCategoryForm({
      ...categoryForm,
      videos: categoryForm.videos.filter((_, i) => i !== index)
    })
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      description: course.description || '',
      price: course.price || 0,
      discount: course.discount || 0,
      installmentsCount: course.installmentsCount ?? 1,
      isActive: course.isActive !== false,
      videos: course.videos || [],
      coachingProcessMonths: effectiveCoachingMonthsForForm(course)
    })
    setShowCourseForm(true)
  }

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    try {
      const isCardcomPurchase = purchaseForm.paymentProvider === 'cardcom'
      if (isCardcomPurchase) {
        const res = await purchaseService.createCheckout({
          courseId: purchaseForm.courseId,
          customerName: purchaseForm.customerName,
          customerEmail: purchaseForm.customerEmail,
          customerPhone: purchaseForm.customerPhone,
          paymentMethod: 'credit_card',
          notes: purchaseForm.notes,
        })
        const checkoutUrl = res?.data?.checkoutUrl
        if (!checkoutUrl) throw new Error('לא התקבל קישור לתשלום')
        window.location.href = checkoutUrl
        return
      }

      await purchaseService.create(purchaseForm)
      triggerConfetti()
      await loadData()
      setPurchaseForm({
        courseId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        paymentProvider: 'manual',
        paymentMethod: 'other',
        notes: '',
        status: 'pending'
      })
      toast.success('רכישה נוצרה בהצלחה!' + (purchaseForm.status === 'completed' ? ' הכנסה נוצרה אוטומטית.' : ''))
      // ברכישה ידנית נשארים מחוברים ומתקדמים אוטומטית לרשימת לקוחות
      navigate('/customers')
    } catch (error) {
      console.error('Error creating purchase:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          error.message || 
                          'שגיאה ביצירת הרכישה'
      toast.error(`שגיאה ביצירת הרכישה: ${errorMessage}`)
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    try {
      // בדיקות תקינות בסיסיות
      if (!bookingForm.name || !bookingForm.name.trim()) {
        toast.error('אנא הכנס שם מלא')
        return
      }
      if (!bookingForm.phone || !bookingForm.phone.trim()) {
        toast.error('אנא הכנס מספר טלפון')
        return
      }
      if (!bookingForm.preferredDate) {
        toast.error('אנא בחר תאריך מועדף')
        return
      }

      if (adminBookingAvailabilityError) {
        toast.error('לא ניתן לטעון זמינות. נסה שוב או בחר תאריך אחר.')
        return
      }
      if (adminBookingAvailability.isDateUnavailable) {
        toast.error('התאריך שבחרת אינו זמין לפי מערכת הזמינות.')
        return
      }
      if (bookingForm.preferredTime) {
        if (
          adminBookingAvailability.availableTimes.length === 0 ||
          !adminBookingAvailability.availableTimes.includes(bookingForm.preferredTime)
        ) {
          toast.error('השעה שבחרת אינה זמינה. בחר שעה מהרשימה.')
          return
        }
      }

      // אם נבחר לקוח קיים, השתמש בפרטיו
      let bookingData = { ...bookingForm }
      
      if (bookingForm.customerId && Array.isArray(customers) && customers.length > 0) {
        const selectedCustomer = customers.find(c => c._id === bookingForm.customerId)
        if (selectedCustomer) {
          bookingData.name = selectedCustomer.name || bookingData.name
          bookingData.phone = selectedCustomer.phone || bookingData.phone
          bookingData.email = selectedCustomer.email || bookingData.email || ''
        }
      }

      // הסר את customerId ו-status מהנתונים שנשלחים
      const { customerId, status, ...bookingPayload } = bookingData
      
      // ודא ש-preferredDate הוא Date object
      if (bookingPayload.preferredDate) {
        bookingPayload.preferredDate = new Date(bookingPayload.preferredDate)
      }
      
      console.log('Sending booking data:', bookingPayload)
      await bookingService.create(bookingPayload)
      triggerConfetti()
      await loadData()
      setBookingForm({
        customerId: '',
        name: '',
        phone: '',
        email: '',
        preferredDate: '',
        preferredTime: '',
        meetingType: 'frontend',
        notes: '',
        status: 'pending',
        isIntroMeeting: false
      })
      toast.success('פגישה נוצרה בהצלחה!')
    } catch (error) {
      console.error('Error creating booking:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.errors && Array.isArray(error.response.data.errors) 
                            ? error.response.data.errors.map(e => e.message || e).join(', ')
                            : '') ||
                          error.message || 
                          'שגיאה ביצירת הפגישה'
      toast.error(`שגיאה ביצירת הפגישה: ${errorMessage}`)
    }
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <AdminPageShell>

          {/* Categories */}
          {section === 'categories' && (
            <div>
              <PageHeader
                title="טיפולים"
                subtitle={`${categories.length} טיפולים זמינים`}
                backTo={null}
                actions={
                  <Button
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryForm({
                        name: '',
                        description: '',
                        symptoms: [],
                        copingMethods: [],
                        therapeuticApproach: [],
                        order: 0,
                        isActive: true,
                        purchaseCTA: 'מוכן להתחיל את המסע? קבע פגישה או רכוש את המסלול המלא',
                        videos: [],
                        files: []
                      })
                      setNewCategoryVideo({ title: '', url: '', description: '' })
                      setNewSymptom('')
                      setNewCopingMethod('')
                      setShowCategoryForm(true)
                    }}
                    variant="primary"
                  >
                    + הוסף טיפול
                  </Button>
                }
              />

              {showCategoryForm && (
                <Card className="mb-8 border-2 border-primary-100">
                  <h3 className="text-2xl font-serif font-semibold mb-6 text-neutral-900">
                    {editingCategory ? 'ערוך טיפול' : 'טיפול חדש'}
                  </h3>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">שם הטיפול *</label>
                      <input
                        type="text"
                        required
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                        placeholder="לדוגמה: טיפול בחרדות"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">תיאור</label>
                      <textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none"
                        placeholder="תיאור כללי של הטיפול"
                      />
                    </div>
                    
                    {/* Symptoms Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2">סימפטומים</label>
                      <div className="space-y-2 mb-3">
                        {categoryForm.symptoms.map((symptom, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                            <span className="flex-1">• {symptom}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSymptoms = categoryForm.symptoms.filter((_, i) => i !== index)
                                setCategoryForm({ ...categoryForm, symptoms: newSymptoms })
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              מחק
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSymptom}
                          onChange={(e) => setNewSymptom(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (newSymptom.trim()) {
                                setCategoryForm({
                                  ...categoryForm,
                                  symptoms: [...categoryForm.symptoms, newSymptom.trim()]
                                })
                                setNewSymptom('')
                              }
                            }
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-neutral-300"
                          placeholder="הוסף סימפטום ולחץ Enter"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (newSymptom.trim()) {
                              setCategoryForm({
                                ...categoryForm,
                                symptoms: [...categoryForm.symptoms, newSymptom.trim()]
                              })
                              setNewSymptom('')
                            }
                          }}
                        >
                          הוסף
                        </Button>
                      </div>
                    </div>

                    {/* Coping Methods Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2">דרכי התמודדות</label>
                      <div className="space-y-2 mb-3">
                        {categoryForm.copingMethods.map((method, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                            <span className="flex-1">• {method}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newMethods = categoryForm.copingMethods.filter((_, i) => i !== index)
                                setCategoryForm({ ...categoryForm, copingMethods: newMethods })
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              מחק
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCopingMethod}
                          onChange={(e) => setNewCopingMethod(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (newCopingMethod.trim()) {
                                setCategoryForm({
                                  ...categoryForm,
                                  copingMethods: [...categoryForm.copingMethods, newCopingMethod.trim()]
                                })
                                setNewCopingMethod('')
                              }
                            }
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-neutral-300"
                          placeholder="הוסף דרך התמודדות ולחץ Enter"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (newCopingMethod.trim()) {
                              setCategoryForm({
                                ...categoryForm,
                                copingMethods: [...categoryForm.copingMethods, newCopingMethod.trim()]
                              })
                              setNewCopingMethod('')
                            }
                          }}
                        >
                          הוסף
                        </Button>
                      </div>
                    </div>

                    {/* Therapeutic Approach Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2">הגישה הטיפולית שלי</label>
                      <div className="space-y-2 mb-3">
                        {categoryForm.therapeuticApproach.map((approach, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                            <span className="flex-1">• {approach}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newApproach = categoryForm.therapeuticApproach.filter((_, i) => i !== index)
                                setCategoryForm({ ...categoryForm, therapeuticApproach: newApproach })
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              מחק
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTherapeuticApproach}
                          onChange={(e) => setNewTherapeuticApproach(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (newTherapeuticApproach.trim()) {
                                setCategoryForm({
                                  ...categoryForm,
                                  therapeuticApproach: [...categoryForm.therapeuticApproach, newTherapeuticApproach.trim()]
                                })
                                setNewTherapeuticApproach('')
                              }
                            }
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-neutral-300"
                          placeholder="הוסף נקודה לגישה הטיפולית ולחץ Enter"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (newTherapeuticApproach.trim()) {
                              setCategoryForm({
                                ...categoryForm,
                                therapeuticApproach: [...categoryForm.therapeuticApproach, newTherapeuticApproach.trim()]
                              })
                              setNewTherapeuticApproach('')
                            }
                          }}
                        >
                          הוסף
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">סדר תצוגה</label>
                      <input
                        type="number"
                        value={categoryForm.order}
                        onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">משפט קריאה לפעולה</label>
                      <textarea
                        value={categoryForm.purchaseCTA}
                        onChange={(e) => setCategoryForm({ ...categoryForm, purchaseCTA: e.target.value })}
                        rows="2"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                        placeholder="מוכן להתחיל את המסע? קבע פגישה או רכוש את המסלול המלא"
                      />
                    </div>

                    {/* Videos Section for Category */}
                    <div>
                      <label className="block text-sm font-medium mb-2">סרטונים בקטגוריה</label>
                      <div className="space-y-4 mb-4">
                        {categoryForm.videos.map((video, index) => (
                          <div key={index} className="p-4 bg-neutral-50 rounded-lg flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{video.title}</p>
                              {video.description && (
                                <p className="text-sm text-neutral-600">{video.description}</p>
                              )}
                              <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600">
                                {video.url}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideoFromCategory(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              מחק
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="border border-neutral-300 rounded-lg p-4 space-y-3">
                        <input
                          type="text"
                          placeholder="כותרת הסרטון *"
                          value={newCategoryVideo.title}
                          onChange={(e) => setNewCategoryVideo({ ...newCategoryVideo, title: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                        />
                        <input
                          type="url"
                          placeholder="קישור לסרטון (YouTube/Vimeo/URL) *"
                          value={newCategoryVideo.url}
                          onChange={(e) => setNewCategoryVideo({ ...newCategoryVideo, url: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                        />
                        <textarea
                          placeholder="תיאור (אופציונלי)"
                          value={newCategoryVideo.description}
                          onChange={(e) => setNewCategoryVideo({ ...newCategoryVideo, description: e.target.value })}
                          rows="2"
                          className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={addVideoToCategory}
                          className="w-full"
                        >
                          הוסף סרטון לקטגוריה
                        </Button>
                      </div>
                    </div>

                    {/* Files Section for Category */}
                    <div>
                      <label className="block text-sm font-medium mb-2">קבצים בקטגוריה</label>
                      <div className="space-y-4 mb-4">
                        {(categoryForm.files || []).map((file, index) => (
                          <div key={index} className="p-4 bg-neutral-50 rounded-lg flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{file.name}</p>
                              <p className="text-xs text-neutral-500">
                                {file.type} • {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'לא ידוע'}
                              </p>
                              {file.type === 'image' && file.url && (
                                <img src={file.url} alt={file.name} className="mt-2 max-w-xs rounded-lg" />
                              )}
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 block mt-1">
                                צפה בקובץ →
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFileFromCategory(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              מחק
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="border border-neutral-300 rounded-lg p-4">
                        <label className="block text-sm font-medium mb-2">
                          העלה סרטון ל-Cloudinary
                        </label>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                          accept="video/*"
                        />
                        <p className="text-xs text-neutral-500 mt-2">
                          ניתן להעלות קבצי וידאו ל-Cloudinary בלבד (MP4, MOV, AVI וכו')
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="categoryActive"
                        checked={categoryForm.isActive}
                        onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="categoryActive" className="text-sm">פעיל</label>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" variant="primary">
                        שמור
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                          setShowCategoryForm(false)
                          setEditingCategory(null)
                        }}
                      >
                        ביטול
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {loading ? (
                <p className="text-center py-8">טוען...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(Array.isArray(categories) ? categories : []).map((category) => (
                    <Card key={category._id} className="hover:shadow-soft-lg transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-serif font-semibold text-neutral-900">{category.name}</h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          category.isActive 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {category.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-neutral-600 text-sm mb-3 leading-relaxed">{category.description}</p>
                      )}
                      <p className="text-xs text-neutral-500 mb-4 italic">{category.purchaseCTA}</p>
                      <div className="flex gap-2 pt-4 border-t border-neutral-100">
                        <Button
                          variant="secondary"
                          onClick={() => handleEditCategory(category)}
                          className="text-sm px-4 py-2 flex-1"
                        >
                          ערוך
                        </Button>
                        <Button
                          variant="soft"
                          onClick={() => handleDeleteCategory(category._id)}
                          className="text-sm px-4 py-2 flex-1"
                        >
                          מחק
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {section === 'courses' && (
            <div>
              <PageHeader
                title="מסלולים"
                subtitle={`${courses.length} מסלולים זמינים`}
                backTo={null}
                actions={
                  <Button
                    onClick={() => {
                      setEditingCourse(null)
                      setCourseForm({
                        title: '',
                        description: '',
                        price: 0,
                        discount: 0,
                        installmentsCount: 1,
                        isActive: true,
                        videos: [],
                        coachingProcessMonths: DEFAULT_COACHING_MONTHS
                      })
                      setShowCourseForm(true)
                    }}
                    variant="primary"
                  >
                    + הוסף מסלול
                  </Button>
                }
              />

              {showCourseForm && (
                <Card className="mb-8 border-2 border-primary-100">
                  <h3 className="text-2xl font-serif font-semibold mb-6 text-neutral-900">
                    {editingCourse ? 'ערוך מסלול' : 'מסלול חדש'}
                  </h3>
                  <form onSubmit={handleCourseSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">כותרת המסלול *</label>
                      <input
                        type="text"
                        required
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">תיאור</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">מחיר (₪)</label>
                      <input
                        type="number"
                        min="0"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">הנחה (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={courseForm.discount}
                        onChange={(e) => setCourseForm({ ...courseForm, discount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                      />
                      <p className="text-xs text-neutral-500 mt-1">הנחה באחוזים (0-100)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">משך תהליך הליווי (חודשים) *</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        required
                        value={courseForm.coachingProcessMonths}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            coachingProcessMonths: Math.min(60, Math.max(1, parseInt(e.target.value, 10) || 1))
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                      />
                      <p className="text-xs text-neutral-500 mt-1">למשל 3 = ליווי של שלושה חודשים (ללא תאריכי לוח שנה קבועים)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-700">מספר תשלומים *</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={courseForm.installmentsCount}
                        onChange={(e) =>
                          setCourseForm({
                            ...courseForm,
                            installmentsCount: Math.max(1, parseInt(e.target.value, 10) || 1)
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                      />
                      <p className="text-xs text-neutral-500 mt-1">כמה תשלומים מותרים/נדרשים לרכישת המסלול (למשל 1 = תשלום אחד)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="courseActive"
                        checked={courseForm.isActive}
                        onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <label htmlFor="courseActive" className="text-sm">פעיל</label>
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" variant="primary">
                        שמור
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                          setShowCourseForm(false)
                          setEditingCourse(null)
                        }}
                      >
                        ביטול
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {loading ? (
                <p className="text-center py-8">טוען...</p>
              ) : !Array.isArray(courses) ? (
                <Card>
                  <p className="text-center text-red-600 py-8">
                    שגיאה: courses אינו מערך. סוג: {typeof courses}
                    <br />
                    <small>{JSON.stringify(courses)}</small>
                  </p>
                </Card>
              ) : courses.length === 0 ? (
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין מסלולים זמינים</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    if (!course || !course._id) {
                      console.warn('Invalid course:', course)
                      return null
                    }
                    return (
                      <Card key={course._id}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-semibold">{course.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {course.isActive ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </div>
                        {course.description && (
                          <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                        )}
                        {formatCourseCoachingLine(course) && (
                          <p className="text-xs text-neutral-500 mb-2">
                            תהליך ליווי: {formatCourseCoachingLine(course)}
                            {(() => {
                              const n = course.installmentsCount ?? 1
                              return (
                                <span className="ms-1">
                                  · {n} {n === 1 ? 'תשלום' : 'תשלומים'}
                                </span>
                              )
                            })()}
                          </p>
                        )}
                        {!formatCourseCoachingLine(course) && course.sessionsCount > 0 && (
                          <p className="text-xs text-neutral-500 mb-2">
                            (ישן) {course.sessionsCount} מפגש{course.sessionsCount > 1 ? 'ים' : ''}
                            {(() => {
                              const n = course.installmentsCount ?? 1
                              return (
                                <span className="ms-1">
                                  · {n} {n === 1 ? 'תשלום' : 'תשלומים'}
                                </span>
                              )
                            })()}
                          </p>
                        )}
                        {course.price > 0 && (
                          <div className="mb-3">
                            <p className="text-lg font-bold text-primary-600">₪{course.price}</p>
                            {course.discount > 0 && (
                              <p className="text-sm text-red-600 font-medium mt-1">
                                {course.discount}% הנחה
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleEditCourse(course)}
                            className="text-sm px-4 py-2"
                          >
                            ערוך
                          </Button>
                          <Button
                            variant="soft"
                            onClick={() => handleDeleteCourse(course._id)}
                            className="text-sm px-4 py-2"
                          >
                            מחק
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Purchase Tab */}
          {section === 'purchase' && (
            <div>
              <div className="max-w-3xl mx-auto">
                <PageHeader
                  title="רכישה ידנית"
                  subtitle="הוסף רכישה חדשה למסלול"
                  backTo={null}
                />

                <Card>
                  <form onSubmit={handlePurchaseSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-900">
                        מסלול *
                      </label>
                      <select
                        required
                        value={purchaseForm.courseId}
                        onChange={(e) => {
                          const selectedCourse = Array.isArray(courses) ? courses.find(c => c._id === e.target.value) : null
                          setPurchaseForm({ 
                            ...purchaseForm, 
                            courseId: e.target.value,
                            price: selectedCourse?.price || 0
                          })
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">בחר מסלול</option>
                        {(Array.isArray(courses) ? courses.filter(c => c.isActive) : []).map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title} - ₪{course.price} — {courseTimelineLabelForSelect(course)}
                          </option>
                        ))}
                      </select>
                      {purchaseForm.courseId && (
                        <div className="mt-2 p-3 bg-primary-50 rounded-lg">
                          {(() => {
                            const selectedCourse = Array.isArray(courses) ? courses.find(c => c._id === purchaseForm.courseId) : null
                            return selectedCourse ? (
                              <div className="text-sm">
                                <p className="font-semibold text-neutral-900">{selectedCourse.title}</p>
                                <p className="text-neutral-600">מחיר: ₪{selectedCourse.price}</p>
                                {formatCourseCoachingLine(selectedCourse) ? (
                                  <p className="text-neutral-600">
                                    תהליך ליווי: {formatCourseCoachingLine(selectedCourse)}
                                  </p>
                                ) : selectedCourse.sessionsCount ? (
                                  <p className="text-neutral-600">מפגשים (ישן): {selectedCourse.sessionsCount}</p>
                                ) : null}
                                <p className="text-neutral-600">
                                  תשלומים: {selectedCourse.installmentsCount ?? 1}
                                </p>
                              </div>
                            ) : null
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          שם הלקוח *
                        </label>
                        <input
                          type="text"
                          required
                          value={purchaseForm.customerName}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, customerName: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="הזן שם מלא"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          טלפון *
                        </label>
                        <input
                          type="tel"
                          required
                          value={purchaseForm.customerPhone}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, customerPhone: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="הזן מספר טלפון"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-900">
                        אימייל *
                      </label>
                      <input
                        type="email"
                        required
                        value={purchaseForm.customerEmail}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, customerEmail: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="הזן כתובת אימייל"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          סוג רכישה
                        </label>
                        <select
                          value={purchaseForm.paymentProvider}
                          onChange={(e) =>
                            setPurchaseForm({
                              ...purchaseForm,
                              paymentProvider: e.target.value,
                              paymentMethod: e.target.value === 'cardcom' ? 'credit_card' : purchaseForm.paymentMethod,
                              status: e.target.value === 'cardcom' ? 'pending' : purchaseForm.status,
                            })
                          }
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="manual">רכישה ידנית</option>
                          <option value="cardcom">תשלום דרך Cardcom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          שיטת תשלום
                        </label>
                        <select
                          value={purchaseForm.paymentMethod}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}
                          disabled={purchaseForm.paymentProvider === 'cardcom'}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="other">אחר</option>
                          <option value="credit_card">כרטיס אשראי</option>
                          <option value="bank_transfer">העברה בנקאית</option>
                          <option value="paypal">PayPal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          סטטוס *
                        </label>
                        <select
                          required
                          value={purchaseForm.status}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, status: e.target.value })}
                          disabled={purchaseForm.paymentProvider === 'cardcom'}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="pending">ממתין</option>
                          <option value="completed">הושלם</option>
                          <option value="cancelled">בוטל</option>
                        </select>
                        {purchaseForm.status === 'completed' && (
                          <p className="mt-2 text-xs text-green-600">
                            💡 הכנסה תיווצר אוטומטית
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-900">
                        הערות
                      </label>
                      <textarea
                        value={purchaseForm.notes}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                        rows="4"
                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="הערות נוספות על הרכישה..."
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button type="submit" variant="primary" className="flex-1 text-lg py-3">
                        {purchaseForm.paymentProvider === 'cardcom' ? 'המשך לתשלום ב-Cardcom' : 'שמור רכישה'}
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                          setPurchaseForm({
                            courseId: '',
                            customerName: '',
                            customerEmail: '',
                            customerPhone: '',
                            paymentProvider: 'manual',
                            paymentMethod: 'other',
                            notes: '',
                            status: 'pending'
                          })
                        }}
                        className="px-6 py-3"
                      >
                        נקה טופס
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          )}

          {/* New Booking Tab */}
          {section === 'new-booking' && (
            <div>
              <div className="max-w-3xl mx-auto">
                <PageHeader
                  title="צור פגישה חדשה"
                  subtitle="צור פגישה ללקוח קיים או לאדם חדש"
                  backTo={null}
                />

                <Card>
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    {/* Customer Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-900">
                        בחר לקוח קיים (אופציונלי)
                      </label>
                      <select
                        value={bookingForm.customerId}
                        onChange={(e) => {
                          const selectedCustomer = Array.isArray(customers) ? customers.find(c => c._id === e.target.value) : null
                          setBookingForm({
                            ...bookingForm,
                            customerId: e.target.value,
                            name: selectedCustomer ? (selectedCustomer.name || '') : '',
                            phone: selectedCustomer ? (selectedCustomer.phone || '') : '',
                            email: selectedCustomer ? (selectedCustomer.email || '') : ''
                          })
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">אדם חדש</option>
                        {Array.isArray(customers) && customers.map((customer) => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name} - {customer.email || 'ללא אימייל'}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-neutral-500 mt-1">
                        אם תבחר לקוח קיים, הפרטים יתמלאו אוטומטית
                      </p>
                    </div>

                    <div className="border-t border-neutral-200 pt-6">
                      <h3 className="text-lg font-semibold mb-4 text-neutral-900">פרטי הפגישה</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-neutral-900">
                            שם מלא *
                          </label>
                          <input
                            type="text"
                            required
                            value={bookingForm.name}
                            onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="הכנס שם מלא"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-neutral-900">
                            טלפון *
                          </label>
                          <input
                            type="tel"
                            required
                            value={bookingForm.phone}
                            onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="050-123-4567"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          אימייל
                        </label>
                        <input
                          type="email"
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-neutral-900">
                            תאריך מועדף *
                          </label>
                          <input
                            type="date"
                            required
                            value={bookingForm.preferredDate}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                preferredDate: e.target.value,
                                preferredTime: '',
                              })
                            }
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          {loadingAdminBookingAvailability && (
                            <p className="text-xs text-neutral-500 mt-2">בודק זמינות...</p>
                          )}
                          {!loadingAdminBookingAvailability &&
                            adminBookingAvailabilityError &&
                            bookingForm.preferredDate && (
                              <p className="text-xs text-red-500 mt-2">
                                שגיאה בטעינת זמינות. נסה לבחור תאריך מחדש.
                              </p>
                            )}
                          {!loadingAdminBookingAvailability &&
                            adminBookingAvailability.isDateUnavailable &&
                            bookingForm.preferredDate && (
                              <p className="text-xs text-red-500 mt-2">התאריך אינו זמין.</p>
                            )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-neutral-900">
                            שעה מועדפת
                          </label>
                          <select
                            value={bookingForm.preferredTime}
                            onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                            disabled={
                              loadingAdminBookingAvailability ||
                              adminBookingAvailabilityError ||
                              adminBookingAvailability.isDateUnavailable ||
                              !bookingForm.preferredDate
                            }
                            className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                          >
                            <option value="">
                              {loadingAdminBookingAvailability && bookingForm.preferredDate
                                ? 'טוען שעות…'
                                : adminBookingAvailabilityError
                                  ? 'לא ניתן לטעון שעות'
                                  : adminBookingAvailability.isDateUnavailable
                                    ? 'אין שעות זמינות'
                                    : !bookingForm.preferredDate
                                      ? 'בחר תאריך תחילה'
                                      : adminBookingAvailability.availableTimes.length === 0
                                        ? 'אין חלונות פנויים'
                                        : 'בחר שעה'}
                            </option>
                            {(adminBookingAvailability.isDateUnavailable || adminBookingAvailabilityError
                              ? []
                              : adminBookingAvailability.availableTimes
                            ).map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bookingForm.isIntroMeeting}
                            onChange={(e) =>
                              setBookingForm({
                                ...bookingForm,
                                isIntroMeeting: e.target.checked,
                                preferredTime: '',
                              })
                            }
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-neutral-900">
                            פגישת היכרות
                          </span>
                        </label>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium mb-2 text-neutral-900">
                          הערות נוספות
                        </label>
                        <textarea
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          placeholder="האם יש מידע נוסף שתרצו לשתף כהכנה למפגש ?"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-neutral-200">
                      <Button type="submit" variant="primary" className="flex-1 text-lg py-3">
                        צור פגישה
                      </Button>
                      <Button
                        type="button"
                        variant="soft"
                        onClick={() => {
                          setBookingForm({
                            customerId: '',
                            name: '',
                            phone: '',
                            email: '',
                            preferredDate: '',
                            preferredTime: '',
                            meetingType: 'frontend',
                            notes: '',
                            status: 'pending',
                            isIntroMeeting: false
                          })
                        }}
                        className="px-6 py-3"
                      >
                        נקה טופס
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          )}

      </AdminPageShell>
    </>
  )
}

export default AdminPage

