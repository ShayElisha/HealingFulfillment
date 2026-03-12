import axios from 'axios'

// Use proxy in development, direct URL in production
// In development, vite proxy will handle /api requests
let API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

// Normalize API_URL - remove trailing slashes and ensure proper format
if (API_URL) {
  // Remove trailing slashes
  API_URL = API_URL.replace(/\/+$/, '')
  // For relative URLs starting with /, ensure no double slashes
  if (API_URL.startsWith('/')) {
    API_URL = API_URL.replace(/\/+/g, '/')
  }
  // If empty or just slashes, default to /api
  if (!API_URL || API_URL === '/') {
    API_URL = '/api'
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Add request interceptor for debugging and auth token
api.interceptors.request.use(
  (config) => {
    // הוסף token לכל בקשה אם קיים
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      console.error('API Connection Error: Backend server is not running or not accessible')
      console.error('Please make sure the backend server is running on', API_URL)
    }
    
    // טיפול ב-401 errors (לא מורשה) - התנתקות אוטומטית
    if (error.response?.status === 401 || error.response?.status === 403) {
      const token = localStorage.getItem('authToken')
      if (token) {
        // רק אם זה לא בקשות login או change-password
        const url = error.config?.url || ''
        if (!url.includes('/auth/login') && !url.includes('/auth/change-password')) {
          localStorage.removeItem('authToken')
          // אם אנחנו לא בדף login, הפנה לשם
          if (window.location.pathname !== '/customer/login') {
            window.location.href = '/customer/login'
          }
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export const contactService = {
  submit: async (data) => {
    const response = await api.post('/contact', data)
    return response.data
  },
}

export const bookingService = {
  submit: async (data) => {
    const response = await api.post('/booking', data)
    return response.data
  },
}

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories')
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },
}

export default api

