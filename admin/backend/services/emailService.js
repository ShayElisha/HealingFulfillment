import nodemailer from 'nodemailer'

// Note: In Vercel, environment variables are automatically loaded
// dotenv.config() is only needed for local development with .env file

// פונקציה ליצירת transporter
const createTransporter = () => {
  // Read environment variables directly (works in both local and Vercel)
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD

  console.log('📧 Creating SMTP transporter with config:', {
    host: smtpHost,
    port: smtpPort,
    user: smtpUser ? `${smtpUser.substring(0, 3)}***` : '❌ Not set',
    password: smtpPassword ? '✅ Set' : '❌ Not set',
    environment: process.env.VERCEL ? 'Vercel' : 'Local',
    nodeEnv: process.env.NODE_ENV
  })

  // Debug: Log all SMTP-related environment variables (safely)
  console.log('📧 Environment check:', {
    SMTP_HOST: process.env.SMTP_HOST || 'not set (using default)',
    SMTP_PORT: process.env.SMTP_PORT || 'not set (using default)',
    SMTP_USER: process.env.SMTP_USER ? 'set' : 'NOT SET',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'set' : 'NOT SET',
    VERCEL: process.env.VERCEL ? 'yes' : 'no',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  })

  if (!smtpUser || !smtpPassword) {
    console.warn('⚠️  SMTP credentials not configured')
    console.warn('⚠️  SMTP_USER:', smtpUser ? 'set' : 'NOT SET')
    console.warn('⚠️  SMTP_PASSWORD:', smtpPassword ? 'set' : 'NOT SET')
    return null
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
      user: smtpUser,
      pass: smtpPassword,
  },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  })
}

// יצירת transporter (נוצר מחדש בכל קריאה כדי לוודא שמשתני הסביבה מעודכנים)
const getTransporter = () => {
  return createTransporter()
}

