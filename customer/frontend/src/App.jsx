import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './layout/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import TreatmentsPage from './pages/TreatmentsPage'
import AnxietyPage from './pages/AnxietyPage'
import TraumaPage from './pages/TraumaPage'
import ContactPage from './pages/ContactPage'
import BookingPage from './pages/BookingPage'
import CoursesPage from './pages/CoursesPage'
import CategoryPage from './pages/CategoryPage'
import CustomerLoginPage from './pages/CustomerLoginPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import PurchaseModal from './components/PurchaseModal'
import ContactModal from './components/ContactModal'
import ProtectedRoute from './components/ProtectedRoute'

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
      <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/treatments" element={<TreatmentsPage />} />
        <Route path="/anxiety" element={<AnxietyPage />} />
        <Route path="/trauma" element={<TraumaPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/customer/login" element={<CustomerLoginPage />} />
        <Route 
          path="/customer/profile" 
          element={
            <ProtectedRoute>
              <CustomerProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/change-password" 
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <PurchaseModal />
      <ContactModal />
      </Layout>
    </>
  )
}

export default App
