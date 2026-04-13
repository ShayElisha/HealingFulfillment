import axios from 'axios'

function getApiBaseUrl() {
  const raw = String(import.meta.env.VITE_API_URL || '').trim()
  // Default to same-origin API in both dev/prod (Vite proxy in dev, rewrites in prod)
  if (!raw) return '/api'

  // Keep absolute URLs untouched (except trailing slash).
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.endsWith('/') ? raw.slice(0, -1) : raw
  }

  // If someone passed only host/path without protocol, prefer same-origin /api.
  if (raw.includes('.vercel.app') || raw.includes('.app') || raw.includes('localhost')) {
    const pathMatch = raw.match(/\/api.*$/)
    return pathMatch ? pathMatch[0].replace(/\/+$/, '') : '/api'
  }

  // Relative path fallback.
  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  return normalized.endsWith('/') && normalized !== '/' ? normalized.slice(0, -1) : normalized
}

const API_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: import.meta.env.PROD ? 25000 : 10000, // Vercel cold starts may exceed 10s
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
      // Normalize URLs to prevent double slashes
      const baseURL = (config.baseURL || '').replace(/\/+$/, '') // Remove trailing slashes
      const url = (config.url || '').replace(/^\/+/, '') // Remove leading slashes
      
      // Reconstruct the URL properly
      if (baseURL && url) {
        config.url = '/' + url
        config.baseURL = baseURL
      }
    }
    
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }
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
  getAvailability: async (arg) => {
    const opts = typeof arg === 'string' ? { date: arg } : arg || {}
    const { date, meetingType = 'frontend', isIntroMeeting = true } = opts
    const params = {
      date,
      meetingType,
      isIntroMeeting: isIntroMeeting ? 'true' : 'false',
    }
    const response = await api.get('/booking/availability', { params })
    return response.data
  },
  getPublicWorkingHours: async () => {
    const response = await api.get('/booking/public-working-hours')
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

export const forWhomAudienceService = {
  getAll: async () => {
    const response = await api.get('/for-whom-audience')
    return response.data
  },
  getPageById: async (id) => {
    const response = await api.get(
      `/for-whom-audience/page/${encodeURIComponent(id)}`
    )
    return response.data
  },
}

export default api

