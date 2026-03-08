import { Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import TreatmentsPage from './pages/TreatmentsPage'
import AnxietyPage from './pages/AnxietyPage'
import TraumaPage from './pages/TraumaPage'
import BlogPage from './pages/BlogPage'
import ContactPage from './pages/ContactPage'
import BookingPage from './pages/BookingPage'
import CoursesPage from './pages/CoursesPage'
import CategoryPage from './pages/CategoryPage'
import CustomerLoginPage from './pages/CustomerLoginPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import PurchaseModal from './components/PurchaseModal'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/treatments" element={<TreatmentsPage />} />
        <Route path="/anxiety" element={<AnxietyPage />} />
        <Route path="/trauma" element={<TraumaPage />} />
        <Route path="/blog" element={<BlogPage />} />
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
    </Layout>
  )
}

export default App

