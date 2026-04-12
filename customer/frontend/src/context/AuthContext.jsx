import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { authService } from '../services/authApi'
import { takeAdminLogoutRedirectFlag } from '../utils/adminLogoutSync'

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

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('authToken')
  }, [])

  const loadUser = useCallback(
    async (tokenToUse) => {
      const effective = tokenToUse !== undefined && tokenToUse !== null ? tokenToUse : token
      if (!effective) {
        setLoading(false)
        return
      }

      try {
        const response = await authService.getMe()
        setUser(response.data)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error loading user:', error)
        logout()
      } finally {
        setLoading(false)
      }
    },
    [token, logout]
  )

  useEffect(() => {
    if (takeAdminLogoutRedirectFlag()) {
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      setToken(storedToken)
      loadUser(storedToken)
    } else {
      setLoading(false)
    }
    // Bootstrap only — loadUser is stable enough for first paint via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const body = await authService.login(email, password)
      const { token: newToken, customer } = body.data

      setToken(newToken)
      setUser(customer)
      setIsAuthenticated(true)
      localStorage.setItem('authToken', newToken)

      return {
        success: true,
        mustChangePassword: customer.mustChangePassword,
        isAdmin: customer.isAdmin === true,
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה בהתחברות'
      throw new Error(errorMessage)
    }
  }, [])

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      await authService.changePassword(oldPassword, newPassword)
      if (user) {
        setUser({ ...user, mustChangePassword: false })
      }
      return { success: true }
    } catch (error) {
      console.error('Change password error:', error)
      const errorMessage = error.response?.data?.message || 'שגיאה בשינוי סיסמה'
      throw new Error(errorMessage)
    }
  }, [user])

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      token,
      loading,
      login,
      logout,
      changePassword,
      loadUser,
    }),
    [isAuthenticated, user, token, loading, login, logout, changePassword, loadUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
