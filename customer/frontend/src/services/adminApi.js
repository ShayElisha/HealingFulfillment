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

