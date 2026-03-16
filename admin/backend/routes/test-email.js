import express from 'express'
import { sendEmail } from '../services/emailService.js'

const router = express.Router()

// GET /api/test-email - Test email sending
router.get('/', async (req, res) => {
  const testEmail = req.query.email || process.env.SMTP_USER
  
  if (!testEmail) {
    return res.status(400).json({
      message: 'Please provide email address as query parameter: ?email=your@email.com'
    })
  }

  console.log('🧪 Testing email to:', testEmail)

  const result = await sendEmail({
    to: testEmail,
    subject: 'בדיקת מערכת אימייל - ריפוי והגשמה',
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>✅ זהו אימייל בדיקה</h2>
        <p>אם אתה רואה את האימייל הזה, המערכת עובדת!</p>
        <p><strong>תאריך ושעה:</strong> ${new Date().toLocaleString('he-IL')}</p>
        <p><strong>כתובת אימייל:</strong> ${testEmail}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">אם האימייל הזה הגיע, כל האימיילים האוטומטיים יעבדו גם כן!</p>
      </div>
    `
  })

  if (result.success) {
    res.json({
      message: 'Email sent successfully!',
      messageId: result.messageId,
      response: result.response
    })
  } else {
    // Provide detailed error information
    const errorResponse = {
      message: result.message || 'Failed to send email',
      error: result.error,
      code: result.code,
      ...(result.missingVariables && {
        missingVariables: result.missingVariables,
        instructions: result.instructions
      })
    }
    
    // If SMTP credentials are missing, provide setup instructions
    if (result.error && result.error.includes('SMTP credentials missing')) {
      errorResponse.setupInstructions = {
        step1: 'Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        step2: 'Add the following environment variables:',
        required: {
          SMTP_USER: 'Your email address (e.g., your-email@gmail.com)',
          SMTP_PASSWORD: 'Your email password or App Password (for Gmail)'
        },
        optional: {
          SMTP_HOST: 'SMTP server host (default: smtp.gmail.com)',
          SMTP_PORT: 'SMTP server port (default: 587)'
        },
        step3: 'After adding variables, redeploy your project',
        step4: 'For Gmail: Create App Password at Google Account → Security → 2-Step Verification → App passwords'
      }
    }
    
    res.status(500).json(errorResponse)
  }
})

export default router

