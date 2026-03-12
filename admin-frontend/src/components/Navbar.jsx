import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function Navbar({ activeTab, onTabChange, purchasesCount, bookingsCount, customersCount = 0, contactsCount = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'לוח בקרה', icon: '📊', route: '/dashboard' },
    { id: 'categories', label: 'טיפולים', icon: '💆' },
    { id: 'courses', label: 'מסלולים', icon: '📚' },
    { id: 'purchase', label: 'רכישה ידנית', icon: '💰' },
    { id: 'new-booking', label: 'צור פגישה', icon: '➕' },
    { id: 'customers', label: `לקוחות (${customersCount || 0})`, icon: '👥', route: '/customers' },
    { id: 'bookings', label: `פגישות (${bookingsCount || 0})`, icon: '📅', route: '/bookings' },
    { id: 'contacts', label: `פניות (${contactsCount || 0})`, icon: '📧', route: '/contacts' },
    { id: 'messages', label: 'הודעות', icon: '💬', route: '/messages' },
    { id: 'reviews', label: 'ביקורות', icon: '⭐', route: '/reviews' },
  ]

  // קבע את הטאב הפעיל לפי ה-location
  useEffect(() => {
    if (location.pathname === '/customers') {
      // הטאב customers פעיל, אבל זה בדף נפרד אז לא צריך לעדכן את activeTab
    } else if (location.pathname === '/bookings') {
      // הטאב bookings פעיל, אבל זה בדף נפרד אז לא צריך לעדכן את activeTab
    } else if (location.pathname === '/') {
      // אם אנחנו בדף הראשי, השאר את activeTab כמו שהוא
    }
  }, [location.pathname])

  const handleTabClick = (tab) => {
    setIsMobileMenuOpen(false)
    
    if (tab.route) {
      // אם יש route, נווט לדף הנפרד
      navigate(tab.route)
    } else {
      // אם אין route, זה טאב ב-AdminPage
      // אם אנחנו לא בדף הראשי, נווט אליו עם הטאב החדש
      if (location.pathname !== '/') {
        navigate('/')
        // המתן קצת לפני שינוי הטאב כדי שהדף יטען
        setTimeout(() => {
          if (onTabChange) {
            onTabChange(tab.id)
          }
        }, 50)
      } else {
        // אם כבר בדף הראשי, פשוט שנה טאב
        if (onTabChange) {
          onTabChange(tab.id)
        }
      }
    }
  }

  // קבע את הטאב הפעיל לפי ה-location או activeTab
  const getActiveTab = () => {
    if (location.pathname === '/dashboard') {
      return 'dashboard'
    }
    if (location.pathname === '/customers' || location.pathname.startsWith('/customer/')) {
      return 'customers'
    }
    if (location.pathname === '/bookings') {
      return 'bookings'
    }
    if (location.pathname === '/contacts') {
      return 'contacts'
    }
    if (location.pathname === '/messages') {
      return 'messages'
    }
    if (location.pathname === '/reviews') {
      return 'reviews'
    }
    // בדוק אם יש query parameter של tab
    const urlParams = new URLSearchParams(location.search)
    const tabFromUrl = urlParams.get('tab')
    if (tabFromUrl) {
      return tabFromUrl
    }
    return activeTab || 'categories'
  }

  const currentActiveTab = getActiveTab()

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-serif font-bold text-primary-600">
              לוח בקרה
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-reverse space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  currentActiveTab === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-700 hover:text-primary-600"
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
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    currentActiveTab === tab.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

