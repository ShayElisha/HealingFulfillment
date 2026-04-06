import crypto from 'crypto'

const defaultCardcomApiUrl = 'https://secure.cardcom.solutions/Interface/LowProfile.aspx'

/** Timeout for outbound requests to Cardcom (ms) */
export const CARDCOM_FETCH_TIMEOUT_MS = 25_000

const REQUIRED_ENV_KEYS = [
  'CARDCOM_TERMINAL_NUMBER',
  'CARDCOM_API_NAME',
  'CARDCOM_API_PASSWORD',
  'CARDCOM_USERNAME',
  'CARDCOM_WEBHOOK_SECRET',
]

function trimEnv(name) {
  const v = process.env[name]
  if (v == null) return ''
  return String(v).trim()
}

/**
 * Throws if any required Cardcom variable is missing. Never uses defaults for secrets.
 */
export function assertCardcomEnvConfigured() {
  const missing = REQUIRED_ENV_KEYS.filter((k) => !trimEnv(k))
  if (missing.length > 0) {
    throw new Error(
      `Cardcom is not configured. Set all of: ${REQUIRED_ENV_KEYS.join(', ')}. Missing: ${missing.join(', ')}`
    )
  }
}

export const isCardcomConfigured = () => {
  return REQUIRED_ENV_KEYS.every((k) => Boolean(trimEnv(k)))
}

/** שגיאה מפורשת מ-Cardcom — הנתיב יחזיר 502 ולא 500 כללי */
export class CardcomApiError extends Error {
  /**
   * @param {string} message
   * @param {{ responseCode?: string, rawSnippet?: string }} [meta]
   */
  constructor(message, meta = {}) {
    super(message)
    this.name = 'CardcomApiError'
    this.code = 'CARDCOM_API'
    this.responseCode = meta.responseCode
    this.rawSnippet = meta.rawSnippet
  }
}

function enrichCardcomError(description, responseCode) {
  const base = description || `Cardcom declined the request (code ${responseCode})`
  if (/שם משתמש או סיסמה שגויים/i.test(description || '')) {
    return (
      `${base} (מ-Cardcom) — זו שגיאת אימות ל-API של המסוף, לא סיסמת לקוח קצה. ` +
      'ב-.env: CARDCOM_TERMINAL_NUMBER = מספר מסוף; CARDCOM_USERNAME = שם משתמש ה-API של אותו מסוף (מסך משתמשים/API, לא אימייל); ' +
      'CARDCOM_API_NAME + CARDCOM_API_PASSWORD = זוג "שם API / סיסמת API" מלוח הבקרה; לא להחליף בין ApiName ל-UserName. ' +
      'אם ב-Cardcom מוגדרת גם סיסמת משתמש נפרת ל-Low Profile — הוסיפו CARDCOM_USER_PASSWORD. ' +
      'בדקו שאין רווחים אחרי הערך ושהעתקה היא מאותו סביבת מסוף (בדיקות/ייצור).'
    )
  }
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

/**
 * Constant-time style compare for webhook secrets (length-invariant via SHA-256 digests).
 */
export function verifyCardcomWebhookSecret(incomingPayload) {
  assertCardcomEnvConfigured()
  const expected = trimEnv('CARDCOM_WEBHOOK_SECRET')
  const received =
    incomingPayload?.WebhookSecret ??
    incomingPayload?.webhookSecret ??
    incomingPayload?.secret ??
    ''

  const expHash = crypto.createHash('sha256').update(expected, 'utf8').digest()
  const recHash = crypto.createHash('sha256').update(String(received), 'utf8').digest()

  try {
    return expHash.length === recHash.length && crypto.timingSafeEqual(expHash, recHash)
  } catch {
    return false
  }
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
  /** מספר תשלומים מקסימלי (מקורס); אופציונלי */
  maxNumOfPayments,
  minNumOfPayments = 1,
  defaultNumOfPayments,
}) => {
  assertCardcomEnvConfigured()

  const apiUrl = trimEnv('CARDCOM_API_URL') || defaultCardcomApiUrl
  const terminalNumber = trimEnv('CARDCOM_TERMINAL_NUMBER')
  const userName = trimEnv('CARDCOM_USERNAME')
  const apiName = trimEnv('CARDCOM_API_NAME')
  const apiPassword = trimEnv('CARDCOM_API_PASSWORD')
  const userPassword = trimEnv('CARDCOM_USER_PASSWORD')
  const apiLevel = trimEnv('CARDCOM_API_LEVEL')

  const normalizedAmount = Number(Number(amount || 0).toFixed(2))

  const payload = {
    TerminalNumber: terminalNumber,
    ApiName: apiName,
    UserName: userName,
    Operation: '1',
    CodePage: '65001',
    CoinID: '1',
    /** חלק מהמסופים/גרסאות מצפים ל-SumToBill במקביל ל-Amount */
    Amount: normalizedAmount,
    SumToBill: normalizedAmount,
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

  const maxPay = Number(maxNumOfPayments)
  if (Number.isFinite(maxPay) && maxPay >= 1) {
    const capped = Math.min(120, Math.floor(maxPay))
    const minPay = Math.min(capped, Math.max(1, Math.floor(Number(minNumOfPayments) || 1)))
    payload.MaxNumOfPayments = String(capped)
    payload.MinNumOfPayments = String(minPay)
    const def =
      defaultNumOfPayments != null
        ? Math.min(capped, Math.max(minPay, Math.floor(Number(defaultNumOfPayments))))
        : minPay
    payload.DefaultNumOfPayments = String(def)
  }

  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue
    body.append(key, String(value))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CARDCOM_FETCH_TIMEOUT_MS)

  let response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: body.toString(),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new CardcomApiError(`Cardcom request timed out after ${CARDCOM_FETCH_TIMEOUT_MS}ms`)
    }
    throw err instanceof CardcomApiError ? err : new CardcomApiError(err.message || String(err))
  } finally {
    clearTimeout(timeoutId)
  }

  const rawText = await response.text()
  if (!response.ok) {
    throw new CardcomApiError(`Cardcom HTTP ${response.status}: ${rawText.slice(0, 400)}`, {
      rawSnippet: rawText.slice(0, 200),
    })
  }

  const data = parseCardcomLowProfileBody(rawText)

  if (!data) {
    const preview = rawText.slice(0, 200)
    throw new CardcomApiError(
      preview
        ? `Cardcom returned an unreadable response: ${preview}`
        : 'Cardcom returned an empty response',
      { rawSnippet: preview }
    )
  }

  const responseCode = String(data.ResponseCode ?? data.responseCode ?? '').trim()
  const description = decodeCardcomDescription(data.Description ?? data.description ?? '')

  if (responseCode && responseCode !== '0' && responseCode !== '1') {
    throw new CardcomApiError(enrichCardcomError(description, responseCode), { responseCode })
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
    throw new CardcomApiError(
      description || data.Message || 'Cardcom did not return a payment URL',
      { responseCode }
    )
  }

  const checkoutUrl = resolveCheckoutUrl(apiUrl, pathOrUrl)

  return {
    checkoutUrl,
    raw: data,
  }
}

