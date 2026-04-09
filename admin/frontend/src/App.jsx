import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import { NavCountsProvider } from './context/NavCountsContext'
import api from './services/api'
import { getCustomerLoginUrl } from './utils/customerPortalUrl'

const AdminPage = lazy(() => import('./pages/AdminPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CustomerPage = lazy(() => import('./pages/CustomerPage'))
const CustomersPage = lazy(() => import('./pages/CustomersPage'))
const BookingsPage = lazy(() => import('./pages/BookingsPage'))
const ContactsPage = lazy(() => import('./pages/ContactsPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'))
const LeadsPage = lazy(() => import('./pages/LeadsPage'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'))
const ForWhomAudiencePage = lazy(() => import('./pages/ForWhomAudiencePage'))

const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken'

function redirectToCustomerLogin() {
  if (typeof window === 'undefined') return
  const loginUrl = getCustomerLoginUrl()
  const returnTo = encodeURIComponent(window.location.href)
  window.location.replace(`${loginUrl}?returnTo=${returnTo}`)
}

function AdminAccessGate({ children }) {
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function verifyAccess() {
      try {
        const current = new URL(window.location.href)
        const tokenFromQuery = current.searchParams.get('token')
        if (tokenFromQuery) {
          window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, tokenFromQuery)
          current.searchParams.delete('token')
          window.history.replaceState({}, '', current.toString())
        }
        const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
        if (!token) {
          redirectToCustomerLogin()
          return
        }
        await api.get('/admin/auth/verify')
        if (!cancelled) setAllowed(true)
      } catch (error) {
        try {
          window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
        } catch {}
        redirectToCustomerLogin()
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    verifyAccess()
    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-neutral-600">מאמת הרשאות…</div>
  }
  if (!allowed) return null
  return children
}

function App() {
  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ErrorBoundary>
        <AdminAccessGate>
          <Router>
            <NavCountsProvider>
              <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-neutral-600">טוען…</div>}>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/" element={<Navigate to="/categories" replace />} />
                  <Route path="/categories" element={<AdminPage />} />
                  <Route path="/courses" element={<AdminPage />} />
                  <Route path="/purchase" element={<AdminPage />} />
                  <Route path="/new-booking" element={<AdminPage />} />
                  <Route path="/customer/:id" element={<CustomerPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/contacts" element={<ContactsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/for-whom-audience" element={<ForWhomAudiencePage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                </Routes>
              </Suspense>
            </NavCountsProvider>
          </Router>
        </AdminAccessGate>
      </ErrorBoundary>
    </>
  )
}

export default App

