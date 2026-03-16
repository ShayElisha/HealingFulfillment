import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const QUESTIONS = [
  {
    id: 1,
    question: 'מה המטרה העיקרית שלך בטיפול?',
    type: 'radio',
    options: [
      'להתמודד עם חרדה או מתח',
      'לשפר את הביטחון העצמי',
      'לטפל בטראומה או חוויות קשות',
      'לשפר מערכות יחסים',
      'למצוא כיוון ומשמעות בחיים',
      'אחר'
    ]
  },
  {
    id: 2,
    question: 'האם יש לך ניסיון קודם בטיפול נפשי?',
    type: 'radio',
    options: [
      'כן, טיפלתי בעבר',
      'לא, זו הפעם הראשונה',
      'כן, אבל לא היה מוצלח',
      'אני לא בטוח/ה'
    ]
  },
  {
    id: 3,
    question: 'מה רמת המוכנות שלך לעבודה עצמית מחוץ לפגישות?',
    type: 'radio',
    options: [
      'מוכן/ה מאוד לעבוד גם בבית',
      'מוכן/ה לעבוד מעט',
      'מעדיף/ה רק פגישות',
      'לא בטוח/ה'
    ]
  },
  {
    id: 4,
    question: 'מה הזמינות שלך לפגישות?',
    type: 'radio',
    options: [
      'גמיש/ה מאוד',
      'יש לי זמנים מועדפים',
      'מוגבל/ת בזמן',
      'אני לא בטוח/ה'
    ]
  },
  {
    id: 5,
    question: 'מה הסגנון הטיפולי שמתאים לך?',
    type: 'checkbox',
    options: [
      'טיפול דינמי',
      'טיפול קוגניטיבי-התנהגותי (CBT)',
      'טיפול בגישה הוליסטית',
      'טיפול קצר מועד',
      'טיפול ארוך טווח',
      'אני לא יודע/ת'
    ]
  }
]

function QuestionnaireModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    additionalNotes: ''
  })
  const [nextStep, setNextStep] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAnswer = (questionId, answer) => {
    const question = QUESTIONS.find(q => q.id === questionId)
    
    if (question.type === 'checkbox') {
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || []
        if (currentAnswers.includes(answer)) {
          return { ...prev, [questionId]: currentAnswers.filter(a => a !== answer) }
        } else {
          return { ...prev, [questionId]: [...currentAnswers, answer] }
        }
      })
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }
  }

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone) {
      toast.error('אנא מלא שם וטלפון')
      return
    }

    if (!nextStep) {
      toast.error('אנא בחר מה תרצה לעשות לאחר מילוי השאלון')
      return
    }

    // Prepare answers array
    const answersArray = QUESTIONS.map(q => ({
      question: q.question,
      answer: Array.isArray(answers[q.id]) 
        ? answers[q.id].join(', ')
        : answers[q.id] || 'לא ענה'
    }))

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          answers: answersArray,
          additionalNotes: formData.additionalNotes,
          nextStep
        })
      })

      if (!response.ok) {
        throw new Error('שגיאה בשליחת השאלון')
      }

      toast.success('השאלון נשלח בהצלחה!')
      
      if (nextStep === 'book_appointment') {
        onClose()
        navigate('/booking')
      } else {
        onClose()
        toast.success('ניצור איתך קשר בהקדם!')
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
      toast.error('שגיאה בשליחת השאלון. אנא נסה שוב.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(0)
    setAnswers({})
    setFormData({ name: '', phone: '', email: '', additionalNotes: '' })
    setNextStep('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const currentQuestion = QUESTIONS[currentStep]
  const isLastQuestion = currentStep === QUESTIONS.length - 1
  const allQuestionsAnswered = QUESTIONS.every(q => {
    if (q.type === 'checkbox') {
      return answers[q.id] && answers[q.id].length > 0
    }
    return answers[q.id]
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-serif font-bold mb-1">שאלון התאמה</h2>
                    <p className="text-primary-100 text-sm">
                      שאלה {currentStep + 1} מתוך {QUESTIONS.length}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {!isLastQuestion ? (
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                      {currentQuestion.question}
                    </h3>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const isSelected = currentQuestion.type === 'checkbox'
                          ? (answers[currentQuestion.id] || []).includes(option)
                          : answers[currentQuestion.id] === option

                        return (
                          <button
                            key={index}
                            onClick={() => handleAnswer(currentQuestion.id, option)}
                            className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{option}</span>
                              {currentQuestion.type === 'checkbox' && isSelected && (
                                <span className="text-primary-600">✓</span>
                              )}
                              {currentQuestion.type === 'radio' && isSelected && (
                                <span className="w-5 h-5 rounded-full border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
                                  <span className="w-2 h-2 bg-white rounded-full"></span>
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                        פרטי יצירת קשר
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            שם מלא *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            טלפון *
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            אימייל (אופציונלי)
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            הערות נוספות (אופציונלי)
                          </label>
                          <textarea
                            value={formData.additionalNotes}
                            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                            rows="4"
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                            placeholder="יש משהו נוסף שתרצה לשתף?"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                        מה תרצה לעשות לאחר מילוי השאלון?
                      </h3>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setNextStep('book_appointment')}
                          className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                            nextStep === 'book_appointment'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">קבע פגישה ראשונית</div>
                              <div className="text-sm mt-1">אני רוצה לקבוע פגישה עכשיו</div>
                            </div>
                            {nextStep === 'book_appointment' && (
                              <span className="text-primary-600">✓</span>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextStep('wait_for_contact')}
                          className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                            nextStep === 'wait_for_contact'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">שהמטפל יצור איתי קשר</div>
                              <div className="text-sm mt-1">אני מעדיף שהמטפל יצור איתי קשר</div>
                            </div>
                            {nextStep === 'wait_for_contact' && (
                              <span className="text-primary-600">✓</span>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-200 p-6 bg-neutral-50">
                <div className="flex gap-4">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex-1 px-6 py-3 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-white transition-colors font-medium"
                    >
                      חזור
                    </button>
                  )}
                  {!isLastQuestion ? (
                    <button
                      onClick={handleNext}
                      disabled={!answers[currentQuestion.id] || (currentQuestion.type === 'checkbox' && answers[currentQuestion.id]?.length === 0)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      הבא
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !formData.name?.trim() || !formData.phone?.trim() || !nextStep}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'שולח...' : 'שלח שאלון'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default QuestionnaireModal

