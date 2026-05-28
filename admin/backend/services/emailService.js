import nodemailer from 'nodemailer'
import {
  getBaseTemplate,
  getCustomerLoginUrl,
  getCustomerProfileUrl,
  emailButton,
  emailInfoBox,
  emailInfoRow,
  emailSignature,
  escapeHtml,
  formatDateHeLong,
  formatDateHeShort,
  meetingTypeLabel,
  meetingLocationHtml,
  paymentMethodLabelHe,
  BRAND_PROGRAM,
  CONTACT_EMAIL,
  CONTACT_PHONE,
} from '../utils/emailBranding.js'

export { getBaseTemplate }

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

const PUBLIC_APP_ORIGIN = 'https://healing-fulfillment.vercel.app'

const isLocalEmailHost = (hostname) => {
  const h = String(hostname || '').toLowerCase()
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1'
}

/** מיילים חייבים להפנות לאתר בפרודקשן — לא ל-localhost מ-.env או קישורים שנשמרו בטעות */
const rewriteLocalhostToProductionAppUrl = (urlString) => {
  const s = String(urlString || '').trim()
  if (!s) return s
  try {
    const u = new URL(s)
    if (!isLocalEmailHost(u.hostname)) return s
    return `${PUBLIC_APP_ORIGIN}${u.pathname}${u.search}${u.hash}`
  } catch {
    return s
  }
}

const zoomLinkParagraphForEmail = (booking, reminderStyle = false) => {
  if (booking.meetingType !== 'zoom' || !booking.zoomLink) return ''
  const url = rewriteLocalhostToProductionAppUrl(booking.zoomLink)
  if (reminderStyle) {
    return `<p><strong>🔗 קישור אונליין:</strong> <a href="${url}" style="color: #8B5CF6; font-weight: bold;">${url}</a></p>`
  }
  return `<p><strong>קישור אונליין:</strong> <a href="${url}">${url}</a></p>`
}

const buildBookingConfirmationContent = (booking) => {
  const name = escapeHtml(booking.name)
  const dateLong = formatDateHeLong(booking.preferredDate)
  const time = booking.preferredTime || ''
  const typeLabel = meetingTypeLabel(booking)
  const prep =
    booking.isIntroMeeting
      ? 'רשימת נושאים או שאלות שתרצה/י לדון בהם בפגישה.'
      : 'רשימת שאלות או נושאים שתרצה/י לדון בהם, וכל חומר רלוונטי מהתהליך.'

  const contactLine = CONTACT_PHONE
    ? `אם יש לך שאלות נוספות או צורך בשינוי התאריך, אנא השב/י למייל זה או התקשר/י אליי בהקדם למספר <strong>${escapeHtml(CONTACT_PHONE)}</strong>.`
    : `אם יש לך שאלות נוספות או צורך בשינוי התאריך, אנא השב/י למייל זה או צור/י קשר דרך <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color: #8b5cf6;">${escapeHtml(CONTACT_EMAIL)}</a>.`

  return `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">אישור פגישה</h2>
    <p style="margin: 0 0 16px;">שלום ${name},</p>
    <p style="margin: 0 0 20px;">אני שמח לאשר את פגישתך שנקבעה ל<strong>${dateLong}</strong>${time ? `, בשעה <strong>${escapeHtml(time)}</strong>` : ''}.</p>
    ${emailInfoBox(`
      ${emailInfoRow('תאריך', escapeHtml(dateLong))}
      ${time ? emailInfoRow('שעה', escapeHtml(time)) : ''}
      ${emailInfoRow('סוג פגישה', escapeHtml(typeLabel))}
      ${meetingLocationHtml(booking)}
    `)}
    <p style="margin: 20px 0 8px; font-weight: 600; color: #6d4c9f;">הכנה מראש:</p>
    <p style="margin: 0 0 20px;">כדי שנוכל למקסם את הפגישה, אנא הכן/י מראש ${prep}</p>
    <p style="margin: 0 0 20px;">${contactLine}</p>
    <p style="margin: 0 0 8px;">מצפים לשיחה!</p>
    ${emailSignature()}
  `
}

