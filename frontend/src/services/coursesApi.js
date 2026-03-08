import api from './api'

export const coursesService = {
  getAll: async () => {
    const response = await api.get('/courses')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/courses/${id}`)
    return response.data
  },
}

