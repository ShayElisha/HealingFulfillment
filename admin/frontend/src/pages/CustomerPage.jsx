import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customerService } from '../services/customerApi'
import { bookingService } from '../services/adminApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import AdminModalLayout from '../components/AdminModalLayout'
import EmptyState from '../components/EmptyState'
import CustomerQuestionnaireTab from '../components/CustomerQuestionnaireTab'
import UploadProgressStatus, { buttonText } from '../components/UploadProgressStatus'
import toast from 'react-hot-toast'

function addCalendarMonths(date, months) {
  const m = Math.min(120, Math.max(1, parseInt(months, 10) || 1))
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setMonth(d.getMonth() + m)
  if (d.getDate() < day) d.setDate(0)
  return d
}

function courseCoachingSecondaryLine(course) {
  if (!course) return null
  if (course.coachingProcessMonths != null && Number(course.coachingProcessMonths) >= 1) {
    const n = Number(course.coachingProcessMonths)
    return `${n} חודש${n === 1 ? '' : 'ים'}`
  }
  if (course.coachingProcessStartAt || course.coachingProcessEndAt) {
    return [
      course.coachingProcessStartAt &&
        new Date(course.coachingProcessStartAt).toLocaleDateString('he-IL'),
      course.coachingProcessEndAt &&
        new Date(course.coachingProcessEndAt).toLocaleDateString('he-IL')
    ]
      .filter(Boolean)
      .join(' – ')
  }
  return null
}

/** שמור על הרכישה / תאריכי קורס, או חישוב מ־חודשים + תאריך פתיחת תיק / חיוב (כמו ב-API coaching-window) */
function getPurchaseCoachingWindowResolved(purchase, customer) {
  const c = purchase?.course
  const exS = purchase?.coachingStartedAt || c?.coachingProcessStartAt
  const exE = purchase?.coachingEndsAt || c?.coachingProcessEndAt
  const opts = { year: 'numeric', month: 'short', day: 'numeric' }
  if (exS && exE) {
    const a = new Date(exS).toLocaleDateString('he-IL', opts)
    const b = new Date(exE).toLocaleDateString('he-IL', opts)
    return { line: `${a} – ${b}`, derived: false }
  }
  const months = c?.coachingProcessMonths
  if (purchase?.status === 'completed' && months != null && Number(months) >= 1) {
    const anchorRaw = customer?.caseOpenedAt || purchase?.paidAt || purchase?.createdAt
    if (anchorRaw) {
      const start = new Date(anchorRaw)
      const end = addCalendarMonths(start, Number(months))
      return {
        line: `${start.toLocaleDateString('he-IL', opts)} – ${end.toLocaleDateString('he-IL', opts)}`,
        derived: true,
      }
    }
  }
  return null
}

/** כתובת תצוגה: בדרך כלל URL מלא מ-Cloudinary; נתיב יחסי ישן (/uploads/...) — בפיתוח פרוקסי ל-backend */
function resolveCustomerFileUrl(urlPath) {
  if (!urlPath) return ''
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) return urlPath
  return urlPath
}

const TRIGGER_PART_LABELS = {
  night: 'לילה / אחרי חצות',
  early_morning: 'שחר',
  morning: 'בוקר',
  noon: 'צהריים',
  afternoon: 'אחר צהריים',
  evening: 'ערב',
  late_evening: 'סוף ערב / לפני שינה',
}

const TRIGGER_BREATHING_LABELS = {
  unaware_held: '1 עצורה לא מודעת',
  fast_contracted: '2 מהירה מכווצת',
  regular_flowing: '3 סדירה זורמת',
  not_noticed: '4 לא שמתי לב',
}

function formatTriggerEntryDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
}

function CustomerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [fileUpload, setFileUpload] = useState(null)
  const [fileDescription, setFileDescription] = useState('')
  const [audioFileUpload, setAudioFileUpload] = useState(null)
  const [audioFileDescription, setAudioFileDescription] = useState('')
  const [audioInputKey, setAudioInputKey] = useState(0)
  const [noteContent, setNoteContent] = useState('')
  const [filesInputMode, setFilesInputMode] = useState('file')
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  /** 'file' | 'audio' — איזה טופס מעלה כרגע (לפרוגרס) */
  const [uploadKind, setUploadKind] = useState(null)
  /** 0–100 התקדמות העלאה לרשת */
  const [uploadProgress, setUploadProgress] = useState(0)
  /** signing = בקשת חתימה | uploading = העלאה ל-Cloudinary | saving = שמירת מטא-דאטה בשרת */
  const [uploadStage, setUploadStage] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [initialPassword, setInitialPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [bookingEditForm, setBookingEditForm] = useState({
    preferredDate: '',
    preferredTime: '',
    meetingType: 'frontend',
    notes: '',
  })
  const [savingBookingEdit, setSavingBookingEdit] = useState(false)
  const [coachingUiLoading, setCoachingUiLoading] = useState(null)
  const [triggerJournalEntries, setTriggerJournalEntries] = useState([])
  const [triggerJournalLoading, setTriggerJournalLoading] = useState(false)

  useEffect(() => {
    loadCustomer()
  }, [id])

  useEffect(() => {
    if (activeTab !== 'trigger-journal' || !id) return
    let cancelled = false
    ;(async () => {
      try {
        setTriggerJournalLoading(true)
        const res = await customerService.getTriggerJournal(id, { limit: 120 })
        if (!cancelled) setTriggerJournalEntries(Array.isArray(res?.data) ? res.data : [])
      } catch (e) {
        console.error(e)
        if (!cancelled) setTriggerJournalEntries([])
        toast.error('שגיאה בטעינת תיעוד תריגרים')
      } finally {
        if (!cancelled) setTriggerJournalLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeTab, id])

  const loadCustomer = async () => {
    try {
      setLoading(true)
      const response = await customerService.getById(id)
      setCustomer(response.data)
    } catch (error) {
      console.error('Error loading customer:', error)
      toast.error('שגיאה בטעינת פרטי הלקוח')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCustomerCase = async () => {
    try {
      setCoachingUiLoading('case')
      await customerService.openCase(id)
      await loadCustomer()
      toast.success('תיק הלקוח נפתח')
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה בפתיחת התיק')
    } finally {
      setCoachingUiLoading(null)
    }
  }

  const handleSetPurchaseCoaching = async (purchaseId) => {
    try {
      setCoachingUiLoading(purchaseId)
      await customerService.setPurchaseCoachingWindow(id, purchaseId)
      await loadCustomer()
      toast.success('תקופת הליווי נקבעה לפי משך המסלול')
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה בקביעת תקופת הליווי')
    } finally {
      setCoachingUiLoading(null)
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!fileUpload) {
      toast.error('אנא בחר קובץ להעלאה')
      return
    }

    setUploadKind('file')
    setUploadProgress(0)
    setUploadStage('signing')
    setUploading(true)

    try {
      const useBackendRelay = customerService.shouldUseBackendRelayForLargeRaw(fileUpload)
      if (useBackendRelay) {
        setUploadStage('uploading')
        const formData = new FormData()
        formData.append('file', fileUpload)
        formData.append('description', fileDescription)
        await customerService.uploadFile(id, formData, {
          onUploadProgress: (pct) => {
            if (pct != null) setUploadProgress(pct)
          },
        })
        setUploadStage('saving')
        setUploadProgress(100)
        await loadCustomer()
        setFileUpload(null)
        setFileDescription('')
        e.target.reset()
        toast.success('קובץ גדול הועלה בהצלחה דרך נתיב שרת ייעודי')
        return
      }

      try {
        const signatureRes = await customerService.getDirectUploadSignature(id, {
          kind: 'file',
          mimetype: fileUpload.type || 'application/octet-stream',
        })
        const signatureData = signatureRes?.data
        if (!signatureData) throw new Error('לא התקבלה חתימת העלאה')

        setUploadStage('uploading')
        const cloudinaryRes = await customerService.uploadDirectToCloudinary(
          signatureData,
          fileUpload,
          (pct) => {
            if (pct != null) setUploadProgress(pct)
          }
        )
        setUploadStage('saving')
        setUploadProgress(100)
        await customerService.saveDirectUpload(id, {
          kind: 'file',
          url: cloudinaryRes?.secure_url || cloudinaryRes?.url,
          name: fileUpload.name,
          size: cloudinaryRes?.bytes || fileUpload.size,
          mimetype: fileUpload.type || 'application/octet-stream',
          description: fileDescription,
        })
        await loadCustomer()
        setFileUpload(null)
        setFileDescription('')
        e.target.reset()
        toast.success('קובץ הועלה בהצלחה!')
      } catch (directErr) {
        const status = Number(directErr?.response?.status || 0)
        const isDirectAuthIssue = status === 401 || status === 403
        if (!isDirectAuthIssue) throw directErr
        setUploadStage('uploading')
        setUploadProgress(0)
        const formData = new FormData()
        formData.append('file', fileUpload)
        formData.append('description', fileDescription)
        await customerService.uploadFile(id, formData, {
          onUploadProgress: (pct) => {
            if (pct != null) setUploadProgress(pct)
          },
        })
        setUploadStage('saving')
        setUploadProgress(100)
        await loadCustomer()
        setFileUpload(null)
        setFileDescription('')
        e.target.reset()
        toast.success('ההעלאה הושלמה דרך נתיב שרת חלופי')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      const isCloudinary413 =
        (error?.response?.status === 413 || /413/.test(String(error?.message || ''))) &&
        String(error?.config?.url || '').includes('api.cloudinary.com')
      const msg =
        (isCloudinary413 &&
          'הקובץ גדול מדי להעלאה ישירה. נסה קובץ קטן יותר או צור קשר לעדכון תשתית ההעלאה.') ||
        error.response?.data?.message ||
        error.message ||
        'שגיאה בהעלאת הקובץ'
      toast.error(msg)
    } finally {
      setUploading(false)
      setUploadKind(null)
      setUploadStage(null)
      setUploadProgress(0)
    }
  }

  const handleAudioUpload = async (e) => {
    e.preventDefault()
    if (!audioFileUpload) {
      toast.error('אנא בחר קובץ אודיו')
      return
    }
    setUploadKind('audio')
    setUploadProgress(0)
    setUploadStage('signing')
    setUploading(true)

    try {
      try {
        const signatureRes = await customerService.getDirectUploadSignature(id, {
          kind: 'audio',
          mimetype: audioFileUpload.type || 'application/octet-stream',
        })
        const signatureData = signatureRes?.data
        if (!signatureData) throw new Error('לא התקבלה חתימת העלאה')

        setUploadStage('uploading')
        const cloudinaryRes = await customerService.uploadDirectToCloudinary(
          signatureData,
          audioFileUpload,
          (pct) => {
            if (pct != null) setUploadProgress(pct)
          }
        )
        setUploadStage('saving')
        setUploadProgress(100)
        await customerService.saveDirectUpload(id, {
          kind: 'audio',
          url: cloudinaryRes?.secure_url || cloudinaryRes?.url,
          name: audioFileUpload.name,
          size: cloudinaryRes?.bytes || audioFileUpload.size,
          mimetype: audioFileUpload.type || 'application/octet-stream',
          description: audioFileDescription,
        })
        await loadCustomer()
        setAudioFileUpload(null)
        setAudioFileDescription('')
        setAudioInputKey((k) => k + 1)
        toast.success('קובץ אודיו הועלה בהצלחה!')
      } catch (directErr) {
        const status = Number(directErr?.response?.status || 0)
        const isDirectAuthIssue = status === 401 || status === 403
        if (!isDirectAuthIssue) throw directErr
        setUploadStage('uploading')
        setUploadProgress(0)
        const formData = new FormData()
        formData.append('file', audioFileUpload)
        formData.append('description', audioFileDescription)
        await customerService.uploadAudio(id, formData, {
          onUploadProgress: (pct) => {
            if (pct != null) setUploadProgress(pct)
          },
        })
        setUploadStage('saving')
        setUploadProgress(100)
        await loadCustomer()
        setAudioFileUpload(null)
        setAudioFileDescription('')
        setAudioInputKey((k) => k + 1)
        toast.success('העלאת האודיו הושלמה דרך נתיב שרת חלופי')
      }
    } catch (error) {
      console.error('Error uploading audio:', error)
      const isCloudinary413 =
        (error?.response?.status === 413 || /413/.test(String(error?.message || ''))) &&
        String(error?.config?.url || '').includes('api.cloudinary.com')
      toast.error(
        (isCloudinary413 &&
          'קובץ האודיו גדול מדי להעלאה ישירה. נסה קובץ קטן יותר או צור קשר לעדכון תשתית ההעלאה.') ||
          error.response?.data?.message ||
          'שגיאה בהעלאת האודיו'
      )
    } finally {
      setUploading(false)
      setUploadKind(null)
      setUploadStage(null)
      setUploadProgress(0)
    }
  }

  const handleDeleteFile = async (fileId) => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך למחוק את הקובץ?')
    if (!confirmed) {
      return
    }

    try {
      await customerService.deleteFile(id, fileId)
      await loadCustomer()
      toast.success('קובץ נמחק בהצלחה!')
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('שגיאה במחיקת הקובץ')
    }
  }

  const handleLinkSave = async (e) => {
    e.preventDefault()
    if (!linkName.trim() || !linkUrl.trim()) {
      toast.error('אנא מלא שם קישור וכתובת מלאה')
      return
    }
    try {
      setUploadKind('file')
      setUploadStage('saving')
      setUploading(true)
      await customerService.addLinkFile(id, {
        name: linkName.trim(),
        url: linkUrl.trim(),
        description: linkDescription.trim(),
      })
      await loadCustomer()
      setLinkName('')
      setLinkUrl('')
      setLinkDescription('')
      toast.success('הקישור נשמר בהצלחה')
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה בשמירת הקישור')
    } finally {
      setUploading(false)
      setUploadKind(null)
      setUploadStage(null)
      setUploadProgress(0)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteContent.trim()) {
      toast.error('אנא הכנס תוכן להערה')
      return
    }

    try {
      await customerService.addNote(id, noteContent)
      await loadCustomer()
      setNoteContent('')
      toast.success('הערה נוספה בהצלחה!')
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('שגיאה בהוספת הערה')
    }
  }

  const handleCreateAccount = async () => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך ליצור משתמש ללקוח זה?')
    if (!confirmed) {
      return
    }

    setCreatingAccount(true)
    setIsResetPassword(false)
    try {
      const response = await customerService.createAccount(id)
      setInitialPassword(response.data.initialPassword)
      setShowPasswordModal(true)
      await loadCustomer()
      toast.success('משתמש נוצר בהצלחה!')
    } catch (error) {
      console.error('Error creating account:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה ביצירת משתמש'
      toast.error(errorMessage)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleOpenCaseAndCreateAccount = async () => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך לפתוח תיק לקוח וליצור משתמש ללקוח זה?')
    if (!confirmed) {
      return
    }

    setCreatingAccount(true)
    setIsResetPassword(false)
    try {
      await customerService.openCase(id)
      const response = await customerService.createAccount(id)
      setInitialPassword(response.data.initialPassword)
      setShowPasswordModal(true)
      await loadCustomer()
      toast.success('תיק לקוח נפתח ומשתמש נוצר בהצלחה!')
    } catch (error) {
      console.error('Error opening case and creating account:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה בפתיחת תיק ויצירת משתמש'
      toast.error(errorMessage)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleResetPassword = async () => {
    const confirmed = window.confirm('האם אתה בטוח שברצונך ליצור סיסמה ראשונית חדשה? הלקוח יצטרך להתחבר עם הסיסמה החדשה ולשנות אותה.')
    if (!confirmed) {
      return
    }

    setCreatingAccount(true)
    setIsResetPassword(true)
    try {
      const response = await customerService.resetPassword(id)
      setInitialPassword(response.data.initialPassword)
      setShowPasswordModal(true)
      await loadCustomer()
      toast.success('סיסמה ראשונית חדשה נוצרה בהצלחה!')
    } catch (error) {
      console.error('Error resetting password:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה ביצירת סיסמה חדשה'
      toast.error(errorMessage)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleToggleCustomerActive = async () => {
    const nextStatus = customer.status === 'inactive' ? 'active' : 'inactive'
    const confirmed = window.confirm(
      nextStatus === 'inactive'
        ? 'האם להפוך את הלקוח ללא פעיל? משתמש לא פעיל לא יוכל לבצע פעולות בתיק הלקוח.'
        : 'האם להחזיר את הלקוח לפעיל?'
    )
    if (!confirmed) return
    try {
      await customerService.updateStatus(id, nextStatus)
      await loadCustomer()
      toast.success(nextStatus === 'inactive' ? 'הלקוח הוגדר כלא פעיל' : 'הלקוח חזר להיות פעיל')
    } catch (error) {
      toast.error(error.response?.data?.message || 'שגיאה בעדכון סטטוס הלקוח')
    }
  }

  const handleOpenEditBooking = (booking) => {
    const dateValue = booking?.preferredDate
      ? new Date(booking.preferredDate).toISOString().slice(0, 10)
      : ''
    setEditingBooking(booking)
    setBookingEditForm({
      preferredDate: dateValue,
      preferredTime: booking?.preferredTime || '',
      meetingType: booking?.meetingType === 'zoom' ? 'zoom' : 'frontend',
      notes: booking?.notes || '',
    })
  }

  const handleCloseEditBooking = () => {
    setEditingBooking(null)
    setSavingBookingEdit(false)
    setBookingEditForm({
      preferredDate: '',
      preferredTime: '',
      meetingType: 'frontend',
      notes: '',
    })
  }

  const handleSaveBookingEdit = async () => {
    if (!editingBooking?._id) return
    if (!bookingEditForm.preferredDate) {
      toast.error('יש לבחור תאריך לפגישה')
      return
    }
    try {
      setSavingBookingEdit(true)
      await bookingService.updateDetails(editingBooking._id, {
        preferredDate: bookingEditForm.preferredDate,
        preferredTime: bookingEditForm.preferredTime.trim(),
        meetingType: bookingEditForm.meetingType,
        notes: bookingEditForm.notes,
      })
      await loadCustomer()
      toast.success('פרטי הפגישה עודכנו')
      handleCloseEditBooking()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'שגיאה בעדכון פרטי הפגישה')
    } finally {
      setSavingBookingEdit(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <AdminPageShell>
          <div className="flex min-h-[55vh] items-center justify-center py-16">
            <p className="text-lg text-neutral-600">טוען...</p>
          </div>
        </AdminPageShell>
      </>
    )
  }

  if (!customer) {
    return (
      <>
        <Navbar />
        <AdminPageShell>
          <PageHeader
            title="לקוח לא נמצא"
            subtitle="ייתכן שהקישור לא תקף או שהרשומה נמחקה"
            backTo="/customers"
            backLabel="חזור לרשימת לקוחות"
          />
          <EmptyState
            icon="🔍"
            title="אין רשומה להצגה"
            description="נסו לחזור לרשימת הלקוחות ולבחור לקוח קיים."
          >
            <Button onClick={() => navigate('/customers')} variant="primary">
              מעבר ללקוחות
            </Button>
          </EmptyState>
        </AdminPageShell>
      </>
    )
  }

  const stats = {
    totalSessions: customer.bookings?.length || 0,
    confirmedSessions: customer.bookings?.filter(b => b.status === 'confirmed').length || 0,
    completedCourses: customer.purchases?.filter(p => p.status === 'completed').length || 0,
    totalSpent: customer.purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0
  }

  const nonAudioFiles = customer.files?.filter((f) => f.type !== 'audio') ?? []
  const audioFiles = customer.files?.filter((f) => f.type === 'audio') ?? []

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader
          title={`תיק לקוח: ${customer.name}`}
          subtitle={`${customer.email} · ${customer.phone}`}
          backTo="/customers"
          backLabel="חזור לרשימת לקוחות"
        />

        <div className="admin-tabs-bar mb-8 overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'סקירה כללית' },
            { id: 'questionnaire', label: 'אבחון ראשוני' },
            { id: 'trigger-journal', label: 'זיהוי ותיעוד' },
            { id: 'files', label: `קבצים (${nonAudioFiles.length})` },
            { id: 'audio', label: `אודיו (${audioFiles.length})` },
            { id: 'sessions', label: `פגישות (${customer.bookings?.length || 0})` },
            { id: 'notes', label: `הערות (${customer.notes?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`admin-tab-btn whitespace-nowrap ${
                activeTab === tab.id ? 'admin-tab-btn-active' : 'admin-tab-btn-idle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card
                className={
                  customer.caseOpenedAt
                    ? 'border border-green-100 bg-green-50/40'
                    : 'border border-amber-200 bg-amber-50/50'
                }
              >
                <h3 className="text-lg font-semibold mb-2 text-neutral-900">תיק לקוח ותקופת ליווי</h3>
                {customer.caseOpenedAt ? (
                  <p className="text-sm text-neutral-700">
                    תיק נפתח ב־
                    {new Date(customer.caseOpenedAt).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    . ניתן לקבוע לכל רכישה תקופת ליווי (תאריך התחלה = תאריך פתיחת התיק, סיום לפי משך המסלול).
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-900">
                      תאריך התחלת הליווי ללקוח נקבע רק לאחר <strong>פתיחת תיק</strong>. עד אז לא תוגדר תקופת ליווי
                      לרכישות.
                    </p>
                    <p className="text-xs text-amber-700">
                      פתיחת תיק לקוח מתבצעת יחד עם יצירת המשתמש בכפתור המאוחד תחת אזור "חשבון משתמש".
                    </p>
                  </div>
                )}
              </Card>

              {/* Account Creation Section */}
              <Card>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">חשבון משתמש</h3>
                    <div className="mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : customer.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        סטטוס משתמש: {customer.status === 'active' ? 'פעיל' : customer.status === 'completed' ? 'הושלם' : 'לא פעיל'}
                      </span>
                    </div>
                    {customer.hasAccount ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <p className="text-green-600 font-medium">✓ למשתמש יש חשבון פעיל</p>
                          {customer.accountCreatedAt && (
                            <p className="text-sm text-neutral-600">
                              נוצר ב: {new Date(customer.accountCreatedAt).toLocaleDateString('he-IL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          {customer.lastLoginAt && (
                            <p className="text-sm text-neutral-600">
                              התחברות אחרונה: {new Date(customer.lastLoginAt).toLocaleDateString('he-IL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          {customer.mustChangePassword && (
                            <p className="text-sm text-yellow-600 font-medium">
                              ⚠ הלקוח צריך לשנות את הסיסמה הראשונית
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={handleResetPassword}
                          variant="soft"
                          disabled={creatingAccount}
                          className="mt-2"
                        >
                          {creatingAccount ? 'יוצר...' : 'צור סיסמה ראשונית חדשה'}
                        </Button>
                        <Button
                          onClick={handleToggleCustomerActive}
                          variant={customer.status === 'inactive' ? 'primary' : 'soft'}
                          className="mt-2"
                        >
                          {customer.status === 'inactive' ? 'הפוך לפעיל' : 'הפוך ללא פעיל'}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-neutral-600 mb-4">למשתמש זה אין חשבון פעיל</p>
                        {!customer.caseOpenedAt ? (
                          <Button
                            onClick={handleOpenCaseAndCreateAccount}
                            variant="primary"
                            disabled={creatingAccount}
                          >
                            {creatingAccount ? 'מבצע...' : 'פתיחת תיק לקוח + צור משתמש ללקוח'}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleCreateAccount}
                            variant="primary"
                            disabled={creatingAccount}
                          >
                            {creatingAccount ? 'יוצר...' : 'צור משתמש ללקוח'}
                          </Button>
                        )}
                        <div className="mt-2">
                          <Button
                            onClick={handleToggleCustomerActive}
                            variant={customer.status === 'inactive' ? 'primary' : 'soft'}
                          >
                            {customer.status === 'inactive' ? 'הפוך לפעיל' : 'הפוך ללא פעיל'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

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
                    {customer.purchases?.length || 0}
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
                    {customer.completedSessions || 0}
                  </p>
                </Card>
              </div>

              {/* Recent Purchases */}
              {customer.purchases && customer.purchases.length > 0 && (
                <Card>
                  <h3 className="text-xl font-semibold mb-4">רכישות אחרונות</h3>
                  <div className="space-y-3">
                    {customer.purchases.slice(0, 5).map((purchase) => {
                      const resolved = getPurchaseCoachingWindowResolved(purchase, customer)
                      const windowLine = resolved?.line
                      const windowDerived = resolved?.derived
                      const plannedCourseLine = courseCoachingSecondaryLine(purchase.course)
                      return (
                      <div key={purchase._id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-semibold text-lg mb-1">{purchase.course?.title || 'מסלול'}</p>
                            <p className="text-sm text-neutral-600">
                              תאריך רכישה: {new Date(purchase.createdAt).toLocaleDateString('he-IL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {windowLine && (
                              <div className="mt-2">
                                <p className="text-sm text-neutral-800 font-medium">
                                  תקופת ליווי: {windowLine}
                                  {windowDerived && (
                                    <span className="text-xs font-normal text-neutral-500 mr-1">
                                      {' '}
                                      (מחושב)
                                    </span>
                                  )}
                                </p>
                                {windowDerived && (
                                  <p className="text-xs text-neutral-500 mt-1">
                                    לשמירה קבועה במסד הנתונים לחצו «קבע תקופת ליווי לפי המסלול» (מומלץ לאישור רשמי)
                                  </p>
                                )}
                              </div>
                            )}
                            {!windowLine && !customer.caseOpenedAt && (
                              <p className="text-sm text-amber-800 mt-2">
                                פתחו תיק לקוח כדי לקבוע תאריך התחלה וסיום ליווי לפי המסלול.
                              </p>
                            )}
                            {!windowLine && customer.caseOpenedAt && (
                              <div className="mt-2 space-y-2">
                                {plannedCourseLine && (
                                  <p className="text-xs text-neutral-500">
                                    משך מסלול במערכת: {plannedCourseLine} (ישמש לחישוב תאריך הסיום)
                                  </p>
                                )}
                                <Button
                                  type="button"
                                  variant="soft"
                                  className="text-sm"
                                  disabled={coachingUiLoading === purchase._id}
                                  onClick={() => handleSetPurchaseCoaching(purchase._id)}
                                >
                                  {coachingUiLoading === purchase._id ? 'מעדכן...' : 'קבע תקופת ליווי לפי המסלול'}
                                </Button>
                              </div>
                            )}
                            {windowLine && windowDerived && customer.caseOpenedAt && (
                              <div className="mt-2">
                                <Button
                                  type="button"
                                  variant="soft"
                                  className="text-sm"
                                  disabled={coachingUiLoading === purchase._id}
                                  onClick={() => handleSetPurchaseCoaching(purchase._id)}
                                >
                                  {coachingUiLoading === purchase._id ? 'מעדכן...' : 'שמור תקופה זו במערכת'}
                                </Button>
                              </div>
                            )}
                            {!windowLine && purchase.course?.sessionsCount > 0 && (
                                <p className="text-sm text-neutral-600 mt-1">
                                  (ישן) כמות מפגשים: {purchase.course.sessionsCount}
                                </p>
                              )}
                          </div>
                          <div className="text-left ml-4">
                            <p className="font-semibold text-lg mb-2">₪{purchase.price}</p>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
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
                      </div>
                    )})}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Questionnaire Tab */}
          {activeTab === 'questionnaire' && (
            <div className="space-y-6">
              <CustomerQuestionnaireTab customer={customer} />
            </div>
          )}

          {activeTab === 'trigger-journal' && (
            <Card>
              <h3 className="text-xl font-semibold mb-2">זיהוי ותיעוד (מהלקוח)</h3>
              <p className="text-sm text-neutral-600 mb-6">
                רישומים יומיים שהלקוח שומר מתיק הלקוח. לצפייה בלבד.
              </p>
              {triggerJournalLoading ? (
                <p className="text-neutral-500 py-8 text-center">טוען…</p>
              ) : triggerJournalEntries.length === 0 ? (
                <p className="text-neutral-500 py-8 text-center">אין רשומות עדיין.</p>
              ) : (
                <ul className="space-y-4 text-right">
                  {triggerJournalEntries.map((row) => (
                    <li
                      key={row._id}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/90 p-4"
                    >
                      <div className="flex flex-wrap gap-2 text-sm text-neutral-600 mb-2">
                        <span className="font-semibold text-neutral-900">
                          {formatTriggerEntryDate(row.entryDate)}
                        </span>
                        <span>·</span>
                        <span>{TRIGGER_PART_LABELS[row.partOfDay] || row.partOfDay}</span>
                        {row.intensity != null && (
                          <span>עוצמה {row.intensity}/10</span>
                        )}
                      </div>
                      <p className="text-neutral-800 whitespace-pre-wrap">{row.triggerDescription}</p>
                      {row.contextOrBody ? (
                        <p className="text-sm text-neutral-600 mt-2">
                          <span className="font-medium">הקשר: </span>
                          {row.contextOrBody}
                        </p>
                      ) : null}
                      {row.thoughts ? (
                        <p className="text-sm text-neutral-600 mt-1">מחשבות: {row.thoughts}</p>
                      ) : null}
                      {row.feelingsNotes ? (
                        <p className="text-sm text-neutral-600 mt-1">רגשות: {row.feelingsNotes}</p>
                      ) : null}
                      <p className="text-sm text-neutral-600 mt-1">
                        נשימה: {TRIGGER_BREATHING_LABELS[row.breathingType] || TRIGGER_BREATHING_LABELS.not_noticed}
                      </p>
                      {row.bodySensations ? (
                        <p className="text-sm text-neutral-600 mt-1">תחושות בגוף: {row.bodySensations}</p>
                      ) : null}
                      {row.lessonLearned ? (
                        <p className="text-sm text-neutral-600 mt-1">השיעור שלי: {row.lessonLearned}</p>
                      ) : null}
                      {row.notes ? (
                        <p className="text-sm text-neutral-500 mt-2 whitespace-pre-wrap">{row.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-semibold mb-4">העלאת קובץ חדש (Cloudinary)</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  להקלטות והודעות קוליות השתמשו בלשונית <strong>אודיו</strong>.
                </p>
                <div className="mb-4 flex gap-2">
                  <Button
                    type="button"
                    variant={filesInputMode === 'file' ? 'primary' : 'soft'}
                    onClick={() => setFilesInputMode('file')}
                    disabled={uploading}
                  >
                    קובץ
                  </Button>
                  <Button
                    type="button"
                    variant={filesInputMode === 'link' ? 'primary' : 'soft'}
                    onClick={() => setFilesInputMode('link')}
                    disabled={uploading}
                  >
                    קישור
                  </Button>
                </div>

                {filesInputMode === 'file' ? (
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div>
                      <label className="admin-label">
                        בחר קובץ
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFileUpload(e.target.files[0])}
                        className="admin-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-label">
                        תיאור הקובץ (אופציונלי)
                      </label>
                      <textarea
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        placeholder="תיאור הקובץ..."
                        className="admin-textarea"
                        rows="3"
                      />
                    </div>
                    <UploadProgressStatus
                      active={uploading && uploadKind === 'file'}
                      stage={uploadStage}
                      progress={uploadProgress}
                      itemLabel="קובץ"
                    />
                    <Button type="submit" variant="primary" disabled={uploading}>
                      {uploading && uploadKind === 'file' ? buttonText(uploadStage, 'העלה קובץ') : 'העלה קובץ'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleLinkSave} className="space-y-4">
                    <div>
                      <label className="admin-label">שם לקישור</label>
                      <input
                        type="text"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        placeholder="לדוגמה: תיקיית דרייב של הלקוח"
                        className="admin-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-label">כתובת קישור מלאה</label>
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="admin-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-label">תיאור (אופציונלי)</label>
                      <textarea
                        value={linkDescription}
                        onChange={(e) => setLinkDescription(e.target.value)}
                        placeholder="תיאור הקישור..."
                        className="admin-textarea"
                        rows="3"
                      />
                    </div>
                    <Button type="submit" variant="primary" disabled={uploading}>
                      {uploading && uploadKind === 'file' ? buttonText(uploadStage, 'שמור קישור') : 'שמור קישור'}
                    </Button>
                  </form>
                )}
              </Card>

              {nonAudioFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nonAudioFiles.map((file) => (
                    <Card key={file._id}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-neutral-900 break-words">{file.name}</h4>
                        <button
                          onClick={() => handleDeleteFile(file._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          מחק
                        </button>
                      </div>
                      {file.description && (
                        <p className="text-sm text-neutral-600 mb-2">{file.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-neutral-500">
                          {file.type}
                          {Number.isFinite(file.size) && file.size > 0
                            ? ` | ${(file.size / 1024).toFixed(1)} KB`
                            : ''}
                        </span>
                        <a
                          href={resolveCustomerFileUrl(file.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline text-sm"
                        >
                          צפה בקובץ →
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📁"
                  title="אין קבצים עדיין"
                  description="העלו מסמכים רלוונטיים כדי שיופיעו כאן."
                />
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-semibold mb-4">העלאת אודיו ללקוח (Cloudinary)</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  קבצי אודיו יופיעו אצל הלקוח בלשונית «אודיו» בתיק האישי (השמעה בלבד).
                </p>
                <form onSubmit={handleAudioUpload} className="space-y-4">
                  <div>
                    <label className="admin-label">בחר קובץ אודיו</label>
                    <input
                      key={audioInputKey}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFileUpload(e.target.files?.[0] || null)}
                      className="admin-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-label">תיאור (אופציונלי)</label>
                    <textarea
                      value={audioFileDescription}
                      onChange={(e) => setAudioFileDescription(e.target.value)}
                      placeholder="למשל: הדרכת נשימה מהפגישה..."
                      className="admin-textarea"
                      rows="3"
                    />
                  </div>
                  <UploadProgressStatus
                    active={uploading && uploadKind === 'audio'}
                    stage={uploadStage}
                    progress={uploadProgress}
                    itemLabel="אודיו"
                  />
                  <Button type="submit" variant="primary" disabled={uploading}>
                    {uploading && uploadKind === 'audio'
                      ? buttonText(uploadStage, 'העלה אודיו')
                      : 'העלה אודיו'}
                  </Button>
                </form>
              </Card>

              {audioFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audioFiles.map((file) => (
                    <Card key={file._id}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-neutral-900 break-words">{file.name}</h4>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          מחק
                        </button>
                      </div>
                      {file.description && (
                        <p className="text-sm text-neutral-600 mb-2">{file.description}</p>
                      )}
                      <audio
                        className="w-full mt-3"
                        controls
                        preload="metadata"
                        src={resolveCustomerFileUrl(file.url)}
                      >
                        הדפדפן שלך לא תומך בהשמעת אודיו.
                      </audio>
                      <p className="text-xs text-neutral-500 mt-2">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🎧"
                  title="אין קבצי אודיו"
                  description="העלו כאן הקלטות או קבצי אודיו עבור הלקוח."
                />
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              {customer.bookings && customer.bookings.length > 0 ? (
                customer.bookings.map((booking) => (
                  <Card key={booking._id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg text-neutral-900">
                          {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          {booking.meetingType === 'zoom' ? '💻 אונליין' : '🏢 פרונטאלי'}
                          {booking.isIntroMeeting && ' | ⭐ פגישת היכרות'}
                        </p>
                        {booking.preferredTime && (
                          <p className="text-sm text-neutral-600 mt-1">🕐 שעה: {booking.preferredTime}</p>
                        )}
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
                            קישור אונליין עדיין לא נוסף
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
                      <Button
                        type="button"
                        variant="soft"
                        className="!px-3 !py-1.5 text-xs mt-2"
                        onClick={() => handleOpenEditBooking(booking)}
                      >
                        ערוך פגישה
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon="📅"
                  title="אין פגישות עדיין"
                  description="לא נמצאו הזמנות פגישות עבור לקוח זה."
                />
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-semibold mb-4">הוסף הערה</h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="כתוב הערה..."
                    className="admin-textarea"
                    rows="4"
                    required
                  />
                  <Button type="submit" variant="primary">
                    שמור הערה
                  </Button>
                </form>
              </Card>

              {customer.notes && customer.notes.length > 0 ? (
                <div className="space-y-4">
                  {customer.notes.slice().reverse().map((note, index) => (
                    <Card key={index}>
                      <p className="mb-2 text-neutral-900 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(note.createdAt).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="📝"
                  title="אין הערות עדיין"
                  description="הוסיפו הערה פנימית — היא תופיע כאן בסדר כרונולוגי."
                />
              )}
            </div>
          )}
      </AdminPageShell>

      {/* Password Modal */}
      {showPasswordModal && (
        <AdminModalLayout
          title={
            isResetPassword ? 'סיסמה ראשונית חדשה נוצרה' : 'משתמש נוצר בהצלחה'
          }
          maxWidthClass="max-w-md"
          onClose={() => {
            setShowPasswordModal(false)
            setInitialPassword('')
            setIsResetPassword(false)
          }}
          footer={
            <>
              <Button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(initialPassword)
                  toast.success('סיסמה הועתקה ללוח!')
                }}
                variant="soft"
                className="flex-1"
              >
                העתק סיסמה
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false)
                  setInitialPassword('')
                  setIsResetPassword(false)
                }}
                variant="primary"
                className="flex-1"
              >
                סגור
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600 mb-2">אימייל:</p>
              <p className="font-semibold text-lg">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-2">סיסמה ראשונית:</p>
              <div className="rounded-xl border-2 border-primary-500 bg-neutral-100 p-4">
                <p className="text-center font-mono text-xl font-bold text-primary-700">
                  {initialPassword}
                </p>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                אנא העברו את הסיסמה ללקוח. הוא יוכל לשנות אותה בהתחברות הראשונה.
              </p>
            </div>
          </div>
        </AdminModalLayout>
      )}

      {editingBooking && (
        <AdminModalLayout
          title="עריכת פגישה"
          onClose={handleCloseEditBooking}
          footer={
            <>
              <Button type="button" variant="soft" onClick={handleCloseEditBooking}>
                ביטול
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveBookingEdit}
                disabled={savingBookingEdit}
              >
                {savingBookingEdit ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="admin-label">תאריך *</label>
              <input
                type="date"
                className="admin-input"
                value={bookingEditForm.preferredDate}
                onChange={(e) =>
                  setBookingEditForm((prev) => ({ ...prev, preferredDate: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="admin-label">שעה</label>
              <input
                type="time"
                className="admin-input"
                value={bookingEditForm.preferredTime}
                onChange={(e) =>
                  setBookingEditForm((prev) => ({ ...prev, preferredTime: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="admin-label">סוג פגישה</label>
              <select
                className="admin-input"
                value={bookingEditForm.meetingType}
                onChange={(e) =>
                  setBookingEditForm((prev) => ({ ...prev, meetingType: e.target.value }))
                }
              >
                <option value="frontend">פרונטאלי</option>
                <option value="zoom">אונליין</option>
              </select>
            </div>
            <div>
              <label className="admin-label">הערות</label>
              <textarea
                rows="4"
                className="admin-textarea"
                value={bookingEditForm.notes}
                onChange={(e) =>
                  setBookingEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </AdminModalLayout>
      )}
    </>
  )
}

export default CustomerPage