const bookingConfirmationSubject = (booking) => {
  const typeLabel = meetingTypeLabel(booking)
  const dateLong = formatDateHeLong(booking.preferredDate)
  const time = booking.preferredTime ? `, ${booking.preferredTime}` : ''
  return `אישור פגישה: ${typeLabel} עם יניב – ${dateLong}${time}`
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
      from: `"${BRAND_PROGRAM}" <${process.env.SMTP_USER}>`,
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
  const purchaseDate = formatDateHeShort(purchase.createdAt)
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">אישור רכישה</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(customer.name)},</p>
    <p style="margin: 0 0 16px;">תודה על רכישתך! אנו שמחים לאשר את רכישתך של המסלול: <strong>${escapeHtml(course.title)}</strong></p>
    <p style="margin: 0 0 8px; font-weight: 600; color: #6d4c9f;">פרטי הרכישה:</p>
    ${emailInfoBox(`
      ${emailInfoRow('מסלול', escapeHtml(course.title))}
      ${emailInfoRow('מחיר', `₪${escapeHtml(purchase.price)}`)}
      ${emailInfoRow('שיטת תשלום', escapeHtml(paymentMethodLabelHe(purchase.paymentMethod)))}
      ${emailInfoRow('תאריך רכישה', escapeHtml(purchaseDate))}
    `)}
    <p style="margin: 20px 0 8px; font-weight: 600; color: #6d4c9f;">הצעדים הבאים:</p>
    <ul style="margin: 0 0 20px; padding-right: 22px; color: #374151; line-height: 1.8;">
      <li>חשבונית/קבלה תישלח אליך למייל.</li>
      <li>פרטי הגישה לאזור האישי, הכוללים שם משתמש וסיסמה, נשלחו אליך.</li>
    </ul>
    <p style="margin: 0 0 8px; font-weight: 600; color: #6d4c9f;">פעולות נדרשות לאחר ההתחברות הראשונית:</p>
    <ul style="margin: 0 0 20px; padding-right: 22px; color: #374151; line-height: 1.8;">
      <li>התחברות לתיק לקוח (לינק למטה)</li>
      <li>נא לשנות סיסמה בחיבור ראשוני</li>
      <li>מלא/י את טופס האבחון הראשוני וקבע/י את הפגישה הראשונה שלנו</li>
    </ul>
    ${emailButton('התחבר/י לתיק לקוח', loginUrl)}
    <p style="margin: 0 0 16px;">ניצור איתך קשר בקרוב כדי לתאם את הפגישות הנותרות.</p>
    <p style="margin: 0 0 20px;">אם יש לך שאלות, אנא צור/י קשר איתנו.</p>
    ${emailSignature()}
  `

  return await sendEmail({
    to: customer.email,
    subject: `אישור רכישה – ${BRAND_PROGRAM}`,
    html: getBaseTemplate('אישור רכישה', content),
  })
}

export const sendIntroMeetingConfirmationEmail = async (booking) => {
  const content = buildBookingConfirmationContent(booking)
  return await sendEmail({
    to: booking.email,
    subject: bookingConfirmationSubject(booking),
    html: getBaseTemplate('אישור פגישה', content),
  })
}

export const sendRegularMeetingConfirmationEmail = async (booking) => {
  const content = buildBookingConfirmationContent(booking)
  return await sendEmail({
    to: booking.email,
    subject: bookingConfirmationSubject(booking),
    html: getBaseTemplate('אישור פגישה', content),
  })
}

// מייל וולקאם לאחר פתיחת תיק / יצירת חשבון
export const sendAccountCreationEmail = async (customer, initialPassword) => {
  const loginUrl = getCustomerLoginUrl()
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">ברוכים הבאים</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(customer.name)},</p>
    <p style="margin: 0 0 16px;">ברוך/ה הבא/ה למסע הליווי האישי הטרנספורמטיבי שלנו, <strong>"${BRAND_PROGRAM}"</strong>! אני מברך/ת אותך על הצטרפותך.</p>
    <p style="margin: 0 0 16px;">חשבון הגישה שלך למערכת "${escapeHtml(BRAND_SYSTEM)}" נוצר בהצלחה. להלן פרטי ההתחברות הראשוניים שלך:</p>
    ${emailInfoBox(`
      ${emailInfoRow('אימייל', escapeHtml(customer.email))}
      ${emailInfoRow('סיסמה ראשונית', `<code style="background: #ede9f5; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 15px;">${escapeHtml(initialPassword)}</code>`)}
    `)}
    <p style="margin: 16px 0; padding: 12px 16px; background: #fff8e6; border-radius: 8px; border-right: 4px solid #f59e0b; color: #92400e;">
      <strong>⚠️ חשוב:</strong> אנא הקפד/י לשנות את הסיסמה בכניסה הראשונה שלך למערכת.
    </p>
    ${emailButton('התחבר/י לחשבון', loginUrl)}
    <p style="margin: 20px 0 8px; font-weight: 600; color: #6d4c9f;">לאחר ההתחברות, תוכל/י:</p>
    <ul style="margin: 0 0 20px; padding-right: 22px; color: #374151; line-height: 1.8;">
      <li>לצפות ביומן הפגישות שלך</li>
      <li>לעקוב אחר הרכישות שביצעת</li>
      <li>לקבוע פגישות חדשות</li>
      <li>לנהל ולעדכן את פרטי הפרופיל האישי שלך</li>
    </ul>
    <p style="margin: 0 0 20px;">אם יש לך שאלות, אנא צור/י איתנו קשר.</p>
    ${emailSignature()}
  `

  return await sendEmail({
    to: customer.email,
    subject: `ברוכים הבאים ל${BRAND_PROGRAM}`,
    html: getBaseTemplate('ברוכים הבאים', content),
  })
}

