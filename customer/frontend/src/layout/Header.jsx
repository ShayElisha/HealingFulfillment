import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import logoImage from '../assets/IMG_1562-Photoroom.png'

function Header({ isScrolled }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  const navItems = [
    { path: '/', label: 'בית' },
    { path: '/about', label: 'אודות' },
    { path: '/treatments', label: 'תהליכי ליווי' },
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
        <div className="flex items-center justify-between gap-2 py-2 md:h-20 md:py-0">
          {/* Logo */}
          <Link
            to="/"
            className="flex max-w-[min(100%,14rem)] items-center space-x-reverse space-x-2 sm:max-w-none sm:space-x-3"
          >
            <img
              src={logoImage}
              alt="יניב תנעמי"
              className="h-12 w-auto shrink-0 object-contain sm:h-14 md:h-16"
            />
            <div className="min-w-0 text-right">
              <div
                className={`bg-clip-text font-serif text-base font-bold leading-tight text-transparent sm:text-lg md:text-xl ${
                  isScrolled
                    ? 'bg-gradient-to-bl from-neutral-400 via-neutral-600 to-neutral-900'
                    : 'bg-gradient-to-bl from-white via-neutral-200 to-neutral-500 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
                }`}
              >
                להתעורר אל עצמי
              </div>
              <div className="mt-0.5 text-[11px] font-medium leading-snug text-neutral-600 sm:text-xs md:text-sm">
                בחירות טובות לחיים טובים
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-reverse space-x-8">
            {navItems.map((item) => (
              item.path === '/courses' ? (
                <span
                  key={item.path}
                  aria-disabled="true"
                  className="relative px-3 py-2 font-medium text-neutral-400 cursor-not-allowed"
                >
                  {item.label}
                </span>
              ) : (
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
              )
            ))}
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="btn-secondary text-sm px-5 py-2.5 opacity-50 cursor-not-allowed hover:translate-y-0 active:scale-100"
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
              <div className="py-4 space-y-2 border-t border-neutral-200 mt-4 bg-white/98 backdrop-blur-md rounded-b-xl shadow-lg">
                {navItems.map((item) => (
                  item.path === '/courses' ? (
                    <span
                      key={item.path}
                      aria-disabled="true"
                      className="block px-4 py-3 rounded-lg font-medium text-neutral-400 cursor-not-allowed"
                    >
                      {item.label}
                    </span>
                  ) : (
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
                  )
                ))}
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="block btn-secondary text-center mx-4 mt-4 w-auto opacity-50 cursor-not-allowed hover:translate-y-0 active:scale-100"
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

