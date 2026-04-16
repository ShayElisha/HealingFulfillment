import api from './api'

export const reviewsService = {
  getAll: async () => {
    const response = await api.get('/reviews')
    return response.data
  },
  
  getStats: async () => {
    const response = await api.get('/reviews/stats')
    return response.data
  },
  
  getMyReview: async () => {
    const response = await api.get('/reviews/my-review')
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/reviews', data)
    return response.data
  },
  
  uploadVideo: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const response = await api.post('/reviews/upload-video', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/reviews/${id}`, data)
    return response.data
  }
}

