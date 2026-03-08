import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import CustomerPage from './pages/CustomerPage'
import CustomersPage from './pages/CustomersPage'
import BookingsPage from './pages/BookingsPage'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<AdminPage />} />
          <Route path="/customer/:id" element={<CustomerPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App

