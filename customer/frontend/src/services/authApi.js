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
  
  getMessages: async () => {
    const response = await api.get('/auth/messages')
    return response.data
  },

  submitRegulationsQuestionnaire: async (payload) => {
    const response = await api.post('/auth/regulations-questionnaire', payload)
    return response.data
  },
}

export const messageService = {
  getCustomerMessages: async (customerId) => {
    const response = await api.get(`/messages/customer/${customerId}`)
    return response.data
  }
}

