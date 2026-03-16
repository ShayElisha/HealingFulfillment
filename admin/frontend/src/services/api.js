import axios from 'axios'

// Use proxy in development, same domain in production (Vercel)
// In development, vite proxy will handle /api requests
// In production (Vercel), use /api which will be rewritten to /api/index.js
const getApiUrl = () => {
  // Check if we're in production
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production'
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
  
  // If VITE_API_URL is explicitly set, check if it's the same domain
  if (import.meta.env.VITE_API_URL) {
    const viteApiUrl = import.meta.env.VITE_API_URL.trim()
    
    // If it's a full URL, check if it's the same domain as current page
    if (viteApiUrl.startsWith('http://') || viteApiUrl.startsWith('https://')) {
      // In browser, check if it's same origin
      if (typeof window !== 'undefined') {
        try {
          const viteUrl = new URL(viteApiUrl)
          const currentUrl = new URL(window.location.href)
          
          // If same origin, use relative path /api instead
          if (viteUrl.origin === currentUrl.origin) {
            console.log('VITE_API_URL is same origin, using /api instead')
            return '/api'
          }
        } catch (e) {
          // If URL parsing fails, fall through to use the provided URL
        }
      }
      
      // Different origin or server-side, use the full URL
      console.log('Using VITE_API_URL (different origin):', viteApiUrl)
      return viteApiUrl.endsWith('/') ? viteApiUrl.slice(0, -1) : viteApiUrl
    }
    
    // Relative path - use as is
    console.log('Using VITE_API_URL (relative):', viteApiUrl)
    return viteApiUrl
  }
  
  // In development, use proxy
  if (isDevelopment) {
    console.log('Development mode: Using /api proxy')
    return '/api'
  }
  
  // In production (Vercel), use same domain
  // Vercel will rewrite /api/* to /api/index.js
  // Always use /api in production - it will be rewritten by Vercel
  console.log('Production mode: Using /api (Vercel rewrite)')
  return '/api'
}

const API_URL = getApiUrl()

// Ensure baseURL doesn't end with slash to avoid double slashes
const normalizedBaseURL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL

console.log('API Configuration:', {
  API_URL,
  normalizedBaseURL,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  viteApiUrl: import.meta.env.VITE_API_URL
})

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for production
  withCredentials: false, // Don't send credentials for same-origin requests
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
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      console.error('API Connection Error: Backend server is not running or not accessible')
      console.error('Please make sure the admin backend server is running on port 5001')
    }
    return Promise.reject(error)
  }
)

export default api

