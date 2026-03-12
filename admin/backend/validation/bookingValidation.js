import Joi from 'joi'

export const bookingSchema = Joi.object({
  name: Joi.string().required().trim().max(100).messages({
    'string.empty': 'שם הוא שדה חובה',
    'string.max': 'שם לא יכול לעלות על 100 תווים'
  }),
  phone: Joi.string().required().trim().messages({
    'string.empty': 'טלפון הוא שדה חובה'
  }),
  email: Joi.string().trim().lowercase().allow('', null).optional().custom((value, helpers) => {
    // אם יש ערך ולא ריק, בדוק שהוא אימייל תקין
    if (value && value.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return helpers.error('string.email')
      }
    }
    return value || undefined
  }).messages({
    'string.email': 'אנא הכנס כתובת אימייל תקינה'
  }),
  preferredDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string()
  ).required().custom((value, helpers) => {
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      return helpers.error('date.base')
    }
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const inputDate = new Date(date)
    inputDate.setHours(0, 0, 0, 0)
    if (inputDate < now) {
      return helpers.error('date.min')
    }
    return date
  }).messages({
    'date.base': 'תאריך לא תקין',
    'date.min': 'תאריך לא יכול להיות בעבר',
    'any.required': 'תאריך מועדף הוא שדה חובה'
  }),
  preferredTime: Joi.string().trim().allow('', null).optional(),
  meetingType: Joi.string().valid('frontend', 'zoom').default('frontend').required().messages({
    'any.only': 'סוג פגישה חייב להיות פרונטאלי או זום',
    'any.required': 'סוג פגישה הוא שדה חובה'
  }),
  notes: Joi.string().max(1000).allow('', null).optional().messages({
    'string.max': 'הערות לא יכולות לעלות על 1000 תווים'
  }),
  isIntroMeeting: Joi.boolean().optional()
})

export const validateBooking = (req, res, next) => {
  // ניקוי אימייל ריק לפני validation
  if (req.body.email === '' || req.body.email === null || req.body.email === undefined) {
    req.body.email = undefined
  }
  
  // ניקוי preferredTime ריק
  if (req.body.preferredTime === '' || req.body.preferredTime === null) {
    req.body.preferredTime = undefined
  }
  
  // ניקוי notes ריק
  if (req.body.notes === '' || req.body.notes === null) {
    req.body.notes = undefined
  }
  
  const { error, value } = bookingSchema.validate(req.body, { abortEarly: false })
  
  if (error) {
    console.log('📋 Validation error details:', JSON.stringify(error.details, null, 2))
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2))
    return res.status(400).json({
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  req.body = value
  next()
}

