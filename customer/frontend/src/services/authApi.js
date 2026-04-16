import api from './api'

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (import.meta.env.DEV) {
        console.log('[AuthService] Login response:', response.status)
      }
      return response.data
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[AuthService] Login error:', error.response || error)
      }
      throw error
    }
  },
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword })
    return response.data
  },
  
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { 
      oldPassword, 
      newPassword 
    })
    return response.data
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  createBooking: async (bookingData) => {
    const response = await api.post('/auth/booking', bookingData)
    return response.data
  },
  cancelBooking: async (bookingId) => {
    const response = await api.post(`/auth/booking/${bookingId}/cancel`)
    return response.data
  },
  requestPurchaseRefund: async (purchaseId, reason = '') => {
    const response = await api.post(`/auth/purchases/${purchaseId}/refund-request`, { reason })
    return response.data
  },
  
  getMessages: async () => {
    const response = await api.get('/auth/messages')
    return response.data
  },

  submitRegulationsQuestionnaire: async (payload) => {
    const response = await api.post('/auth/regulations-questionnaire', payload)
    return response.data
  },

  getTriggerJournal: async (params = {}) => {
    const response = await api.get('/auth/trigger-journal', { params })
    return response.data
  },
  createTriggerJournal: async (payload) => {
    const response = await api.post('/auth/trigger-journal', payload)
    return response.data
  },
  deleteTriggerJournal: async (entryId) => {
    const response = await api.delete(`/auth/trigger-journal/${entryId}`)
    return response.data
  },
}

export const messageService = {
  getCustomerMessages: async (customerId) => {
    const response = await api.get(`/messages/customer/${customerId}`)
    return response.data
  }
}

