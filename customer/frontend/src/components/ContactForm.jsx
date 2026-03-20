import { useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { contactService } from '../services/api'
import Button from './Button'
import { triggerConfetti } from '../utils/confetti'
import toast from 'react-hot-toast'

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phone, setPhone] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedMessage = formData.message.trim()
    const trimmedEmail = formData.email.trim()

    if (!phone || !isValidPhoneNumber(phone)) {
      toast.error('אנא הזן מספר טלפון תקין כולל קידומת מדינה.')
      return
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        toast.error('אנא הזן כתובת אימייל תקינה.')
        return
      }
    }

    if (!trimmedMessage) {
      toast.error('שדה ההודעה הוא שדה חובה.')
      return
    }

    setIsSubmitting(true)

    try {
      await contactService.submit({
        ...formData,
        phone,
        email: trimmedEmail,
        message: trimmedMessage,
      })
      triggerConfetti()
      toast.success('ההודעה נשלחה בהצלחה! ניצור איתך קשר בקרוב.')
      setFormData({ name: '', phone: '', email: '', message: '' })
      setPhone('')
    } catch (error) {
      toast.error('אירעה שגיאה בשליחת ההודעה. אנא נסה שוב או צור קשר ישירות.')
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
        <PhoneInput
          id="phone"
          international
          defaultCountry="IL"
          value={phone}
          onChange={setPhone}
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all"
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
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
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

