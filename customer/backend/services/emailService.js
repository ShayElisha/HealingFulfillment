import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
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

dotenv.config()

export { getBaseTemplate }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const buildBookingConfirmationContent = (booking) => {
  const name = escapeHtml(booking.name)
  const dateLong = formatDateHeLong(booking.preferredDate)
  const time = booking.preferredTime || ''
  const typeLabel = meetingTypeLabel(booking)
  const prep = booking.isIntroMeeting
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

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️  SMTP credentials not configured. Email not sent.')
      return { success: false, message: 'SMTP not configured' }
    }

    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError)
      return { success: false, error: `SMTP verification failed: ${verifyError.message}` }
    }

    const mailOptions = {
      from: `"${BRAND_PROGRAM}" <${process.env.SMTP_USER}>`,
      to,
      replyTo: process.env.SMTP_USER,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId, response: info.response }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error: error.message, code: error.code }
  }
}

export const sendPurchaseConfirmationEmail = async (purchase, course, customer) => {
  const loginUrl = getCustomerLoginUrl()
  const purchaseDate = formatDateHeShort(purchase.createdAt)
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">אישור רכישה</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(customer.name)},</p>
    <p style="margin: 0 0 16px;">תודה על רכישתך! אנו שמחים לאשר את רכישתך של המסלול: <strong>${escapeHtml(course.title)}</strong></p>
    ${emailInfoBox(`
      ${emailInfoRow('מסלול', escapeHtml(course.title))}
      ${emailInfoRow('מחיר', `₪${escapeHtml(purchase.price)}`)}
      ${emailInfoRow('שיטת תשלום', escapeHtml(paymentMethodLabelHe(purchase.paymentMethod)))}
      ${emailInfoRow('תאריך רכישה', escapeHtml(purchaseDate))}
    `)}
    <p style="margin: 20px 0 8px; font-weight: 600; color: #6d4c9f;">הצעדים הבאים:</p>
    <ul style="margin: 0 0 20px; padding-right: 22px; line-height: 1.8;">
      <li>חשבונית/קבלה תישלח אליך למייל.</li>
      <li>פרטי הגישה לאזור האישי נשלחו אליך.</li>
    </ul>
    ${emailButton('התחבר/י לתיק לקוח', loginUrl)}
    <p style="margin: 0 0 20px;">ניצור איתך קשר בקרוב כדי לתאם את הפגישות הנותרות.</p>
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

export const sendAccountCreationEmail = async (customer, initialPassword) => {
  const loginUrl = getCustomerLoginUrl()
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">ברוכים הבאים</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(customer.name)},</p>
    <p style="margin: 0 0 16px;">ברוך/ה הבא/ה למסע הליווי האישי הטרנספורמטיבי שלנו, <strong>"${BRAND_PROGRAM}"</strong>!</p>
    ${emailInfoBox(`
      ${emailInfoRow('אימייל', escapeHtml(customer.email))}
      ${emailInfoRow('סיסמה ראשונית', `<code style="background: #ede9f5; padding: 4px 10px; border-radius: 6px; font-family: monospace;">${escapeHtml(initialPassword)}</code>`)}
    `)}
    <p style="margin: 16px 0; padding: 12px 16px; background: #fff8e6; border-radius: 8px; border-right: 4px solid #f59e0b; color: #92400e;">
      <strong>⚠️ חשוב:</strong> אנא הקפד/י לשנות את הסיסמה בכניסה הראשונה.
    </p>
    ${emailButton('התחבר/י לחשבון', loginUrl)}
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
    ${emailButton('איפוס סיסמה', resetUrl)}
    <p style="margin: 16px 0; padding: 12px 16px; background: #fef2f2; border-radius: 8px; border-right: 4px solid #ef4444; color: #991b1b;">
      <strong>חשוב:</strong> הקישור תקף ל-30 דקות בלבד.
    </p>
    <p style="margin: 0 0 8px;">אם הכפתור אינו עובד:</p>
    <p style="margin: 0 0 20px; word-break: break-all; direction: ltr; font-size: 13px; color: #6b7280;">${escapeHtml(resetUrl)}</p>
    ${emailSignature()}
  `

  return await sendEmail({
    to: customer.email,
    subject: `איפוס סיסמה – ${BRAND_PROGRAM}`,
    html: getBaseTemplate('איפוס סיסמה', content),
  })
}

export const sendFirstMeetingFollowUpEmail = async (booking) => {
  const profileUrl = getCustomerProfileUrl()
  const dateLong = formatDateHeLong(booking.preferredDate)
  const content = `
    <h2 style="margin: 0 0 20px; font-size: 22px; color: #1f2937; font-weight: 700;">תודה על הפגישה הראשונה</h2>
    <p style="margin: 0 0 16px;">שלום ${escapeHtml(booking.name)},</p>
    <p style="margin: 0 0 16px;">תודה רבה על השתתפותך בפגישה הראשונה${dateLong ? ` (${escapeHtml(dateLong)})` : ''}.</p>
    <p style="margin: 0 0 16px;">אנא מלא/י את טופס האבחון והתיעוד באזור האישי.</p>
    ${emailButton('מעבר לתיק הלקוח ומילוי האבחון', profileUrl)}
    ${emailSignature()}
  `

  return await sendEmail({
    to: booking.email,
    subject: `תודה על הפגישה הראשונה – מילוי אבחון | ${BRAND_PROGRAM}`,
    html: getBaseTemplate('תודה על הפגישה הראשונה', content),
  })
}
