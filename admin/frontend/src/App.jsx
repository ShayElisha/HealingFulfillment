import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'
import { NavCountsProvider } from './context/NavCountsContext'
import api from './services/api'
import { getCustomerLoginUrl } from './utils/customerPortalUrl'
import { getSafeAdminReturnToUrl } from './utils/safeAdminReturnTo'

const LAZY_RETRY_KEY = 'admin_lazy_chunk_retry_done'

function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const mod = await importer()
      try {
        window.sessionStorage.removeItem(LAZY_RETRY_KEY)
      } catch {}
      return mod
    } catch (err) {
      const msg = String(err?.message || '')
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed')
      if (isChunkError) {
        let alreadyRetried = false
        try {
          alreadyRetried = window.sessionStorage.getItem(LAZY_RETRY_KEY) === '1'
        } catch {}
        if (!alreadyRetried) {
          try {
            window.sessionStorage.setItem(LAZY_RETRY_KEY, '1')
          } catch {}
          window.location.reload()
          return new Promise(() => {})
        }
      }
      throw err
    }
  })
}

const AdminPage = lazyWithRetry(() => import('./pages/AdminPage'))
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'))
const CustomerPage = lazyWithRetry(() => import('./pages/CustomerPage'))
const CustomersPage = lazyWithRetry(() => import('./pages/CustomersPage'))
const BookingsPage = lazyWithRetry(() => import('./pages/BookingsPage'))
const ContactsPage = lazyWithRetry(() => import('./pages/ContactsPage'))
const MessagesPage = lazyWithRetry(() => import('./pages/MessagesPage'))
const ReviewsPage = lazyWithRetry(() => import('./pages/ReviewsPage'))
const LeadsPage = lazyWithRetry(() => import('./pages/LeadsPage'))
const TransactionsPage = lazyWithRetry(() => import('./pages/TransactionsPage'))
const ForWhomAudiencePage = lazyWithRetry(() => import('./pages/ForWhomAudiencePage'))
const AvailabilityPage = lazyWithRetry(() => import('./pages/AvailabilityPage'))

const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken'

function redirectToCustomerLogin() {
  if (typeof window === 'undefined') return
  const loginUrl = getCustomerLoginUrl()
  const returnToRaw = getSafeAdminReturnToUrl()
  try {
    const abs = /^[a-z][a-z0-9+.-]*:/i.test(loginUrl)
      ? loginUrl
      : new URL(loginUrl, window.location.origin).toString()
    const u = new URL(abs)
    u.searchParams.set('returnTo', returnToRaw)
    window.location.replace(u.toString())
  } catch {
    const sep = loginUrl.includes('?') ? '&' : '?'
    window.location.replace(`${loginUrl}${sep}returnTo=${encodeURIComponent(returnToRaw)}`)
  }
}

/**
 * אימות ראשוני בלבד: בלי טוקן או 401/403 → הפניה להתחברות.
 * שגיאת שרת / רשת / 500 על verify — לא חוסמים את הממשק; קריאות API יציגו שגיאות מקומית.
 */
function AdminAccessGate({ children }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
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

        try {
          await api.get('/admin/auth/verify')
        } catch (error) {
          if (cancelled) return
          const st = error.response?.status
          if (st === 401 || st === 403) {
            try {
              window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
            } catch {}
            redirectToCustomerLogin()
            return
          }
          console.warn(
            'Admin verify non-fatal:',
            st ?? error.code,
            error.response?.data?.message || error.message
          )
        }

        if (!cancelled) setReady(true)
      } catch (e) {
        if (!cancelled) {
          console.warn('Admin gate bootstrap:', e)
          setReady(true)
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-neutral-600">
        טוען…
      </div>
    )
  }

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
                  <Route path="/availability" element={<AvailabilityPage />} />
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
