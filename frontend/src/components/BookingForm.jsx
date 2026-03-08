import { useState } from 'react'
import { bookingService } from '../services/api'
import Button from './Button'

function BookingForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    meetingType: 'frontend',
    notes: '',
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
      await bookingService.submit(formData)
      setSubmitStatus({
        type: 'success',
        message: 'הבקשה נשלחה בהצלחה! ניצור איתך קשר בקרוב לאישור הפגישה.',
      })
      setFormData({
        name: '',
        phone: '',
        email: '',
        preferredDate: '',
        preferredTime: '',
        meetingType: 'frontend',
        notes: '',
      })
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'אירעה שגיאה בשליחת הבקשה. אנא נסה שוב או צור קשר ישירות.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          סוג פגישה *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
            formData.meetingType === 'frontend'
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-300 hover:border-primary-300'
          }`}>
            <input
              type="radio"
              name="meetingType"
              value="frontend"
              checked={formData.meetingType === 'frontend'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.meetingType === 'frontend'
                  ? 'border-primary-500'
                  : 'border-neutral-400'
              }`}>
                {formData.meetingType === 'frontend' && (
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
            formData.meetingType === 'zoom'
              ? 'border-primary-500 bg-primary-50'
              : 'border-neutral-300 hover:border-primary-300'
          }`}>
            <input
              type="radio"
              name="meetingType"
              value="zoom"
              checked={formData.meetingType === 'zoom'}
              onChange={handleChange}
              className="sr-only"
            />
            <div className="flex items-center gap-3 w-full">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.meetingType === 'zoom'
                  ? 'border-primary-500'
                  : 'border-neutral-400'
              }`}>
                {formData.meetingType === 'zoom' && (
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                )}
              </div>
              <div>
                <div className="font-medium text-neutral-900">פגישה בזום</div>
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
            name="preferredDate"
            required
            value={formData.preferredDate}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label htmlFor="preferredTime" className="block text-sm font-medium text-neutral-700 mb-2">
            שעה מועדפת
          </label>
          <select
            id="preferredTime"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="">בחר שעה</option>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
            <option value="13:00">13:00</option>
            <option value="14:00">14:00</option>
            <option value="15:00">15:00</option>
            <option value="16:00">16:00</option>
            <option value="17:00">17:00</option>
            <option value="18:00">18:00</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-2">
          הערות נוספות
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          placeholder="יש משהו נוסף שתרצה שנדע לפני הפגישה?"
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
        {isSubmitting ? 'שולח...' : 'שלח בקשה לפגישה'}
      </Button>
    </form>
  )
}

export default BookingForm

