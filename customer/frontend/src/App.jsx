import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './layout/Layout'
import PurchaseModal from './components/PurchaseModal'
import ContactModal from './components/ContactModal'
import ProtectedRoute from './components/ProtectedRoute'

const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const TreatmentsPage = lazy(() => import('./pages/TreatmentsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const CustomerLoginPage = lazy(() => import('./pages/CustomerLoginPage'))
const CustomerProfilePage = lazy(() => import('./pages/CustomerProfilePage'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-neutral-600" aria-busy="true">
      טוען...
    </div>
  )
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
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/treatments" element={<TreatmentsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failed" element={<PaymentFailedPage />} />
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
        </Suspense>
        <PurchaseModal />
        <ContactModal />
      </Layout>
    </>
  )
}

export default App
