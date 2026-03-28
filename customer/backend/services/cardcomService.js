const defaultCardcomApiUrl = 'https://secure.cardcom.solutions/Interface/LowProfile.aspx'

const normalizeAmount = (amount) => Number(Number(amount || 0).toFixed(2))

function trimEnv(name) {
  const v = process.env[name]
  if (v == null) return ''
  return String(v).trim()
}

function enrichCardcomError(description, responseCode) {
  const base = description || `Cardcom declined the request (code ${responseCode})`
  if (/לא שייך למסוף/i.test(description || '')) {
    return `${base} — ודאו ש־CARDCOM_USERNAME שייך בדיוק ל־CARDCOM_TERMINAL_NUMBER בהגדרות Cardcom (אותו מסוף; אל תערבבו טרמינל בדיקות עם ייצור). בדקו שלא הועתקו רווחים ב־.env ושלא הוחלפו בטעות ApiName ו־UserName.`
  }
  return base
}

/** LowProfile.aspx returns x-www-form-urlencoded (or rarely JSON), not JSON. */
function parseCardcomLowProfileBody(rawText) {
  const text = String(rawText ?? '').trim().replace(/&amp;/g, '&')
  if (!text) return null
  if (text.startsWith('{')) {
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }
  const params = new URLSearchParams(text)
  const data = {}
  for (const [key, value] of params.entries()) {
    data[key] = value
  }
  return Object.keys(data).length ? data : null
}

function decodeCardcomDescription(desc) {
  if (desc == null || desc === '') return ''
  try {
    return decodeURIComponent(String(desc).replace(/\+/g, ' '))
  } catch {
    return String(desc)
  }
}

function resolveCheckoutUrl(apiUrl, pathOrUrl) {
  if (!pathOrUrl) return ''
  const s = String(pathOrUrl).trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const base = new URL(apiUrl)
  return new URL(s.startsWith('/') ? s : `/${s}`, base.origin).href
}

export const isCardcomConfigured = () => {
  return Boolean(trimEnv('CARDCOM_TERMINAL_NUMBER') && trimEnv('CARDCOM_USERNAME') && trimEnv('CARDCOM_API_NAME'))
}

export const createCardcomCheckout = async ({
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  successUrl,
  failedUrl,
  callbackUrl,
  productName,
}) => {
  if (!isCardcomConfigured()) {
    throw new Error('Cardcom is not configured. Missing terminal/API credentials.')
  }

  const apiUrl = trimEnv('CARDCOM_API_URL') || defaultCardcomApiUrl
  const terminalNumber = trimEnv('CARDCOM_TERMINAL_NUMBER')
  const userName = trimEnv('CARDCOM_USERNAME')
  const apiName = trimEnv('CARDCOM_API_NAME')
  const apiPassword = trimEnv('CARDCOM_API_PASSWORD')
  const userPassword = trimEnv('CARDCOM_USER_PASSWORD')
  const apiLevel = trimEnv('CARDCOM_API_LEVEL')

  const payload = {
    TerminalNumber: terminalNumber,
    ApiName: apiName,
    UserName: userName,
    Operation: '1',
    CodePage: '65001',
    CoinID: '1',
    Amount: normalizeAmount(amount),
    ReturnValue: orderId,
    SuccessRedirectUrl: successUrl,
    ErrorRedirectUrl: failedUrl,
    FailedRedirectUrl: failedUrl,
    IndicatorUrl: callbackUrl,
    CustomerName: customerName,
    CustomerEmail: customerEmail,
    CustomerPhone: customerPhone,
    ProductName: productName || trimEnv('CARDCOM_PRODUCT_NAME') || 'רכישת מסלול',
  }

  if (apiLevel) {
    payload.APILevel = apiLevel
  }

  if (apiPassword) {
    payload.ApiPassword = apiPassword
  }

  if (userPassword) {
    payload.UserPassword = userPassword
  }

  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue
    body.append(key, String(value))
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: body.toString(),
  })

  const rawText = await response.text()
  if (!response.ok) {
    throw new Error(`Cardcom HTTP ${response.status}: ${rawText.slice(0, 400)}`)
  }

  const data = parseCardcomLowProfileBody(rawText)

  if (!data) {
    const preview = rawText.slice(0, 200)
    throw new Error(
      preview
        ? `Cardcom returned an unreadable response: ${preview}`
        : 'Cardcom returned an empty response'
    )
  }

  const responseCode = String(data.ResponseCode ?? data.responseCode ?? '').trim()
  const description = decodeCardcomDescription(data.Description ?? data.description ?? '')

  if (responseCode && responseCode !== '0' && responseCode !== '1') {
    throw new Error(enrichCardcomError(description, responseCode))
  }

  const pathOrUrl =
    data.LowProfileUrl ||
    data.lowProfileUrl ||
    data.url ||
    data.Url ||
    data.URL ||
    data.PaymentUrl ||
    data.paymentUrl ||
    ''

  if (!pathOrUrl) {
    throw new Error(description || data.Message || 'Cardcom did not return a payment URL')
  }

  const checkoutUrl = resolveCheckoutUrl(apiUrl, pathOrUrl)

  return {
    checkoutUrl,
    raw: data,
  }
}

export const parseCardcomCallback = (payload) => {
  const orderId = payload?.ReturnValue || payload?.returnValue || payload?.Order || payload?.orderId
  const providerTransactionId =
    payload?.InternalDealNumber ||
    payload?.DealNumber ||
    payload?.TransactionId ||
    payload?.transactionId ||
    null

  const statusCode = String(payload?.ResponseCode ?? payload?.responseCode ?? payload?.Status ?? '')
  const statusText = String(payload?.Description ?? payload?.statusText ?? '').toLowerCase()
  const isSuccess = statusCode === '0' || statusCode === '1' || statusText.includes('success') || statusText.includes('approved')

  return {
    orderId: orderId ? String(orderId) : null,
    providerTransactionId: providerTransactionId ? String(providerTransactionId) : null,
    isSuccess,
    raw: payload,
  }
}

export const verifyCardcomCallbackSignature = (payload) => {
  const secret = process.env.CARDCOM_WEBHOOK_SECRET || ''
  if (!secret) {
    return true
  }

  const incomingSecret = payload?.WebhookSecret || payload?.webhookSecret || payload?.secret
  return incomingSecret === secret
}

