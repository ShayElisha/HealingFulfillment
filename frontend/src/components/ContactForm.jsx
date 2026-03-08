import { useState } from 'react'
import { contactService } from '../services/api'
import Button from './Button'

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await contactService.submit(formData)
      setSubmitStatus({ type: 'success', message: 'ההודעה נשלחה בהצלחה! ניצור איתך קשר בקרוב.' })
      setFormData({ name: '', phone: '', email: '', message: '' })
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'אירעה שגיאה בשליחת ההודעה. אנא נסה שוב או צור קשר ישירות.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
          שם מלא *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="הכנס את שמך המלא"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
          טלפון *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="050-123-4567"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
          אימייל
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-2">
          הודעה *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows="5"
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          placeholder="ספר לי קצת על מה תרצה לדבר..."
        />
      </div>

      {submitStatus && (
        <div
          className={`p-4 rounded-xl ${
            submitStatus.type === 'success'
              ? 'bg-primary-50 text-primary-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full md:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'שולח...' : 'שלח הודעה'}
      </Button>
    </form>
  )
}

export default ContactForm