const DEFAULT_CUSTOMER_LOGIN_URL = 'https://healing-fulfillment.vercel.app/customer/login'
const getCustomerLoginUrl = () => {
  const configuredUrl = String(process.env.CUSTOMER_LOGIN_URL || DEFAULT_CUSTOMER_LOGIN_URL).trim()
  return configuredUrl || DEFAULT_CUSTOMER_LOGIN_URL
}

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
          <p>כתובת: [כתובת המשרד] | טלפון: 050-123-4567 | אימייל: yaniv@elatzmi.com</p>
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
    
    // בדיקה מפורטת של משתני הסביבה
    const envCheck = {
      SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
      SMTP_PORT: process.env.SMTP_PORT || '587 (default)',
      SMTP_USER: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : '❌ NOT SET',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '✅ Set (hidden)' : '❌ NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL ? '✅ Yes' : '❌ No',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
    }
    
    console.log('📧 Environment variables check:')
    console.log(JSON.stringify(envCheck, null, 2))
    
    // בדיקת כל משתני הסביבה
    const missingVars = []
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER')
    if (!process.env.SMTP_PASSWORD) missingVars.push('SMTP_PASSWORD')

    // בדיקה שהאימייל מוגדר
    if (missingVars.length > 0) {
      const errorMessage = `SMTP credentials missing: ${missingVars.join(', ')}`
      console.error('❌', errorMessage)
      console.error('📧 Email would be sent to:', to)
      console.error('📧 Subject:', subject)
      console.error('')
      console.error('🔧 To fix this issue:')
      console.error('   1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
      console.error('   2. Add the following environment variables:')
      console.error('      - SMTP_HOST (optional, default: smtp.gmail.com)')
      console.error('      - SMTP_PORT (optional, default: 587)')
      console.error('      - SMTP_USER (required: your email address)')
      console.error('      - SMTP_PASSWORD (required: your email password or app password)')
      console.error('   3. After adding variables, redeploy your project')
      console.error('   4. For Gmail, you need to create an App Password:')
      console.error('      - Go to Google Account → Security → 2-Step Verification → App passwords')
      console.error('      - Create a new app password and use it as SMTP_PASSWORD')
      console.error('')
      
      return { 
        success: false, 
        message: 'Failed to send email',
        error: errorMessage,
        missingVariables: missingVars,
        instructions: 'Please configure SMTP environment variables in Vercel Dashboard'
      }
    }

    // יצירת transporter
    const transporter = getTransporter()
    if (!transporter) {
      return { success: false, message: 'Failed to create SMTP transporter', error: 'Transporter creation failed' }
    }

    // בדיקת תקינות ה-transporter
    try {
      console.log('📧 Verifying SMTP connection...')
      await transporter.verify()
      console.log('✅ SMTP server connection verified')
    } catch (verifyError) {
      console.error('❌ SMTP server verification failed:', verifyError)
      console.error('❌ Error code:', verifyError.code)
      console.error('❌ Error command:', verifyError.command)
      return { 
        success: false, 
        error: `SMTP verification failed: ${verifyError.message}`,
        code: verifyError.code,
        command: verifyError.command
      }
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
  const loginUrl = getCustomerLoginUrl()
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
    <p style="text-align: center;">
      <a href="${loginUrl}" class="button">התחברות לתיק לקוח</a>
    </p>
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
      <p><strong>סוג פגישה:</strong> ${booking.meetingType === 'zoom' ? 'פגישה באונליין' : 'פגישה פרונטאלית'}</p>
      ${booking.meetingType === 'zoom' && booking.zoomLink ? `<p><strong>קישור אונליין:</strong> <a href="${booking.zoomLink}">${booking.zoomLink}</a></p>` : ''}
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
      <p><strong>סוג פגישה:</strong> ${booking.meetingType === 'zoom' ? 'פגישה באונליין' : 'פגישה פרונטאלית'}</p>
      ${booking.meetingType === 'zoom' && booking.zoomLink ? `<p><strong>קישור אונליין:</strong> <a href="${booking.zoomLink}">${booking.zoomLink}</a></p>` : ''}
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
  const loginUrl = getCustomerLoginUrl()

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

// תבנית אימייל לאישור פגישה
export const sendBookingConfirmedEmail = async (booking) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const content = `
    <h2>הפגישה שלך אושרה! ✅</h2>
    <p>שלום ${booking.name},</p>
    <p>אנו שמחים לאשר את הפגישה שלך.</p>
    <div class="info-box">
      <p><strong>תאריך הפגישה:</strong> ${dateStr}</p>
      ${booking.preferredTime ? `<p><strong>שעה:</strong> ${booking.preferredTime}</p>` : ''}
      <p><strong>סוג פגישה:</strong> ${booking.meetingType === 'zoom' ? 'פגישה באונליין' : 'פגישה פרונטאלית'}</p>
      ${booking.meetingType === 'zoom' && booking.zoomLink ? `<p><strong>קישור אונליין:</strong> <a href="${booking.zoomLink}">${booking.zoomLink}</a></p>` : ''}
    </div>
    <p>אנא ודא שאתה זמין בתאריך ובשעה שנקבעו.</p>
    <p>אם יש לך שאלות או צריך לשנות את התאריך, אנא צור קשר איתנו בהקדם.</p>
    <p>מצפים לראותך!<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'הפגישה שלך אושרה - ריפוי והגשמה',
    html: getBaseTemplate('אישור פגישה', content),
  })
}

// תבנית אימייל לביטול פגישה
export const sendBookingCancelledEmail = async (booking, cancellationReason) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const content = `
    <h2>הפגישה בוטלה</h2>
    <p>שלום ${booking.name},</p>
    <p>אנו מודיעים לך שהפגישה הבאה בוטלה:</p>
    <div class="info-box">
      <p><strong>תאריך הפגישה:</strong> ${dateStr}</p>
      ${booking.preferredTime ? `<p><strong>שעה:</strong> ${booking.preferredTime}</p>` : ''}
    </div>
    ${cancellationReason ? `<p><strong>סיבת ביטול:</strong> ${cancellationReason}</p>` : ''}
    <p>אם תרצה לקבוע פגישה חדשה, אנא צור קשר איתנו ואנו נשמח לעזור.</p>
    <p>אם יש לך שאלות, אנא צור קשר איתנו.</p>
    <p>בברכה,<br>צוות ריפוי והגשמה</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'ביטול פגישה - ריפוי והגשמה',
    html: getBaseTemplate('ביטול פגישה', content),
  })
}

// תבנית אימייל לסיום פגישה
export const sendBookingCompletedEmail = async (booking) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const content = `
    <h2>תודה על הפגישה! 🙏</h2>
    <p>שלום ${booking.name},</p>
    <p>תודה על השתתפותך בפגישה:</p>
    <div class="info-box">
      <p><strong>תאריך הפגישה:</strong> ${dateStr}</p>
      ${booking.preferredTime ? `<p><strong>שעה:</strong> ${booking.preferredTime}</p>` : ''}
    </div>
    <p>אנו מקווים שהפגישה הייתה מועילה עבורך.</p>
    <p>אם יש לך שאלות או תרצה לקבוע פגישה נוספת, אנא צור קשר איתנו.</p>
    <p>אנו כאן עבורך בכל עת.<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'תודה על הפגישה - ריפוי והגשמה',
    html: getBaseTemplate('תודה על הפגישה', content),
  })
}

// תבנית אימייל לסיכום פגישה
export const sendSessionSummaryEmail = async (booking) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const content = `
    <h2>סיכום הפגישה שלך</h2>
    <p>שלום ${booking.name},</p>
    <p>להלן סיכום הפגישה שהתקיימה:</p>
    <div class="info-box">
      <p><strong>תאריך הפגישה:</strong> ${dateStr}</p>
      ${booking.preferredTime ? `<p><strong>שעה:</strong> ${booking.preferredTime}</p>` : ''}
    </div>
    <div class="info-box" style="background-color: #f0f7ff; border-right-color: #4A90E2;">
      <h3 style="color: #4A90E2; margin-top: 0;">סיכום הפגישה:</h3>
      <p style="white-space: pre-wrap;">${booking.sessionSummary || 'לא צוין סיכום'}</p>
    </div>
    <p>אם יש לך שאלות או תרצה לקבוע פגישה נוספת, אנא צור קשר איתנו.</p>
    <p>אנו כאן עבורך בכל עת.<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'סיכום הפגישה - ריפוי והגשמה',
    html: getBaseTemplate('סיכום פגישה', content),
  })
}