export const sendPasswordResetEmail = async (customer, resetUrl) => {
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">איפוס סיסמה לחשבונך</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(customer.name)},</p>
    <p style="margin: 0 0 16px;">קיבלנו בקשה לאיפוס הסיסמה לחשבון שלך.</p>
    <p style="margin: 0 0 8px;">כדי להגדיר סיסמה חדשה, אנא לחץ/י על הכפתור למטה:</p>
    ${emailButton('איפוס סיסמה', resetUrl)}
    <p style="margin: 16px 0; padding: 12px 16px; background: #fef2f2; border-radius: 8px; border-right: 4px solid #ef4444; color: #991b1b;">
      <strong>חשוב:</strong> הקישור תקף ל-30 דקות בלבד. לאחר מכן, יהיה עליך לבקש איפוס סיסמה חדש.
    </p>
    <p style="margin: 0 0 16px;">אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהודעה זו.</p>
    <p style="margin: 0 0 8px;">אם הכפתור אינו עובד, אפשר להעתיק את הקישור הבא לדפדפן:</p>
    <p style="margin: 0 0 20px; word-break: break-all; direction: ltr; font-size: 13px; color: #6b7280;">${escapeHtml(resetUrl)}</p>
    <p style="margin: 0 0 20px;">בכל שאלה נוספת, אנחנו כאן לשירותך.</p>
    ${emailSignature()}
  `

  return await sendEmail({
    to: customer.email,
    subject: `איפוס סיסמה – ${BRAND_PROGRAM}`,
    html: getBaseTemplate('איפוס סיסמה', content),
  })
}

export const sendBookingConfirmedEmail = async (booking) => {
  const content = buildBookingConfirmationContent(booking)
  return await sendEmail({
    to: booking.email,
    subject: bookingConfirmationSubject(booking),
    html: getBaseTemplate('אישור פגישה', content),
  })
}

/** לאחר הפגישה הראשונה שהושלמה — תודה + הנחיה למילוי אבחון */
export const sendFirstMeetingFollowUpEmail = async (booking) => {
  const profileUrl = getCustomerProfileUrl()
  const dateLong = formatDateHeLong(booking.preferredDate)
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">תודה על הפגישה הראשונה</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(booking.name)},</p>
    <p style="margin: 0 0 16px;">תודה רבה על השתתפותך בפגישה הראשונה שלנו${dateLong ? ` (${escapeHtml(dateLong)})` : ''}. אני מעריך/ה את הנוכחות והפתיחות שלך במסע.</p>
    <p style="margin: 0 0 16px;">כדי להמשיך את התהליך בצורה מיטבית, חשוב למלא את <strong>טופס האבחון והתיעוד</strong> באזור האישי שלך. המידע שתשתף/י יעזור לנו להתאים את ההמשך בדיוק עבורך.</p>
    ${emailInfoBox(`
      ${emailInfoRow('מה לעשות עכשיו', 'היכנס/י לתיק הלקוח → לשונית "אבחון ראשוני" → מלא/י את הטופס')}
      ${emailInfoRow('זמן מומלץ', 'מילוי הטופס בתוך 48 שעות מהפגישה')}
    `)}
    ${emailButton('מעבר לתיק הלקוח ומילוי האבחון', profileUrl)}
    <p style="margin: 0 0 20px;">אם נתקלת בקושי או שיש לך שאלות — אני כאן בשבילך.</p>
    ${emailSignature()}
  `

  return await sendEmail({
    to: booking.email,
    subject: `תודה על הפגישה הראשונה – מילוי אבחון | ${BRAND_PROGRAM}`,
    html: getBaseTemplate('תודה על הפגישה הראשונה', content),
  })
}

