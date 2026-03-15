import axios from 'axios'

// Use proxy in development, same domain in production (Vercel)
// In development, vite proxy will handle /api requests
// In production (Vercel), use /api which will be rewritten to /api/index.js
const getApiUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // In development, use proxy
  // import.meta.env.DEV is true in dev mode, false in production
  // import.meta.env.PROD is true in production, false in dev mode
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return '/api'
  }
  
  // In production (Vercel), use same domain
  // Vercel will rewrite /api/* to /api/index.js
  // Always use /api in production - it will be rewritten by Vercel
  return '/api'
}

const API_URL = getApiUrl()

// Ensure baseURL doesn't end with slash to avoid double slashes
const normalizedBaseURL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Add request interceptor for debugging and URL normalization
api.interceptors.request.use(
  (config) => {
    // Normalize baseURL - remove trailing slash
    if (config.baseURL && config.baseURL.endsWith('/')) {
      config.baseURL = config.baseURL.slice(0, -1)
    }
    
    // Normalize URL - ensure it starts with /
    if (config.url) {
      if (!config.url.startsWith('/')) {
        config.url = '/' + config.url
      }
    }
    
    // Build full URL and normalize double slashes
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`.replace(/\/+/g, '/')
    
    // Update config.url to use the normalized full URL (relative to baseURL)
    // Axios will combine baseURL + url, so we keep url as relative path
    console.log(`API Request: ${config.method?.toUpperCase()} ${fullUrl}`)
    
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
      console.error('Please make sure the admin backend server is running on port 5001')
    }
    return Promise.reject(error)
  }
)

export default api

