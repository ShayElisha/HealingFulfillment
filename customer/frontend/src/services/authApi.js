import api from './api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
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