/**
 * Parse Cardcom Indicator / webhook payload.
 * Success is determined ONLY by ResponseCode 0 or 1 (not free-text Description).
 */
export const parseCardcomCallback = (payload) => {
  const orderId =
    payload?.ReturnValue || payload?.returnValue || payload?.Order || payload?.orderId || null

  const internalDealNumber =
    payload?.InternalDealNumber ?? payload?.internalDealNumber ?? payload?.DealNumber ?? null

  const transactionId =
    payload?.TransactionId ?? payload?.transactionId ?? internalDealNumber ?? null

  const responseCode = String(payload?.ResponseCode ?? payload?.responseCode ?? '').trim()
  const description = decodeCardcomDescription(payload?.Description ?? payload?.description ?? '')

  const isSuccess = responseCode === '0' || responseCode === '1'

  let amount = null
  const rawAmount = payload?.Amount ?? payload?.amount
  if (rawAmount != null && rawAmount !== '') {
    const n = Number(rawAmount)
    if (!Number.isNaN(n)) amount = Number(n.toFixed(2))
  }

  return {
    orderId: orderId ? String(orderId) : null,
    internalDealNumber: internalDealNumber != null ? String(internalDealNumber) : null,
    providerTransactionId: transactionId != null ? String(transactionId) : null,
    responseCode,
    description,
    amount,
    isSuccess,
    raw: payload,
  }
}

const BILL_GOLD_SOAP_URL = 'https://secure.cardcom.solutions/Interface/BillGoldService.asmx'

function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function firstInnerXml(xml, tag) {
  const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`<(?:[a-z]+:)?${esc}[^>]*>([\\s\\S]*?)</(?:[a-z]+:)?${esc}>`, 'i')
  const m = String(xml).match(re)
  return m ? m[1] : ''
}

function tagTextIn(slice, tag) {
  if (!slice) return ''
  const esc = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`<(?:[a-z]+:)?${esc}[^>]*>([^<]*)</(?:[a-z]+:)?${esc}>`, 'i')
  const m = slice.match(re)
  return m ? m[1].trim() : ''
}

