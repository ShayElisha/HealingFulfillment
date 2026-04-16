import crypto from 'crypto'

const defaultCardcomApiUrl = 'https://secure.cardcom.solutions/Interface/LowProfile.aspx'
const BILL_GOLD_SOAP_URL = 'https://secure.cardcom.solutions/Interface/BillGoldService.asmx'
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
  return v == null ? '' : String(v).trim()
}

export function assertCardcomEnvConfigured() {
  const missing = REQUIRED_ENV_KEYS.filter((k) => !trimEnv(k))
  if (missing.length) {
    throw new Error(`Cardcom is not configured. Missing: ${missing.join(', ')}`)
  }
}

export const isCardcomConfigured = () => REQUIRED_ENV_KEYS.every((k) => Boolean(trimEnv(k)))

export class CardcomApiError extends Error {
  constructor(message, meta = {}) {
    super(message)
    this.name = 'CardcomApiError'
    this.code = 'CARDCOM_API'
    this.responseCode = meta.responseCode
  }
}

function decodeDescription(s) {
  if (!s) return ''
  try {
    return decodeURIComponent(String(s).replace(/\+/g, ' '))
  } catch {
    return String(s)
  }
}

function parseBody(rawText) {
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
  for (const [key, value] of params.entries()) data[key] = value
  return Object.keys(data).length ? data : null
}

function resolveCheckoutUrl(apiUrl, pathOrUrl) {
  if (!pathOrUrl) return ''
  const s = String(pathOrUrl).trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const base = new URL(apiUrl)
  return new URL(s.startsWith('/') ? s : `/${s}`, base.origin).href
}

export function verifyCardcomWebhookSecret(payload) {
  assertCardcomEnvConfigured()
  const expected = trimEnv('CARDCOM_WEBHOOK_SECRET')
  const received = payload?.WebhookSecret ?? payload?.webhookSecret ?? payload?.secret ?? ''
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
  maxNumOfPayments,
  minNumOfPayments = 1,
  defaultNumOfPayments,
}) => {
  assertCardcomEnvConfigured()
  const apiUrl = trimEnv('CARDCOM_API_URL') || defaultCardcomApiUrl
  const payload = {
    TerminalNumber: trimEnv('CARDCOM_TERMINAL_NUMBER'),
    ApiName: trimEnv('CARDCOM_API_NAME'),
    UserName: trimEnv('CARDCOM_USERNAME'),
    ApiPassword: trimEnv('CARDCOM_API_PASSWORD'),
    Operation: '1',
    CodePage: '65001',
    CoinID: '1',
    Amount: Number(Number(amount || 0).toFixed(2)),
    SumToBill: Number(Number(amount || 0).toFixed(2)),
    ReturnValue: orderId,
    SuccessRedirectUrl: successUrl,
    ErrorRedirectUrl: failedUrl,
    FailedRedirectUrl: failedUrl,
    IndicatorUrl: callbackUrl,
    CustomerName: customerName,
    CustomerEmail: customerEmail,
    CustomerPhone: customerPhone,
    ProductName: productName || 'רכישת מסלול',
  }

  const maxPay = Number(maxNumOfPayments)
  if (Number.isFinite(maxPay) && maxPay >= 1) {
    const capped = Math.min(120, Math.floor(maxPay))
    const minPay = Math.min(capped, Math.max(1, Math.floor(Number(minNumOfPayments) || 1)))
    const def =
      defaultNumOfPayments != null
        ? Math.min(capped, Math.max(minPay, Math.floor(Number(defaultNumOfPayments))))
        : minPay
    payload.MaxNumOfPayments = String(capped)
    payload.MinNumOfPayments = String(minPay)
    payload.DefaultNumOfPayments = String(def)
  }

  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) {
    if (value == null || value === '') continue
    body.append(key, String(value))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CARDCOM_FETCH_TIMEOUT_MS)
  let response
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body.toString(),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new CardcomApiError(`Cardcom request timed out after ${CARDCOM_FETCH_TIMEOUT_MS}ms`)
    }
    throw new CardcomApiError(err.message || String(err))
  } finally {
    clearTimeout(timeoutId)
  }

  const rawText = await response.text()
  if (!response.ok) throw new CardcomApiError(`Cardcom HTTP ${response.status}: ${rawText.slice(0, 300)}`)
  const data = parseBody(rawText)
  if (!data) throw new CardcomApiError('Cardcom returned unreadable response')
  const responseCode = String(data.ResponseCode ?? data.responseCode ?? '').trim()
  const description = decodeDescription(data.Description ?? data.description ?? '')
  if (responseCode && responseCode !== '0' && responseCode !== '1') {
    throw new CardcomApiError(description || `Cardcom rejected request (${responseCode})`, { responseCode })
  }
  const pathOrUrl = data.LowProfileUrl || data.lowProfileUrl || data.url || data.Url || data.URL
  if (!pathOrUrl) throw new CardcomApiError(description || 'Cardcom did not return payment URL')

  return { checkoutUrl: resolveCheckoutUrl(apiUrl, pathOrUrl), raw: data }
}

