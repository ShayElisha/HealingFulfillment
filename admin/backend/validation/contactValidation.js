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
  console.log('[Contact Validation] Validating request body')
  console.log('[Contact Validation] Body type:', typeof req.body)
  console.log('[Contact Validation] Body:', JSON.stringify(req.body))
  
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('[Contact Validation] Request body is empty or undefined')
    return res.status(400).json({
      message: 'Validation error',
      error: 'Request body is required',
      errors: [{ field: 'body', message: 'Request body cannot be empty' }]
    })
  }
  
  const { error, value } = contactSchema.validate(req.body, { abortEarly: false })
  
  if (error) {
    console.error('[Contact Validation] Validation failed:', error.details)
    return res.status(400).json({
      message: 'Validation error',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    })
  }
  
  console.log('[Contact Validation] Validation passed')
  req.body = value
  next()
}

