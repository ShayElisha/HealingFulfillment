import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CategoriesDropdown from '../components/CategoriesDropdown'
import { usePurchase } from '../context/PurchaseContext'
import { useAuth } from '../context/AuthContext'
import logoImage from '../assets/IMG_1562-Photoroom.png'

function Header({ isScrolled }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false)
  const location = useLocation()
  const { openPurchaseModal } = usePurchase()
  const { isAuthenticated } = useAuth()

  const navItems = [
    { path: '/', label: 'בית' },
    { path: '/about', label: 'אודות' },
    { path: '/treatments', label: 'סוגי טיפולים' },
    { path: '/courses', label: 'מסלולים' },
    { path: '/contact', label: 'צור קשר' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <nav className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-reverse space-x-3">
            <img 
              src={logoImage} 
              alt="יניב תנעמי" 
              className="h-12 md:h-14 w-auto object-contain"
            />
            <div className="text-xl md:text-2xl font-serif font-bold text-primary-600">
              יניב תנעמי
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-reverse space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3 py-2 font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-primary-600'
                    : 'text-neutral-700 hover:text-primary-600'
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-500 rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            
            {/* Categories Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                className={`relative px-3 py-2 font-medium transition-colors duration-200 flex items-center gap-1 ${
                  isCategoriesDropdownOpen
                    ? 'text-primary-600'
                    : 'text-neutral-700 hover:text-primary-600'
                }`}
              >
                טיפולים ומסלולים
                <span className="text-xs">{isCategoriesDropdownOpen ? '▲' : '▼'}</span>
              </button>
              <CategoriesDropdown
                isOpen={isCategoriesDropdownOpen}
                onClose={() => setIsCategoriesDropdownOpen(false)}
              />
            </div>

            <button
              onClick={() => openPurchaseModal()}
              className="btn-secondary text-sm px-5 py-2.5"
            >
              רכוש מסלול
            </button>
            <Link
              to="/booking"
              className="btn-primary text-sm px-5 py-2.5"
            >
              קבע פגישה
            </Link>
            {isAuthenticated ? (
              <Link
                to="/customer/profile"
                className="btn-soft text-sm px-5 py-2.5"
              >
                תיק שלי
              </Link>
            ) : (
              <Link
                to="/customer/login"
                className="btn-soft text-sm px-5 py-2.5"
              >
                התחבר
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="תפריט"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2 border-t border-neutral-200 mt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                
                {/* Mobile Categories Button */}
                <button
                  onClick={() => {
                    setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)
                  }}
                  className="block w-full text-right px-4 py-3 rounded-lg font-medium transition-colors text-neutral-700 hover:bg-neutral-100 flex justify-between items-center"
                >
                  <span>קטגוריות ומסלולים</span>
                  <span>{isCategoriesDropdownOpen ? '▲' : '▼'}</span>
                </button>
                
                {isCategoriesDropdownOpen && (
                  <div className="mx-4 mt-2 mb-4">
                    <CategoriesDropdown
                      isOpen={isCategoriesDropdownOpen}
                      onClose={() => {
                        setIsCategoriesDropdownOpen(false)
                      }}
                    />
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    openPurchaseModal()
                  }}
                  className="block btn-secondary text-center mx-4 mt-4 w-auto"
                >
                  רכוש מסלול
                </button>
                <Link
                  to="/booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block btn-primary text-center mx-4 mt-4"
                >
                  קבע פגישה
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/customer/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block btn-soft text-center mx-4 mt-4"
                  >
                    תיק שלי
                  </Link>
                ) : (
                  <Link
                    to="/customer/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block btn-soft text-center mx-4 mt-4"
                  >
                    התחבר
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}

export default Header

