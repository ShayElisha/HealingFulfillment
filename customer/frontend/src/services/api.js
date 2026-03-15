import axios from 'axios'

// Use proxy in development, direct URL in production
// In development, vite proxy will handle /api requests
let API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api')

// Normalize API_URL - ensure proper format
if (API_URL) {
  // Remove any double slashes
  API_URL = API_URL.replace(/\/+/g, '/')
  // Remove trailing slash (axios will add it when needed)
  if (API_URL.endsWith('/') && API_URL !== '/') {
    API_URL = API_URL.slice(0, -1)
  }
  // Ensure it starts with / for relative URLs
  if (!API_URL.startsWith('/') && !API_URL.startsWith('http')) {
    API_URL = '/' + API_URL
  }
  // Default to /api if empty
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
    
    // Fix double slashes in URL
    if (config.baseURL && config.url) {
      // Remove leading slash from url if baseURL ends with slash, or vice versa
      const baseURL = config.baseURL.replace(/\/+$/, '') // Remove trailing slashes
      const url = config.url.replace(/^\/+/, '') // Remove leading slashes
      config.url = '/' + url // Ensure url starts with /
      // The baseURL should not end with /, and url should start with /
      // Axios will combine them correctly
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

