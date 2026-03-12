import api from './api'

export const customerService = {
  getAll: async () => {
    const response = await api.get('/admin/customers')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/admin/customers/${id}`)
    return response.data
  },
  uploadFile: async (id, formData) => {
    const response = await api.post(`/admin/customers/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  deleteFile: async (customerId, fileId) => {
    const response = await api.delete(`/admin/customers/${customerId}/files/${fileId}`)
    return response.data
  },
  addNote: async (id, content) => {
    const response = await api.post(`/admin/customers/${id}/notes`, { content })
    return response.data
  },
  updateSessions: async (id, completedSessions) => {
    const response = await api.put(`/admin/customers/${id}/sessions`, { completedSessions })
    return response.data
  },
  createAccount: async (id) => {
    const response = await api.post(`/admin/customers/${id}/create-account`)
    return response.data
  },
  resetPassword: async (id) => {
    const response = await api.post(`/admin/customers/${id}/reset-password`)
    return response.data
  }
}

