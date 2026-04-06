import api from './api'

export const purchaseService = {
  create: async (data) => {
    const response = await api.post('/purchases', data)
    return response.data
  },
  createCheckout: async (data) => {
    const response = await api.post('/purchases/create-checkout', data)
    return response.data
  },
  /** סטטוס תשלום לפי orderId — לא משנה את מצב הרכישה (לצורך polling אחרי חזרה מ-Cardcom) */
  getPaymentStatus: async (orderId) => {
    const response = await api.get(`/purchases/payment-status/${encodeURIComponent(orderId)}`)
    return response.data
  },
  /** אימות מול Cardcom לפי lowProfileCode מה-URL (כשאין webhook ל-localhost) */
  confirmCardcomRedirect: async ({ orderId, lowProfileCode }) => {
    const response = await api.post('/purchases/cardcom/confirm-from-redirect', {
      orderId,
      lowProfileCode,
    })
    return response.data
  },
}
