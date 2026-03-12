import api from './api'

export const authService = {
  login: async (email, password) => {
    const url = '/auth/login'
    const baseURL = import.meta.env.VITE_API_URL || '/api'
    const fullURL = `${baseURL}${url}`
    console.log(`[AuthService] Login request to: ${fullURL}`)
    console.log(`[AuthService] BaseURL: ${baseURL}, URL: ${url}`)
    try {
      const response = await api.post('/auth/login', { email, password })
      console.log(`[AuthService] Login response:`, response.status, response.data)
      return response.data
    } catch (error) {
      console.error(`[AuthService] Login error:`, error)
      console.error(`[AuthService] Error response:`, error.response)
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
  }
}

export const messageService = {
  getCustomerMessages: async (customerId) => {
    const response = await api.get(`/messages/customer/${customerId}`)
    return response.data
  }
}

