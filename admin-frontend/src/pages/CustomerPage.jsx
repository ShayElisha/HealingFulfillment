import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customerService } from '../services/customerApi'
import { purchaseService } from '../services/adminApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function CustomerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [fileUpload, setFileUpload] = useState(null)
  const [fileDescription, setFileDescription] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [initialPassword, setInitialPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)

  useEffect(() => {
    loadCustomer()
  }, [id])

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

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!fileUpload) {
      toast.error('אנא בחר קובץ להעלאה')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', fileUpload)
    formData.append('description', fileDescription)

    try {
      await customerService.uploadFile(id, formData)
      await loadCustomer()
      setFileUpload(null)
      setFileDescription('')
      e.target.reset()
      toast.success('קובץ הועלה בהצלחה!')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('שגיאה בהעלאת הקובץ')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקובץ?')) {
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

  const handleUpdatePurchaseStatus = async (purchaseId, newStatus) => {
    if (!confirm(`האם אתה בטוח שברצונך לשנות את סטטוס הרכישה ל-${newStatus === 'completed' ? 'הושלם' : newStatus === 'cancelled' ? 'בוטל' : 'ממתין'}?`)) {
      return
    }

    try {
      await purchaseService.updateStatus(purchaseId, newStatus)
      await loadCustomer()
      toast.success('סטטוס הרכישה עודכן בהצלחה!')
    } catch (error) {
      console.error('Error updating purchase status:', error)
      toast.error('שגיאה בעדכון סטטוס הרכישה')
    }
  }

  const handleCreateAccount = async () => {
    if (!confirm('האם אתה בטוח שברצונך ליצור משתמש ללקוח זה?')) {
      return
    }

    setCreatingAccount(true)
    setIsResetPassword(false)
    try {
      const response = await customerService.createAccount(id)
      setInitialPassword(response.data.initialPassword)
      setShowPasswordModal(true)
      await loadCustomer()
    } catch (error) {
      console.error('Error creating account:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה ביצירת משתמש'
      toast.error(errorMessage)
    } finally {
      setCreatingAccount(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm('האם אתה בטוח שברצונך ליצור סיסמה ראשונית חדשה? הלקוח יצטרך להתחבר עם הסיסמה החדשה ולשנות אותה.')) {
      return
    }

    setCreatingAccount(true)
    setIsResetPassword(true)
    try {
      const response = await customerService.resetPassword(id)
      setInitialPassword(response.data.initialPassword)
      setShowPasswordModal(true)
      await loadCustomer()
    } catch (error) {
      console.error('Error resetting password:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה ביצירת סיסמה חדשה'
      toast.error(errorMessage)
    } finally {
      setCreatingAccount(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar activeTab="customers" onTabChange={() => {}} purchasesCount={0} bookingsCount={0} />
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <p className="text-xl text-neutral-600">טוען...</p>
        </div>
      </>
    )
  }

  if (!customer) {
    return (
      <>
        <Navbar activeTab="customers" onTabChange={() => {}} purchasesCount={0} bookingsCount={0} />
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-neutral-600 mb-4">לקוח לא נמצא</p>
            <Button onClick={() => navigate('/')} variant="primary">
              חזור לדף הראשי
            </Button>
          </div>
        </div>
      </>
    )
  }

  const stats = {
    totalSessions: customer.bookings?.length || 0,
    confirmedSessions: customer.bookings?.filter(b => b.status === 'confirmed').length || 0,
    completedCourses: customer.purchases?.filter(p => p.status === 'completed').length || 0,
    totalSpent: customer.purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0
  }

  return (
    <>
      <Navbar activeTab="customers" onTabChange={() => {}} purchasesCount={0} bookingsCount={0} />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              ← חזור לרשימת לקוחות
            </button>
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
              תיק לקוח: {customer.name}
            </h1>
            <p className="text-neutral-600">{customer.email} | {customer.phone}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-neutral-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'סקירה כללית' },
              { id: 'files', label: `קבצים (${customer.files?.length || 0})` },
              { id: 'sessions', label: `פגישות (${customer.bookings?.length || 0})` },
              { id: 'notes', label: `הערות (${customer.notes?.length || 0})` }
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
              {/* Account Creation Section */}
              <Card>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">חשבון משתמש</h3>
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
                      </div>
                    ) : (
                      <div>
                        <p className="text-neutral-600 mb-4">למשתמש זה אין חשבון פעיל</p>
                        <Button
                          onClick={handleCreateAccount}
                          variant="primary"
                          disabled={creatingAccount}
                        >
                          {creatingAccount ? 'יוצר...' : 'צור משתמש ללקוח'}
                        </Button>
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
                    {customer.purchases.slice(0, 5).map((purchase) => (
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
                            {purchase.course?.sessionsCount && (
                              <p className="text-sm text-neutral-600 mt-1">
                                כמות מפגשים: {purchase.course.sessionsCount}
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
                        
                        {/* Status Change Dropdown */}
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            שנה סטטוס:
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleUpdatePurchaseStatus(purchase._id, 'pending')}
                              disabled={purchase.status === 'pending'}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                purchase.status === 'pending'
                                  ? 'bg-yellow-200 text-yellow-800 cursor-not-allowed'
                                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                              }`}
                            >
                              ממתין
                            </button>
                            <button
                              onClick={() => handleUpdatePurchaseStatus(purchase._id, 'completed')}
                              disabled={purchase.status === 'completed'}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                purchase.status === 'completed'
                                  ? 'bg-green-200 text-green-800 cursor-not-allowed'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              הושלם
                            </button>
                            <button
                              onClick={() => handleUpdatePurchaseStatus(purchase._id, 'cancelled')}
                              disabled={purchase.status === 'cancelled'}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                purchase.status === 'cancelled'
                                  ? 'bg-red-200 text-red-800 cursor-not-allowed'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              בוטל
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-semibold mb-4">העלאת קובץ חדש</h3>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-700">
                      בחר קובץ
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setFileUpload(e.target.files[0])}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-700">
                      תיאור הקובץ (אופציונלי)
                    </label>
                    <textarea
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      placeholder="תיאור הקובץ..."
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg"
                      rows="3"
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={uploading}>
                    {uploading ? 'מעלה...' : 'העלה קובץ'}
                  </Button>
                </form>
              </Card>

              {customer.files && customer.files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customer.files.map((file) => (
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
                          {file.type} | {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <a
                          href={file.url}
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
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין קבצים עדיין</p>
                </Card>
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
                            קישור זום עדיין לא נוסף
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
                  <p className="text-center text-neutral-500 py-8">אין פגישות עדיין</p>
                </Card>
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
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                <Card>
                  <p className="text-center text-neutral-500 py-8">אין הערות עדיין</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-4">
              {isResetPassword ? 'סיסמה ראשונית חדשה נוצרה!' : 'משתמש נוצר בהצלחה!'}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-2">אימייל:</p>
                <p className="font-semibold text-lg">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">סיסמה ראשונית:</p>
                <div className="bg-neutral-100 p-4 rounded-lg border-2 border-primary-500">
                  <p className="font-mono text-xl font-bold text-center text-primary-700">
                    {initialPassword}
                  </p>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  ⚠ אנא העבר את הסיסמה ללקוח. הוא יוכל לשנות אותה בהתחברות הראשונה.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
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
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

export default CustomerPage

