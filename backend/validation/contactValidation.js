import Joi from 'joi'

export const contactSchema = Joi.object({
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
  message: Joi.string().required().max(2000).messages({
    'string.empty': 'הודעה היא שדה חובה',
    'string.max': 'הודעה לא יכולה לעלות על 2000 תווים'
  })
})

export const validateContact = (req, res, next) => {
  const { error, value } = contactSchema.validate(req.body, { abortEarly: false })
  
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

