import { useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { bookingService } from '../services/api'
import Button from './Button'
import { triggerConfetti } from '../utils/confetti'
import toast from 'react-hot-toast'

function BookingForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    meetingType: 'frontend',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phone, setPhone] = useState('')
  const [availability, setAvailability] = useState({
    unavailableTimes: [],
    isDateUnavailable: false,
  })
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const timeOptions = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ]

  const loadAvailability = async (date) => {
    if (!date) {
      setAvailability({ unavailableTimes: [], isDateUnavailable: false })
      return
    }

    try {
      setLoadingAvailability(true)
      const response = await bookingService.getAvailability(date)
      setAvailability({
        unavailableTimes: response?.data?.unavailableTimes || [],
        isDateUnavailable: Boolean(response?.data?.isDateUnavailable),
      })
    } catch (error) {
      console.error('Error loading availability:', error)
      setAvailability({ unavailableTimes: [], isDateUnavailable: false })
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'preferredDate') {
      setFormData((prev) => ({
        ...prev,
        preferredDate: value,
        preferredTime: '',
      }))
      loadAvailability(value)
      return
    }

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

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

    if (availability.isDateUnavailable) {
      toast.error('התאריך שבחרת כבר תפוס. אנא בחר תאריך אחר.')
      return
    }

    if (formData.preferredTime && availability.unavailableTimes.includes(formData.preferredTime)) {
      toast.error('השעה שבחרת כבר תפוסה. אנא בחר שעה אחרת.')
      return
    }

    setIsSubmitting(true)

    try {
      await bookingService.submit({
        ...formData,
        phone,
        email: trimmedEmail,
        isIntroMeeting: true // זה טופס לפגישת היכרות
      })
      triggerConfetti()
      toast.success('הבקשה נשלחה בהצלחה! ניצור איתך קשר בקרוב לאישור הפגישה.')
      setFormData({
        name: '',
        email: '',
        preferredDate: '',
        preferredTime: '',
        meetingType: 'frontend',
        notes: '',
      })
      setPhone('')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          (error.response?.data?.errors && Array.isArray(error.response.data.errors) 
                            ? error.response.data.errors.map(e => e.message || e).join(', ')
                            : '') ||
                          'אירעה שגיאה בשליחת הבקשה. אנא נסה שוב או צור קשר ישירות.'
      toast.error(errorMessage)
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
          <PhoneInput
            id="phone"
            international
            defaultCountry="IL"
            value={phone}
            onChange={setPhone}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all"
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
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
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
          {loadingAvailability && (
            <p className="text-xs text-neutral-500 mt-2">בודק זמינות...</p>
          )}
          {!loadingAvailability && availability.isDateUnavailable && (
            <p className="text-xs text-red-500 mt-2">התאריך תפוס. אנא בחר תאריך אחר.</p>
          )}
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
            disabled={availability.isDateUnavailable}
            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          >
            <option value="">בחר שעה</option>
            {timeOptions.map((time) => {
              const isUnavailable = availability.unavailableTimes.includes(time)
              return (
                <option key={time} value={time} disabled={isUnavailable}>
                  {time}{isUnavailable ? ' (תפוס)' : ''}
                </option>
              )
            })}
          </select>
          {!loadingAvailability && !availability.isDateUnavailable && availability.unavailableTimes.length > 0 && (
            <p className="text-xs text-neutral-500 mt-2">שעות מסומנות כ"תפוס" אינן זמינות לקביעה.</p>
          )}
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

