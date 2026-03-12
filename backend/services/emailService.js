import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// יצירת transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// תבנית HTML בסיסית
export const getBaseTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #8B5CF6;
        }
        .header h1 {
          color: #8B5CF6;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin-bottom: 30px;
        }
        .content p {
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #8B5CF6;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .info-box {
          background-color: #f9f9f9;
          border-right: 4px solid #8B5CF6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box strong {
          color: #8B5CF6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ריפוי והגשמה</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>ריפוי והגשמה - מסע משותף אל עבר שחרור מחסימות רגשיות והגשמה עצמית</p>
          <p>כתובת: [כתובת המשרד] | טלפון: 050-123-4567 | אימייל: info@healing-fulfillment.co.il</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// פונקציה לשליחת אימייל
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log('📧 Attempting to send email...')
    console.log('📧 To:', to)
    console.log('📧 Subject:', subject)
    console.log('📧 SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Not set')
    console.log('📧 SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set')
    console.log('📧 SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com')
    console.log('📧 SMTP_PORT:', process.env.SMTP_PORT || '587')

    // בדיקה שהאימייל מוגדר
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️  SMTP credentials not configured. Email not sent.')
      console.log('📧 Email would be sent to:', to)
      console.log('📧 Subject:', subject)
      return { success: false, message: 'SMTP not configured' }
    }

    // בדיקת תקינות ה-transporter
    try {
      await transporter.verify()
      console.log('✅ SMTP server connection verified')
    } catch (verifyError) {
      console.error('❌ SMTP server verification failed:', verifyError)
      return { success: false, error: `SMTP verification failed: ${verifyError.message}` }
    }

    const mailOptions = {
      from: `"ריפוי והגשמה" <${process.env.SMTP_USER}>`,
      to: to,
      replyTo: process.env.SMTP_USER, // הוסף כתובת תשובה
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // טקסט פשוט אם לא סופק
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }

    console.log('📧 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📧 Response:', info.response)
    return { success: true, messageId: info.messageId, response: info.response }
  } catch (error) {
    console.error('❌ Error sending email:')
    console.error('❌ Error message:', error.message)
    console.error('❌ Error code:', error.code)
    console.error('❌ Error stack:', error.stack)
    return { success: false, error: error.message, code: error.code }
  }
}

// תבנית אימייל לרכישה
export const sendPurchaseConfirmationEmail = async (purchase, course, customer) => {
  const content = `
    <h2>תודה על רכישתך!</h2>
    <p>שלום ${customer.name},</p>
    <p>אנו שמחים לאשר את רכישתך של המסלול:</p>
    <div class="info-box">
      <p><strong>מסלול:</strong> ${course.title}</p>
      <p><strong>מחיר:</strong> ₪${purchase.price}</p>
      <p><strong>שיטת תשלום:</strong> ${purchase.paymentMethod === 'cash' ? 'מזומן' : purchase.paymentMethod === 'credit' ? 'אשראי' : 'אחר'}</p>
      <p><strong>תאריך רכישה:</strong> ${new Date(purchase.createdAt).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
    </div>
    <p>ניצור איתך קשר בקרוב כדי לתאם את הפגישות.</p>
    <p>אם יש לך שאלות, אנא צור קשר איתנו.</p>
    <p>בברכה,<br>צוות ריפוי והגשמה</p>
  `

  return await sendEmail({
    to: customer.email,
    subject: 'אישור רכישה - ריפוי והגשמה',
    html: getBaseTemplate('אישור רכישה', content),
  })
}

