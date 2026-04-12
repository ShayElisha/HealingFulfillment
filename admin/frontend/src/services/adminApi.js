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
    console.log('courseService.getAll() - Making request to /admin/courses')
    try {
    const response = await api.get('/admin/courses')
      console.log('courseService.getAll() - Response received:', response)
      console.log('courseService.getAll() - Response.data:', response.data)
      console.log('courseService.getAll() - Response.data type:', typeof response.data)
      console.log('courseService.getAll() - Response.data.data:', response.data?.data)
      
      // Axios automatically parses JSON, so response.data is the parsed JSON
      // The API returns { message, data }, so response.data is { message, data }
      // We return response.data which is { message, data }
    return response.data
    } catch (error) {
      console.error('courseService.getAll() - Error:', error)
      console.error('courseService.getAll() - Error response:', error.response)
      console.error('courseService.getAll() - Error message:', error.message)
      console.error('courseService.getAll() - Error code:', error.code)
      
      // Re-throw with more context
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      const enhancedError = new Error(errorMessage)
      enhancedError.response = error.response
      enhancedError.status = error.response?.status
      throw enhancedError
    }
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

export const statsService = {
  getNavCounts: async () => {
    const response = await api.get('/admin/stats/nav-counts')
    return response.data
  },
  getDashboard: async (params = {}) => {
    const response = await api.get('/admin/stats/dashboard', { params })
    return response.data
  },
  getActivityFeed: async (params = {}) => {
    const response = await api.get('/admin/stats/activity-feed', { params })
    return response.data
  },
  markNotificationRead: async ({ kind, activityId }) => {
    const response = await api.post('/admin/stats/notifications/mark-read', { kind, activityId })
    return response.data
  },
  markAllNotificationsRead: async ({ items }) => {
    const response = await api.post('/admin/stats/notifications/mark-all-read', { items })
    return response.data
  },
}

export const purchaseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/purchases', { params })
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
  getAll: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params })
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
  updateSessionSummary: async (id, sessionSummary) => {
    const response = await api.put(`/admin/bookings/${id}/session-summary`, { sessionSummary })
    return response.data
  },
}

/** תצוגת יום לפי מערכת הזמינות (כמו אצל הלקוח) */
export const availabilityPreviewService = {
  getDay: async ({ date, meetingType = 'frontend', isIntroMeeting = false }) => {
    const response = await api.get('/admin/availability/preview', {
      params: {
        date,
        meetingType,
        isIntroMeeting: isIntroMeeting ? 'true' : 'false',
      },
    })
    return response.data
  },
}

export const contactService = {
  getAll: async (params = {}) => {
    const response = await api.get('/contact', { params })
    return response.data
  },
  markAsRead: async (id) => {
    const response = await api.put(`/contact/${id}/read`)
    return response.data
  },
}

export const messageService = {
  getAll: async (params = {}) => {
    const response = await api.get('/messages', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/messages/${id}`)
    return response.data
  },
  send: async (data) => {
    const response = await api.post('/messages', data)
    return response.data
  },
  getCustomerMessages: async (customerId) => {
    const response = await api.get(`/messages/customer/${customerId}`)
    return response.data
  },
}

export const reviewService = {
  getAll: async (params = {}) => {
    const response = await api.get('/reviews/admin/all', { params })
    return response.data
  },
  updateStatus: async (id, status) => {
    const response = await api.put(`/reviews/admin/${id}/status`, { status })
    return response.data
  },
}

export const leadService = {
  getAll: async (params = {}) => {
    const response = await api.get('/leads', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/leads/${id}`)
    return response.data
  },
  updateStatus: async (id, status, adminNotes) => {
    const response = await api.put(`/leads/${id}/status`, { status, adminNotes })
    return response.data
  },
}

/** העלאות לבלוקי «למי זה מתאים» — נשמר ב-Cloudinary (URL מלא ב-response) */
export const forWhomUploadService = {
  uploadAudio: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const response = await api.post('/upload/for-whom/audio', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  uploadImage: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const response = await api.post('/upload/for-whom/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export const forWhomAudienceService = {
  getAll: async () => {
    const response = await api.get('/admin/for-whom-audience')
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/admin/for-whom-audience', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/admin/for-whom-audience/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/admin/for-whom-audience/${id}`)
    return response.data
  },
  seed: async () => {
    const response = await api.post('/admin/for-whom-audience/seed')
    return response.data
  },
}

export const availabilitySettingsService = {
  getTreatmentTypes: async () => {
    const response = await api.get('/admin/availability/treatment-types')
    return response.data
  },
  updateTreatmentType: async (id, data) => {
    const response = await api.put(`/admin/availability/treatment-types/${id}`, data)
    return response.data
  },
  getWorkingHours: async () => {
    const response = await api.get('/admin/availability/working-hours')
    return response.data
  },
  addWorkingHours: async (data) => {
    const response = await api.post('/admin/availability/working-hours', data)
    return response.data
  },
  deleteWorkingHours: async (id) => {
    const response = await api.delete(`/admin/availability/working-hours/${id}`)
    return response.data
  },
  getBlocks: async () => {
    const response = await api.get('/admin/availability/blocks')
    return response.data
  },
  addBlock: async (data) => {
    const response = await api.post('/admin/availability/blocks', data)
    return response.data
  },
  deleteBlock: async (id) => {
    const response = await api.delete(`/admin/availability/blocks/${id}`)
    return response.data
  },
  getTimeOff: async () => {
    const response = await api.get('/admin/availability/time-off')
    return response.data
  },
  addTimeOff: async (data) => {
    const response = await api.post('/admin/availability/time-off', data)
    return response.data
  },
  deleteTimeOff: async (id) => {
    const response = await api.delete(`/admin/availability/time-off/${id}`)
    return response.data
  },
  preview: async (params) => {
    const qs = new URLSearchParams(params).toString()
    const response = await api.get(`/admin/availability/preview?${qs}`)
    return response.data
  },
}

export const transactionService = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/transactions${queryString ? `?${queryString}` : ''}`)
    return response.data
  },
  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/transactions/stats${queryString ? `?${queryString}` : ''}`)
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/transactions', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data)
    return response.data
  },
  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`)
    return response.data
  },
}

