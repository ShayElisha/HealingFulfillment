import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContact } from '../context/ContactContext'
import { contactService } from '../services/api'
import Button from './Button'
import { triggerConfetti } from '../utils/confetti'
import toast from 'react-hot-toast'

function ContactModal() {
  const { isModalOpen, closeContactModal } = useContact()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isModalOpen) {
      // Reset form when modal closes
      setFormData({ name: '', phone: '', email: '', message: '' })
    }
  }, [isModalOpen])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await contactService.submit(formData)
      triggerConfetti()
      toast.success('ההודעה נשלחה בהצלחה! ניצור איתך קשר בקרוב.')
      setFormData({ name: '', phone: '', email: '', message: '' })
      // Close modal after 2 seconds on success
      setTimeout(() => {
        closeContactModal()
      }, 2000)
    } catch (error) {
      toast.error('אירעה שגיאה בשליחת ההודעה. אנא נסה שוב או צור קשר ישירות.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeContactModal}
        >
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
                צור קשר
              </h2>
              <button
                onClick={closeContactModal}
                className="text-neutral-400 hover:text-neutral-600 text-2xl"
                aria-label="סגור"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="modal-name" className="block text-sm font-medium text-neutral-700 mb-2">
                    שם מלא *
                  </label>
                  <input
                    type="text"
                    id="modal-name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="הכנס את שמך המלא"
                  />
                </div>

                <div>
                  <label htmlFor="modal-phone" className="block text-sm font-medium text-neutral-700 mb-2">
                    טלפון *
                  </label>
                  <input
                    type="tel"
                    id="modal-phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="050-123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="modal-email" className="block text-sm font-medium text-neutral-700 mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    id="modal-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="modal-message" className="block text-sm font-medium text-neutral-700 mb-2">
                    הודעה *
                  </label>
                  <textarea
                    id="modal-message"
                    name="message"
                    required
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    placeholder="ספר לי קצת על מה תרצה לדבר..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="soft"
                    onClick={closeContactModal}
                    disabled={isSubmitting}
                  >
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'שולח...' : 'שלח הודעה'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ContactModal

