const CARDCOM_API_URL = process.env.CARDCOM_API_URL || 'https://secure.cardcom.solutions/Interface/LowProfile.aspx'
const CARDCOM_TERMINAL_NUMBER = process.env.CARDCOM_TERMINAL_NUMBER
const CARDCOM_USERNAME = process.env.CARDCOM_USERNAME
const CARDCOM_API_NAME = process.env.CARDCOM_API_NAME
const CARDCOM_WEBHOOK_SECRET = process.env.CARDCOM_WEBHOOK_SECRET || ''

const normalizeAmount = (amount) => Number(Number(amount || 0).toFixed(2))

export const isCardcomConfigured = () => {
  return Boolean(CARDCOM_TERMINAL_NUMBER && CARDCOM_USERNAME && CARDCOM_API_NAME)
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
}) => {
  if (!isCardcomConfigured()) {
    throw new Error('Cardcom is not configured. Missing terminal/API credentials.')
  }

  const payload = {
    TerminalNumber: CARDCOM_TERMINAL_NUMBER,
    ApiName: CARDCOM_API_NAME,
    UserName: CARDCOM_USERNAME,
    Operation: '1',
    CodePage: '65001',
    CoinID: '1',
    Amount: normalizeAmount(amount),
    ReturnValue: orderId,
    SuccessRedirectUrl: successUrl,
    FailedRedirectUrl: failedUrl,
    IndicatorUrl: callbackUrl,
    CustomerName: customerName,
    CustomerEmail: customerEmail,
    CustomerPhone: customerPhone,
  }

  const response = await fetch(CARDCOM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Cardcom API request failed with status ${response.status}`)
  }

  const data = await response.json().catch(() => null)
  if (!data) {
    throw new Error('Cardcom response is not valid JSON')
  }

  const checkoutUrl = data?.url || data?.Url || data?.LowProfileUrl || data?.lowProfileUrl
  if (!checkoutUrl) {
    const errorMessage = data?.Description || data?.Message || 'Cardcom did not return checkout URL'
    throw new Error(errorMessage)
  }

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
  if (!CARDCOM_WEBHOOK_SECRET) {
    return true
  }

  const incomingSecret = payload?.WebhookSecret || payload?.webhookSecret || payload?.secret
  return incomingSecret === CARDCOM_WEBHOOK_SECRET
}

