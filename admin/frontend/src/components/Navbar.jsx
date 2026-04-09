import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNavCounts } from '../context/NavCountsContext'
import { getCustomerLoginUrl } from '../utils/customerPortalUrl'

const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { customersCount, bookingsCount, contactsCount } = useNavCounts()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'לוח בקרה', icon: '📊', route: '/dashboard' },
    { id: 'categories', label: 'טיפולים', icon: '💆', route: '/categories' },
    { id: 'for-whom-audience', label: 'למי זה מתאים', icon: '🚪', route: '/for-whom-audience' },
    { id: 'courses', label: 'מסלולים', icon: '📚', route: '/courses' },
    { id: 'purchase', label: 'רכישה ידנית', icon: '💰', route: '/purchase' },
    { id: 'new-booking', label: 'צור פגישה', icon: '➕', route: '/new-booking' },
    { id: 'customers', label: `לקוחות (${customersCount || 0})`, icon: '👥', route: '/customers' },
    { id: 'bookings', label: `פגישות (${bookingsCount || 0})`, icon: '📅', route: '/bookings' },
    { id: 'contacts', label: `פניות (${contactsCount || 0})`, icon: '📧', route: '/contacts' },
    { id: 'leads', label: 'לידים', icon: '📋', route: '/leads' },
    { id: 'transactions', label: 'הכנסות והוצאות', icon: '💵', route: '/transactions' },
    { id: 'messages', label: 'הודעות', icon: '💬', route: '/messages' },
    { id: 'reviews', label: 'ביקורות', icon: '⭐', route: '/reviews' }
  ]

  const handleNavClick = (route) => {
    setIsMobileMenuOpen(false)
    navigate(route)
  }

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    } catch {}
    const loginUrl = getCustomerLoginUrl()
    window.location.replace(loginUrl)
  }

  const getActiveTabId = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'dashboard'
    if (path === '/categories') return 'categories'
    if (path === '/for-whom-audience') return 'for-whom-audience'
    if (path === '/courses') return 'courses'
    if (path === '/purchase') return 'purchase'
    if (path === '/new-booking') return 'new-booking'
    if (path === '/customers' || path.startsWith('/customer/')) return 'customers'
    if (path === '/bookings') return 'bookings'
    if (path === '/contacts') return 'contacts'
    if (path === '/leads') return 'leads'
    if (path === '/transactions') return 'transactions'
    if (path === '/messages') return 'messages'
    if (path === '/reviews') return 'reviews'
    return null
  }

  const currentActiveId = getActiveTabId()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-white/80 shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="w-full px-2 sm:px-4 md:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-sky-700 text-white shadow-soft-md ring-1 ring-white/20">
              <span className="text-sm md:text-base" aria-hidden>
                📊
              </span>
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary-600/90 md:text-xs">
                Healing Fulfillment
              </p>
              <h1 className="font-serif text-base font-semibold text-neutral-900 md:text-lg lg:text-xl">
                פאנל ניהול
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-reverse space-x-0.5 lg:space-x-1 flex-wrap justify-end gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavClick(tab.route)}
                className={`px-2 py-2 md:px-3 md:py-2 lg:px-4 lg:py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1 md:gap-1.5 lg:gap-2 text-xs md:text-xs lg:text-sm ${
                  currentActiveId === tab.id
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-soft border border-primary-200/50'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-600'
                }`}
              >
                <span className="hidden navwide:inline text-sm md:text-base lg:text-base">
                  {tab.icon}
                </span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="px-2 py-2 md:px-3 md:py-2 lg:px-4 lg:py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1 md:gap-1.5 lg:gap-2 text-xs md:text-xs lg:text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <span className="hidden navwide:inline text-sm md:text-base lg:text-base">↩️</span>
              <span className="whitespace-nowrap">התנתקות</span>
            </button>
          </div>

          <button
            className="md:hidden p-2 text-neutral-700 hover:text-primary-600"
            type="button"
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

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200/60 bg-neutral-50/50">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleNavClick(tab.route)}
                  className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                    currentActiveId === tab.id
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-soft border border-primary-200/50'
                      : 'text-neutral-700 hover:bg-white hover:text-primary-600'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-right px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <span className="text-lg">↩️</span>
                <span>התנתקות</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
