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
    res.status(500).json({
      message: 'Failed to send email',
      error: result.error,
      code: result.code
    })
  }
})

export default router