export const parseCardcomCallback = (payload) => {
  const orderId = payload?.ReturnValue || payload?.returnValue || payload?.Order || payload?.orderId || null
  const internalDealNumber = payload?.InternalDealNumber ?? payload?.internalDealNumber ?? payload?.DealNumber ?? null
  const transactionId = payload?.TransactionId ?? payload?.transactionId ?? internalDealNumber ?? null
  const responseCode = String(payload?.ResponseCode ?? payload?.responseCode ?? '').trim()
  const description = decodeDescription(payload?.Description ?? payload?.description ?? '')
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

function escapeXmlText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function callCardcomSoap(action, soapBodyXml) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CARDCOM_FETCH_TIMEOUT_MS)
  let response
  try {
    response = await fetch(BILL_GOLD_SOAP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `"BillGoldService/${action}"` },
      body: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${soapBodyXml}
  </soap:Body>
</soap:Envelope>`,
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw new CardcomApiError(`Cardcom request timed out after ${CARDCOM_FETCH_TIMEOUT_MS}ms`)
    throw new CardcomApiError(err.message || String(err))
  } finally {
    clearTimeout(timeoutId)
  }
  const rawXml = await response.text()
  if (!response.ok) throw new CardcomApiError(`Cardcom BillGoldService HTTP ${response.status}`)
  return rawXml
}

export async function cancelCardcomDealByInternalId({ internalDealNumber, amount }) {
  assertCardcomEnvConfigured()
  const terminalNumber = trimEnv('CARDCOM_TERMINAL_NUMBER')
  const userName = trimEnv('CARDCOM_USERNAME')
  const apiName = trimEnv('CARDCOM_API_NAME')
  const apiPassword = trimEnv('CARDCOM_API_PASSWORD')
  const deal = String(internalDealNumber || '').trim()
  if (!deal) throw new CardcomApiError('Missing InternalDealNumber for refund')
  const amountNumber = Number(amount)

  const refundAmountXml =
    Number.isFinite(amountNumber) && amountNumber > 0
      ? `<Amount>${escapeXmlText(amountNumber.toFixed(2))}</Amount>`
      : ''

  const bodyXml = `<CancelDeal xmlns="BillGoldService">
      <terminalnumber>${escapeXmlText(terminalNumber)}</terminalnumber>
      <username>${escapeXmlText(userName)}</username>
      <ApiName>${escapeXmlText(apiName)}</ApiName>
      <ApiPassword>${escapeXmlText(apiPassword)}</ApiPassword>
      <InternalDealNumber>${escapeXmlText(deal)}</InternalDealNumber>
      ${refundAmountXml}
    </CancelDeal>`

  const rawXml = await callCardcomSoap('CancelDeal', bodyXml)
  const resultBlock = firstInnerXml(rawXml, 'CancelDealResult')
  if (!resultBlock) throw new CardcomApiError('Unexpected Cardcom refund response')
  const responseCode = String(tagTextIn(resultBlock, 'ResponseCode') || '').trim()
  const description = decodeDescription(tagTextIn(resultBlock, 'Description'))
  const ok = responseCode === '0' || responseCode === '1'
  if (!ok) throw new CardcomApiError(description || `Cardcom refund rejected (${responseCode || 'unknown'})`, { responseCode })
  return { responseCode, description, rawXml }
}

export async function fetchCardcomLowProfileIndicator(lowProfileCode) {
  assertCardcomEnvConfigured()
  const terminalNumber = trimEnv('CARDCOM_TERMINAL_NUMBER')
  const userName = trimEnv('CARDCOM_USERNAME')
  const code = String(lowProfileCode || '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(code)) throw new CardcomApiError('Invalid lowProfileCode format')

  const soapBodyXml = `<GetLowProfileIndicator xmlns="BillGoldService">
      <terminalnumber>${escapeXmlText(terminalNumber)}</terminalnumber>
      <username>${escapeXmlText(userName)}</username>
      <lowProfileCode>${escapeXmlText(code)}</lowProfileCode>
    </GetLowProfileIndicator>`

  const rawXml = await callCardcomSoap('GetLowProfileIndicator', soapBodyXml)
  const resultBlock = firstInnerXml(rawXml, 'GetLowProfileIndicatorResult')
  if (!resultBlock) throw new CardcomApiError('Unexpected Cardcom response')

  const preIndicator = resultBlock.split(/<(?:[a-z]+:)?Indicator[\s>]/i)[0] || ''
  const indicatorXml = firstInnerXml(rawXml, 'Indicator')
  return {
    apiResponseCode: tagTextIn(preIndicator, 'ResponseCode'),
    apiDescription: decodeDescription(tagTextIn(preIndicator, 'Description')),
    returnValue: tagTextIn(indicatorXml, 'ReturnValue'),
    internalDealNumber: tagTextIn(indicatorXml, 'InternalDealNumber'),
    dealRespone: tagTextIn(indicatorXml, 'DealRespone'),
    prossesEndOK: tagTextIn(indicatorXml, 'ProssesEndOK'),
  }
}

export function buildCardcomCallbackFromLowProfileIndicator(parsed) {
  const dealRespone = String(parsed.dealRespone || '').trim()
  const prossesEndOK = String(parsed.prossesEndOK || '').trim()
  const hasDeal = Boolean(String(parsed.internalDealNumber || '').trim())
  let paymentResponseCode = dealRespone !== '' ? dealRespone : '999'
  if (paymentResponseCode === '999' && prossesEndOK === '1' && hasDeal) paymentResponseCode = '0'
  return parseCardcomCallback({
    ReturnValue: parsed.returnValue,
    InternalDealNumber: parsed.internalDealNumber,
    ResponseCode: paymentResponseCode,
    Description: parsed.apiDescription,
  })
}
