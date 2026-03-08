import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePurchase } from '../context/PurchaseContext'
import { coursesService } from '../services/coursesApi'
import { purchaseService } from '../services/purchaseApi'
import Button from './Button'

function PurchaseModal() {
  const { isModalOpen, selectedCourse, closePurchaseModal } = usePurchase()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState('select') // 'select' or 'form'
  const [selectedCourseForPurchase, setSelectedCourseForPurchase] = useState(null)
  const [purchaseForm, setPurchaseForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMethod: 'other',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  useEffect(() => {
    if (isModalOpen) {
      loadCourses()
      // If a course was pre-selected, go directly to form
      if (selectedCourse) {
        setSelectedCourseForPurchase(selectedCourse)
        setCurrentStep('form')
      } else {
        setCurrentStep('select')
      }
    }
  }, [isModalOpen, selectedCourse])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const response = await coursesService.getAll()
      setCourses(response.data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = (course) => {
    setSelectedCourseForPurchase(course)
    setCurrentStep('form')
    setPurchaseForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      paymentMethod: 'other',
      notes: ''
    })
    setSubmitStatus(null)
  }

  const handleBackToSelect = () => {
    setCurrentStep('select')
    setSelectedCourseForPurchase(null)
    setSubmitStatus(null)
  }

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await purchaseService.create({
        courseId: selectedCourseForPurchase._id,
        ...purchaseForm
      })
      setSubmitStatus({
        type: 'success',
        message: 'בקשת הרכישה נשלחה בהצלחה! ניצור איתך קשר בקרוב להשלמת התשלום.'
      })
      setTimeout(() => {
        closePurchaseModal()
        setCurrentStep('select')
        setSelectedCourseForPurchase(null)
      }, 3000)
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'אירעה שגיאה בשליחת בקשת הרכישה. אנא נסה שוב או צור קשר ישירות.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isModalOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closePurchaseModal}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              {currentStep === 'select' ? 'בחר מסלול' : 'טופס הרשמה'}
            </h2>
            <button
              onClick={closePurchaseModal}
              className="text-neutral-400 hover:text-neutral-600 text-2xl"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'select' ? (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600">טוען מסלולים...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600 mb-4">אין מסלולים זמינים כרגע</p>
                    <Button to="/contact" variant="primary" onClick={closePurchaseModal}>
                      צור קשר למידע נוסף
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-neutral-600 mb-6 text-center">
                      בחר את המסלול המתאים לך
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <motion.div
                          key={course._id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="border-2 border-neutral-200 rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors"
                          onClick={() => handleCourseSelect(course)}
                        >
                          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                            {course.title}
                          </h3>
                          {course.description && (
                            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                          {course.sessionsCount && (
                            <p className="text-xs text-neutral-500 mb-2">
                              {course.sessionsCount} מפגש{course.sessionsCount > 1 ? 'ים' : ''}
                            </p>
                          )}
                          {course.price > 0 && (
                            <div className="mt-3">
                              <span className="text-xl font-bold text-primary-600">
                                ₪{course.price}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {selectedCourseForPurchase && (
                  <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {selectedCourseForPurchase.title}
                    </h3>
                    {selectedCourseForPurchase.price > 0 && (
                      <p className="text-2xl font-bold text-primary-600 mb-2">
                        ₪{selectedCourseForPurchase.price}
                      </p>
                    )}
                    {selectedCourseForPurchase.description && (
                      <p className="text-sm text-neutral-600">
                        {selectedCourseForPurchase.description}
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-900">
                      שם מלא *
                    </label>
                    <input
                      type="text"
                      required
                      value={purchaseForm.customerName}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, customerName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="הזן שם מלא"
                    />
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
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="הזן כתובת אימייל"
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
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="הזן מספר טלפון"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-900">
                      שיטת תשלום
                    </label>
                    <select
                      value={purchaseForm.paymentMethod}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="other">אחר</option>
                      <option value="credit_card">כרטיס אשראי</option>
                      <option value="bank_transfer">העברה בנקאית</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-900">
                      הערות
                    </label>
                    <textarea
                      value={purchaseForm.notes}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="הערות נוספות..."
                    />
                  </div>
                  {submitStatus && (
                    <div
                      className={`p-4 rounded-lg ${
                        submitStatus.type === 'success'
                          ? 'bg-primary-50 text-primary-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {submitStatus.message}
                    </div>
                  )}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="soft"
                      onClick={handleBackToSelect}
                      disabled={isSubmitting}
                    >
                      חזור לבחירה
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'שולח...' : 'שלח בקשת רכישה'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PurchaseModal

