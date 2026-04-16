import api from './api'

export const customerService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/customers', { params })
    return response.data
  },
  create: async (payload) => {
    const response = await api.post('/admin/customers', payload)
    return response.data
  },
  openCase: async (id, body = {}) => {
    const response = await api.post(`/admin/customers/${id}/open-case`, body)
    return response.data
  },
  setPurchaseCoachingWindow: async (customerId, purchaseId, body = {}) => {
    const response = await api.post(
      `/admin/customers/${customerId}/purchases/${purchaseId}/coaching-window`,
      body
    )
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/admin/customers/${id}`)
    return response.data
  },
  /** קובץ ללקוח — נשמר ב-Cloudinary */
  uploadFile: async (id, formData, options = {}) => {
    const { onUploadProgress } = options
    const response = await api.post(`/admin/customers/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15 * 60 * 1000,
      onUploadProgress:
        typeof onUploadProgress === 'function'
          ? (e) => {
              const total = e.total || 0
              const pct = total ? Math.round((e.loaded * 100) / total) : null
              onUploadProgress(pct, e.loaded, total)
            }
          : undefined,
    })
    return response.data
  },
  /** אודיו ללקוח — נשמר ב-Cloudinary */
  uploadAudio: async (id, formData, options = {}) => {
    const { onUploadProgress } = options
    const response = await api.post(`/admin/customers/${id}/audio`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15 * 60 * 1000,
      onUploadProgress:
        typeof onUploadProgress === 'function'
          ? (e) => {
              const total = e.total || 0
              const pct = total ? Math.round((e.loaded * 100) / total) : null
              onUploadProgress(pct, e.loaded, total)
            }
          : undefined,
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
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/customers/${id}/status`, { status })
    return response.data
  },
  createAccount: async (id) => {
    const response = await api.post(`/admin/customers/${id}/create-account`)
    return response.data
  },
  resetPassword: async (id) => {
    const response = await api.post(`/admin/customers/${id}/reset-password`)
    return response.data
  },
  getTriggerJournal: async (id, params = {}) => {
    const response = await api.get(`/admin/customers/${id}/trigger-journal`, { params })
    return response.data
  },
}

