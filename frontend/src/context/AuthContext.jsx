import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authApi'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // טען token מ-localStorage בעת טעינת האפליקציה
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      // נסה לטעון את פרטי המשתמש
      loadUser(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const loadUser = async (tokenToUse = token) => {
    if (!tokenToUse) {
      setLoading(false)
      return
    }

    try {
      const response = await authService.getMe()
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error loading user:', error)
      // אם יש שגיאה, נקה את ה-token
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      const { token: newToken, customer } = response.data
      
      setToken(newToken)
      setUser(customer)
      setIsAuthenticated(true)
      localStorage.setItem('authToken', newToken)
      
      return { success: true, mustChangePassword: customer.mustChangePassword }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה בהתחברות'
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('authToken')
  }

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await authService.changePassword(oldPassword, newPassword)
      // עדכן את המשתמש כדי להסיר את mustChangePassword
      if (user) {
        setUser({ ...user, mustChangePassword: false })
      }
      return { success: true }
    } catch (error) {
      console.error('Change password error:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה בשינוי סיסמה'
      throw new Error(errorMessage)
    }
  }

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    loadUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

