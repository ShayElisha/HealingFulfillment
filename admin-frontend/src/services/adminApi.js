import api from './api'

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/admin/categories')
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/admin/categories', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/admin/categories/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`)
    return response.data
  },
}

export const courseService = {
  getAll: async () => {
    const response = await api.get('/admin/courses')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/admin/courses/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/admin/courses', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/admin/courses/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/courses/${id}`)
    return response.data
  },
}

export const purchaseService = {
  getAll: async () => {
    const response = await api.get('/admin/purchases')
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/purchases', data)
    return response.data
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/purchases/${id}/status`, { status })
    return response.data
  },
}

export const bookingService = {
  getAll: async () => {
    const response = await api.get('/admin/bookings')
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/booking', data)
    return response.data
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/bookings/${id}/status`, { status })
    return response.data
  },
  updateZoomLink: async (id, zoomLink) => {
    const response = await api.put(`/admin/bookings/${id}/zoom-link`, { zoomLink })
    return response.data
  },
}