/**
 * שאילתת שרת ל-Cardcom: סטטוס Low Profile לפי lowProfileCode (מופיע ב-URL אחרי תשלום).
 * מאפשר לאשר עסקה כשה-webhook לא מגיע (למשל localhost).
 */
export async function fetchCardcomLowProfileIndicator(lowProfileCode) {
  assertCardcomEnvConfigured()
  const terminalNumber = trimEnv('CARDCOM_TERMINAL_NUMBER')
  const userName = trimEnv('CARDCOM_USERNAME')
  const code = String(lowProfileCode || '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)) {
    throw new CardcomApiError('Invalid lowProfileCode format')
  }

  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetLowProfileIndicator xmlns="BillGoldService">
      <terminalnumber>${escapeXmlText(terminalNumber)}</terminalnumber>
      <username>${escapeXmlText(userName)}</username>
      <lowProfileCode>${escapeXmlText(code)}</lowProfileCode>
    </GetLowProfileIndicator>
  </soap:Body>
</soap:Envelope>`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CARDCOM_FETCH_TIMEOUT_MS)
  let response
  try {
    response = await fetch(BILL_GOLD_SOAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: '"BillGoldService/GetLowProfileIndicator"',
      },
      body: soap,
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new CardcomApiError(`Cardcom request timed out after ${CARDCOM_FETCH_TIMEOUT_MS}ms`)
    }
    throw err instanceof CardcomApiError ? err : new CardcomApiError(err.message || String(err))
  } finally {
    clearTimeout(timeoutId)
  }

  const rawXml = await response.text()
  if (!response.ok) {
    throw new CardcomApiError(`Cardcom BillGoldService HTTP ${response.status}: ${rawXml.slice(0, 300)}`, {
      rawSnippet: rawXml.slice(0, 200),
    })
  }

  const faultMatch = rawXml.match(/<[^:]*:?faultstring[^>]*>([^<]+)<\/[^:]*:?faultstring>/i)
  if (/soap:Fault/i.test(rawXml) || /<[^:]*:?Fault[\s>]/i.test(rawXml)) {
    throw new CardcomApiError(faultMatch ? faultMatch[1].trim() : 'Cardcom SOAP fault')
  }

  const resultBlock = firstInnerXml(rawXml, 'GetLowProfileIndicatorResult')
  if (!resultBlock) {
    throw new CardcomApiError('Unexpected Cardcom response (no GetLowProfileIndicatorResult)', {
      rawSnippet: rawXml.slice(0, 400),
    })
  }

  const preIndicator = resultBlock.split(/<(?:[a-z]+:)?Indicator[\s>]/i)[0] || ''
  const apiResponseCode = tagTextIn(preIndicator, 'ResponseCode')
  const apiDescription = decodeCardcomDescription(tagTextIn(preIndicator, 'Description'))

  const indicatorXml = firstInnerXml(rawXml, 'Indicator')

  const returnValue = tagTextIn(indicatorXml, 'ReturnValue')
  const internalDealNumber = tagTextIn(indicatorXml, 'InternalDealNumber')
  const dealRespone = tagTextIn(indicatorXml, 'DealRespone')
  const prossesEndOK = tagTextIn(indicatorXml, 'ProssesEndOK')

  return {
    apiResponseCode,
    apiDescription,
    returnValue,
    internalDealNumber,
    dealRespone,
    prossesEndOK,
  }
}

/** בונה מבנה כמו webhook עבור parseCardcomCallback מתוצאת GetLowProfileIndicator */
export function buildCardcomCallbackFromLowProfileIndicator(parsed) {
  const dealRespone = String(parsed.dealRespone || '').trim()
  const prossesEndOK = String(parsed.prossesEndOK || '').trim()
  const hasDeal = Boolean(String(parsed.internalDealNumber || '').trim())

  let paymentResponseCode = dealRespone !== '' ? dealRespone : '999'
  if (paymentResponseCode === '999' && prossesEndOK === '1' && hasDeal) {
    paymentResponseCode = '0'
  }

  const payload = {
    ReturnValue: parsed.returnValue,
    InternalDealNumber: parsed.internalDealNumber,
    ResponseCode: paymentResponseCode,
    Description: parsed.apiDescription,
    raw: {
      source: 'GetLowProfileIndicator',
      apiResponseCode: parsed.apiResponseCode,
      dealRespone: parsed.dealRespone,
      prossesEndOK: parsed.prossesEndOK,
    },
  }
  return parseCardcomCallback(payload)
}

/** @deprecated Use verifyCardcomWebhookSecret */
export const verifyCardcomCallbackSignature = (payload) => verifyCardcomWebhookSecret(payload)