// תבנית אימייל לפגישת היכרות
export const sendIntroMeetingConfirmationEmail = async (booking) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const content = `
    <h2>פגישת ההיכרות שלך נקבעה!</h2>
    <p>שלום ${booking.name},</p>
    <p>תודה על קביעת פגישת ההיכרות. אנו שמחים לראותך!</p>
    <div class="info-box">
      <p><strong>תאריך הפגישה:</strong> ${dateStr}</p>
      ${booking.preferredTime ? `<p><strong>שעה:</strong> ${booking.preferredTime}</p>` : ''}
      <p><strong>סוג פגישה:</strong> ${booking.meetingType === 'zoom' ? 'פגישה בזום' : 'פגישה פרונטאלית'}</p>
      ${booking.meetingType === 'zoom' && booking.zoomLink ? `<p><strong>קישור זום:</strong> <a href="${booking.zoomLink}">${booking.zoomLink}</a></p>` : ''}
    </div>
    <p>פגישת ההיכרות היא הזדמנות להכיר, להבין מה אתה מחפש, ולראות אם אנחנו מתאימים לעבוד יחד.</p>
    <p>ללא התחייבות, רק שיחה פתוחה וכנה.</p>
    <p>אם יש לך שאלות או צריך לשנות את התאריך, אנא צור קשר איתנו.</p>
    <p>מצפים לראותך!<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'אישור פגישת היכרות - ריפוי והגשמה',
    html: getBaseTemplate('אישור פגישת היכרות', content),
  })
}

// תבנית אימייל לפגישה רגילה
export const sendRegularMeetingConfirmationEmail = async (booking) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const content = `
    <h2>פגישתך נקבעה!</h2>
    <p>שלום ${booking.name},</p>
    <p>אנו שמחים לאשר את קביעת הפגישה שלך.</p>
    <div class="info-box">
      <p><strong>תאריך הפגישה:</strong> ${dateStr}</p>
      ${booking.preferredTime ? `<p><strong>שעה:</strong> ${booking.preferredTime}</p>` : ''}
      <p><strong>סוג פגישה:</strong> ${booking.meetingType === 'zoom' ? 'פגישה בזום' : 'פגישה פרונטאלית'}</p>
      ${booking.meetingType === 'zoom' && booking.zoomLink ? `<p><strong>קישור זום:</strong> <a href="${booking.zoomLink}">${booking.zoomLink}</a></p>` : ''}
    </div>
    <p>ניצור איתך קשר בקרוב לאישור סופי של הפגישה.</p>
    <p>אם יש לך שאלות או צריך לשנות את התאריך, אנא צור קשר איתנו.</p>
    <p>מצפים לראותך!<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'אישור קביעת פגישה - ריפוי והגשמה',
    html: getBaseTemplate('אישור קביעת פגישה', content),
  })
}

// תבנית אימייל ליצירת חשבון
export const sendAccountCreationEmail = async (customer, initialPassword) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/login`

  const content = `
    <h2>חשבון נוצר עבורך!</h2>
    <p>שלום ${customer.name},</p>
    <p>חשבון נוצר עבורך במערכת ריפוי והגשמה.</p>
    <div class="info-box">
      <p><strong>אימייל:</strong> ${customer.email}</p>
      <p><strong>סיסמה ראשונית:</strong> <code style="background-color: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${initialPassword}</code></p>
    </div>
    <p><strong>⚠️ חשוב:</strong> אנא שנה את הסיסמה בכניסה הראשונה שלך.</p>
    <p style="text-align: center;">
      <a href="${loginUrl}" class="button">התחבר לחשבון</a>
    </p>
    <p>לאחר ההתחברות, תוכל:</p>
    <ul>
      <li>לצפות בפגישות שלך</li>
      <li>לצפות ברכישות שלך</li>
      <li>לקבוע פגישות חדשות</li>
      <li>לנהל את הפרופיל שלך</li>
    </ul>
    <p>אם יש לך שאלות, אנא צור קשר איתנו.</p>
    <p>בברכה,<br>צוות ריפוי והגשמה</p>
  `

  return await sendEmail({
    to: customer.email,
    subject: 'חשבון נוצר עבורך - ריפוי והגשמה',
    html: getBaseTemplate('חשבון נוצר', content),
  })
}

