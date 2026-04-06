import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'
import CustomerPage from './pages/CustomerPage'
import CustomersPage from './pages/CustomersPage'
import BookingsPage from './pages/BookingsPage'
import ContactsPage from './pages/ContactsPage'
import MessagesPage from './pages/MessagesPage'
import ReviewsPage from './pages/ReviewsPage'
import LeadsPage from './pages/LeadsPage'
import TransactionsPage from './pages/TransactionsPage'
import ErrorBoundary from './components/ErrorBoundary'
import { NavCountsProvider } from './context/NavCountsContext'

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
        <Router>
          <NavCountsProvider>
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
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
            </Routes>
          </NavCountsProvider>
        </Router>
      </ErrorBoundary>
    </>
  )
}

export default App

