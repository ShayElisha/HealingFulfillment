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
      console.log('[ContactForm] Submitting form data:', formData)
      const result = await contactService.submit(formData)
      console.log('[ContactForm] Submit successful:', result)
      setSubmitStatus({ type: 'success', message: 'ההודעה נשלחה בהצלחה! ניצור איתך קשר בקרוב.' })
      setFormData({ name: '', phone: '', email: '', message: '' })
    } catch (error) {
      console.error('[ContactForm] Submit error:', error)
      console.error('[ContactForm] Error response:', error.response)
      console.error('[ContactForm] Error message:', error.message)
      console.error('[ContactForm] Error code:', error.code)
      
      // Show more detailed error message
      let errorMessage = 'אירעה שגיאה בשליחת ההודעה. אנא נסה שוב או צור קשר ישירות.'
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status
        const data = error.response.data
        
        if (status === 400 && data?.errors) {
          // Validation errors
          errorMessage = 'אנא מלא את כל השדות הנדרשים'
        } else if (data?.message) {
          errorMessage = data.message
        } else if (status === 500) {
          errorMessage = 'שגיאת שרת. אנא נסה שוב מאוחר יותר.'
        } else if (status === 404) {
          errorMessage = 'שירות לא זמין כרגע. אנא נסה שוב מאוחר יותר.'
        }
      } else if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        errorMessage = 'לא ניתן להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.'
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'בעיית רשת. אנא נסה שוב.'
      }
      
      setSubmitStatus({
        type: 'error',
        message: errorMessage,
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

