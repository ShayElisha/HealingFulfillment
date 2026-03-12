import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-xl text-neutral-600">טוען...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/customer/login" replace />
  }

  // אם צריך לשנות סיסמה, הפנה לדף שינוי סיסמה
  // אבל רק אם זה לא דף שינוי סיסמה עצמו
  if (user?.mustChangePassword && location.pathname !== '/customer/change-password') {
    return <Navigate to="/customer/change-password" replace />
  }

  return children
}

export default ProtectedRoute

