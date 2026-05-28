const PUBLIC_APP_ORIGIN = 'https://healing-fulfillment.vercel.app'

export const BRAND_PROGRAM = 'להתעורר אל עצמי'
export const BRAND_SYSTEM = 'ריפוי והגשמה'
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'yaniv@elatzmi.com'
export const CONTACT_PHONE = process.env.CONTACT_PHONE || ''

export const getEmailLogoUrl = () => {
  const configured = String(process.env.EMAIL_LOGO_URL || '').trim()
  if (configured) return configured
  return `${PUBLIC_APP_ORIGIN}/email-logo.png`
}

export const getCustomerLoginUrl = () => {
  const configured = String(process.env.CUSTOMER_LOGIN_URL || '').trim()
  const url = configured || `${PUBLIC_APP_ORIGIN}/customer/login`
  try {
    const u = new URL(url)
    const h = u.hostname.toLowerCase()
    if (h === 'localhost' || h === '127.0.0.1') {
      return `${PUBLIC_APP_ORIGIN}/customer/login`
    }
    return url
  } catch {
    return `${PUBLIC_APP_ORIGIN}/customer/login`
  }
}

export const getCustomerProfileUrl = () => `${PUBLIC_APP_ORIGIN}/customer/profile`

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const formatDateHeLong = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatDateHeShort = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const emailButton = (label, href) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto;">
    <tr>
      <td style="border-radius: 8px; background: linear-gradient(135deg, #6d4c9f 0%, #8b5cf6 100%);">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener"
           style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`

export const emailInfoBox = (rowsHtml) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
         style="margin: 20px 0; background: #f8f6fc; border-radius: 10px; border-right: 4px solid #8b5cf6;">
    <tr>
      <td style="padding: 20px 22px; font-size: 15px; line-height: 1.7; color: #374151;">
        ${rowsHtml}
      </td>
    </tr>
  </table>`

export const emailInfoRow = (label, value) =>
  `<p style="margin: 0 0 10px;"><strong style="color: #6d4c9f;">${escapeHtml(label)}:</strong> ${value}</p>`

export const emailSignature = () => `
  <p style="margin: 28px 0 6px; color: #374151;">בברכה,</p>
  <p style="margin: 0; font-weight: 600; color: #1f2937;">יניב</p>
  <p style="margin: 4px 0 0; font-size: 15px; color: #8b5cf6; font-weight: 600;">${BRAND_PROGRAM}</p>`

export const getBaseTemplate = (title, content) => {
  const logoUrl = getEmailLogoUrl()
  const phoneLine = CONTACT_PHONE
    ? `<p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af;">טלפון: <a href="tel:${escapeHtml(CONTACT_PHONE)}" style="color: #8b5cf6; text-decoration: none;">${escapeHtml(CONTACT_PHONE)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ede9f5; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ede9f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(109, 76, 159, 0.12);">
          <tr>
            <td style="background: linear-gradient(135deg, #5b3d8a 0%, #8b5cf6 50%, #a78bfa 100%); padding: 32px 24px; text-align: center;">
              <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(BRAND_PROGRAM)}" width="120" height="auto"
                   style="display: block; margin: 0 auto 16px; max-width: 120px; height: auto; border-radius: 8px;" />
              <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px;">${BRAND_PROGRAM}</p>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${BRAND_SYSTEM}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px; font-size: 16px; line-height: 1.75; color: #374151;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background: #faf9fc; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                ${BRAND_PROGRAM} · ${BRAND_SYSTEM}
              </p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #9ca3af;">
                <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color: #8b5cf6; text-decoration: none;">${escapeHtml(CONTACT_EMAIL)}</a>
              </p>
              ${phoneLine}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const meetingTypeLabel = (booking) => {
  if (booking?.isIntroMeeting) return 'פגישת היכרות'
  if (booking?.meetingType === 'zoom') return 'פגישה באונליין'
  return 'פגישה פרונטאלית'
}

export const meetingLocationHtml = (booking) => {
  if (booking?.meetingType === 'zoom' && booking?.zoomLink) {
    const url = String(booking.zoomLink).trim()
    return emailInfoRow('מיקום', `שיחת וידאו — <a href="${escapeHtml(url)}" style="color: #8b5cf6;">${escapeHtml(url)}</a>`)
  }
  if (booking?.meetingType === 'zoom') {
    return emailInfoRow('מיקום', 'שיחת וידאו (קישור יישלח לפני הפגישה)')
  }
  const office = process.env.OFFICE_ADDRESS || 'פגישה פרונטאלית — פרטים יימסרו בהתאמה'
  return emailInfoRow('מיקום', escapeHtml(office))
}

export const paymentMethodLabelHe = (method) => {
  const map = {
    cash: 'מזומן',
    credit: 'אשראי',
    credit_card: 'כרטיס אשראי',
    cardcom: 'כרטיס אשראי',
    bank_transfer: 'העברה בנקאית',
    paypal: 'PayPal',
  }
  return map[method] || method || 'אחר'
}