const formatBookingDateHe = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

const meetingTypeLabelHe = (meetingType) =>
  meetingType === 'zoom' ? 'פגישה באונליין' : 'פגישה פרונטאלית'

// תבנית אימייל לעדכון מועד/פרטי פגישה
export const sendBookingRescheduledEmail = async (booking, previous, toEmail) => {
  const to = String(toEmail || booking.email || '').trim()
  if (!to) {
    return { success: false, message: 'No recipient email', error: 'No recipient email' }
  }

  const oldDateStr = formatBookingDateHe(previous?.preferredDate)
  const newDateStr = formatBookingDateHe(booking.preferredDate)
  const oldTime = previous?.preferredTime || ''
  const newTime = booking.preferredTime || ''
  const oldMeetingType = previous?.meetingType
  const newMeetingType = booking.meetingType

  const content = `
    <h2>מועד הפגישה עודכן 📅</h2>
    <p>שלום ${booking.name},</p>
    <p>אנו מעדכנים אותך שפרטי הפגישה שלך שונו:</p>
    <div class="info-box" style="background-color: #f8f9fa; border-right-color: #6c757d;">
      <p style="margin-top: 0;"><strong>מועד קודם:</strong></p>
      <p><strong>תאריך:</strong> ${oldDateStr || '—'}</p>
      ${oldTime ? `<p><strong>שעה:</strong> ${oldTime}</p>` : ''}
      ${oldMeetingType ? `<p><strong>סוג פגישה:</strong> ${meetingTypeLabelHe(oldMeetingType)}</p>` : ''}
    </div>
    <div class="info-box" style="background-color: #e8f5e9; border-right-color: #4caf50;">
      <p style="margin-top: 0;"><strong>מועד חדש:</strong></p>
      <p><strong>תאריך:</strong> ${newDateStr}</p>
      ${newTime ? `<p><strong>שעה:</strong> ${newTime}</p>` : ''}
      <p><strong>סוג פגישה:</strong> ${meetingTypeLabelHe(newMeetingType)}</p>
      ${zoomLinkParagraphForEmail(booking)}
    </div>
    <p>אנא ודא שאתה זמין במועד החדש. אם המועד לא מתאים לך, צור קשר איתנו בהקדם.</p>
    <p>מצפים לראותך!<br>יניב טנעמי</p>
  `

  return await sendEmail({
    to,
    subject: 'עדכון מועד פגישה - ריפוי והגשמה',
    html: getBaseTemplate('עדכון מועד פגישה', content),
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

// תבנית אימייל לסיום פגישה (פגישות שאינן הראשונה)
export const sendBookingCompletedEmail = async (booking) => {
  const dateLong = formatDateHeLong(booking.preferredDate)
  const time = booking.preferredTime || ''
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">תודה על הפגישה</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(booking.name)},</p>
    <p style="margin: 0 0 16px;">תודה על השתתפותך בפגישה${dateLong ? ` ב-${escapeHtml(dateLong)}` : ''}${time ? ` בשעה ${escapeHtml(time)}` : ''}.</p>
    <p style="margin: 0 0 20px;">אני מקווה שהפגישה הייתה מועילה עבורך. אם יש לך שאלות או תרצה/י לקבוע פגישה נוספת — אני כאן.</p>
    ${emailSignature()}
  `

  return await sendEmail({
    to: booking.email,
    subject: `תודה על הפגישה – ${BRAND_PROGRAM}`,
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
      ${zoomLinkParagraphForEmail(booking, true)}
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