// תבנית אימייל לאישור השלמת רכישה
export const sendPurchaseCompletedEmail = async (purchase, course, customer) => {
  const content = `
    <h2>תשלומך התקבל! ✅</h2>
    <p>שלום ${customer.name},</p>
    <p>אנו שמחים לאשר שהתשלום עבור הרכישה שלך התקבל בהצלחה.</p>
    <div class="info-box">
      <p><strong>מסלול:</strong> ${course.title}</p>
      <p><strong>מחיר:</strong> ₪${purchase.price}</p>
      <p><strong>שיטת תשלום:</strong> ${purchase.paymentMethod === 'credit_card' ? 'כרטיס אשראי' : purchase.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' : purchase.paymentMethod === 'paypal' ? 'PayPal' : 'אחר'}</p>
      <p><strong>תאריך רכישה:</strong> ${new Date(purchase.createdAt).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
      <p><strong>תאריך אישור:</strong> ${new Date().toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
    </div>
    <h3>מה הלאה?</h3>
    <p>ניצור איתך קשר בקרוב כדי לתאם את הפגישות ולהתחיל את המסלול.</p>
    <p>אם יש לך שאלות, אנא צור קשר איתנו.</p>
    <p>תודה על האמון!<br>צוות ריפוי והגשמה</p>
  `

  return await sendEmail({
    to: customer.email,
    subject: 'תשלומך התקבל - ריפוי והגשמה',
    html: getBaseTemplate('אישור תשלום', content),
  })
}

// תבנית אימייל לביטול רכישה
export const sendPurchaseCancelledEmail = async (purchase, course, customer, cancellationReason) => {
  const content = `
    <h2>רכישתך בוטלה</h2>
    <p>שלום ${customer.name},</p>
    <p>אנו מודיעים לך שהרכישה הבאה בוטלה:</p>
    <div class="info-box">
      <p><strong>מסלול:</strong> ${course.title}</p>
      <p><strong>מחיר:</strong> ₪${purchase.price}</p>
      <p><strong>תאריך רכישה:</strong> ${new Date(purchase.createdAt).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
    </div>
    ${cancellationReason ? `<p><strong>סיבת ביטול:</strong> ${cancellationReason}</p>` : ''}
    <p>אם התשלום כבר בוצע, נטפל בהחזר בהתאם למדיניות שלנו.</p>
    <p>אם יש לך שאלות או תרצה ליצור קשר, אנא צור קשר איתנו.</p>
    <p>אם תרצה, תוכל לרכוש את המסלול שוב בעתיד.</p>
    <p>בברכה,<br>צוות ריפוי והגשמה</p>
  `

  return await sendEmail({
    to: customer.email,
    subject: 'ביטול רכישה - ריפוי והגשמה',
    html: getBaseTemplate('ביטול רכישה', content),
  })
}

// תבנית אימייל לתזכורת לפני פגישה
export const sendBookingReminderEmail = async (booking) => {
  const dateStr = new Date(booking.preferredDate).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const timeStr = booking.preferredTime || ''

  const content = `
    <h2>תזכורת: פגישה קרובה 📅</h2>
    <p>שלום ${booking.name},</p>
    <p>זוהי תזכורת שהפגישה שלך מתקיימת מחר:</p>
    <div class="info-box" style="background-color: #fff3cd; border-right-color: #ffc107;">
      <p><strong>📅 תאריך:</strong> ${dateStr}</p>
      ${timeStr ? `<p><strong>🕐 שעה:</strong> ${timeStr}</p>` : ''}
      <p><strong>📍 סוג פגישה:</strong> ${booking.meetingType === 'zoom' ? 'פגישה באונליין' : 'פגישה פרונטאלית'}</p>
      ${booking.meetingType === 'zoom' && booking.zoomLink ? `<p><strong>🔗 קישור אונליין:</strong> <a href="${booking.zoomLink}" style="color: #8B5CF6; font-weight: bold;">${booking.zoomLink}</a></p>` : ''}
    </div>
    <h3>הכנות מומלצות:</h3>
    <ul>
      <li>ודא שאתה זמין בתאריך ובשעה שנקבעו</li>
      ${booking.meetingType === 'zoom' ? '<li>בדוק את החיבור לאינטרנט והמיקרופון</li><li>הכן את קישור האונליין מראש</li>' : '<li>הכן את הכתובת והגע בזמן</li>'}
      <li>הכן שאלות או נושאים שתרצה לדון בהם</li>
    </ul>
    <p>אם יש לך שאלות או צריך לשנות את התאריך, אנא צור קשר איתנו בהקדם.</p>
    <p>מצפים לראותך!<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to: booking.email,
    subject: 'תזכורת: פגישה מחר - ריפוי והגשמה',
    html: getBaseTemplate('תזכורת פגישה', content),
  })
}

