import Joi from 'joi'

export const bookingSchema = Joi.object({
  name: Joi.string().required().trim().max(100).messages({
    'string.empty': 'שם הוא שדה חובה',
    'string.max': 'שם לא יכול לעלות על 100 תווים'
  }),
  phone: Joi.string().required().trim().messages({
    'string.empty': 'טלפון הוא שדה חובה'
  }),
  email: Joi.string().email().trim().lowercase().allow('').messages({
    'string.email': 'אנא הכנס כתובת אימייל תקינה'
  }),
  preferredDate: Joi.date().required().min('now').messages({
    'date.base': 'תאריך לא תקין',
    'date.min': 'תאריך לא יכול להיות בעבר',
    'any.required': 'תאריך מועדף הוא שדה חובה'
  }),
  preferredTime: Joi.string().trim().allow(''),
  meetingType: Joi.string().valid('frontend', 'zoom').default('frontend').required().messages({
    'any.only': 'סוג פגישה חייב להיות פרונטאלי או זום',
    'any.required': 'סוג פגישה הוא שדה חובה'
  }),
  notes: Joi.string().max(1000).allow('').messages({
    'string.max': 'הערות לא יכולות לעלות על 1000 תווים'
  })
})

export const validateBooking = (req, res, next) => {
  const { error, value } = bookingSchema.validate(req.body, { abortEarly: false })
  
  if (error) {
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

