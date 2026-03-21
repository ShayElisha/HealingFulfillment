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
}

