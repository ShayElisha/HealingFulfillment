import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNavCounts } from '../context/NavCountsContext'
import { getCustomerPublicHomeUrl } from '../utils/customerPortalUrl'
import toast from 'react-hot-toast'
import { statsService } from '../services/adminApi'
import AdminNotificationsPanel from './AdminNotificationsPanel'

const ADMIN_TOKEN_STORAGE_KEY = 'adminAuthToken'
/** תואם ל־customer/frontend/src/utils/adminLogoutSync.js — התנתקות גם כשהאדמין והלקוח בדומיינים שונים */
const CUSTOMER_LOGOUT_QUERY_KEY = 'hf_customer_logout'
const CUSTOMER_LOGOUT_QUERY_VALUE = '1'

function buildCustomerHomeWithSessionClear() {
  const base = getCustomerPublicHomeUrl()
  try {
    const u = /^[a-z][a-z0-9+.-]*:/i.test(base)
      ? new URL(base)
      : new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    u.searchParams.set(CUSTOMER_LOGOUT_QUERY_KEY, CUSTOMER_LOGOUT_QUERY_VALUE)
    return u.toString()
  } catch {
    const sep = base.includes('?') ? '&' : '?'
    return `${String(base).replace(/\/?$/, '')}${sep}${CUSTOMER_LOGOUT_QUERY_KEY}=${CUSTOMER_LOGOUT_QUERY_VALUE}`
  }
}

function getActiveLeafId(pathname) {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname === '/categories') return 'categories'
  if (pathname === '/for-whom-audience') return 'for-whom-audience'
  if (pathname === '/courses') return 'courses'
  if (pathname === '/purchase') return 'purchase'
  if (pathname === '/new-booking') return 'new-booking'
  if (pathname === '/customers' || pathname.startsWith('/customer/')) return 'customers'
  if (pathname === '/bookings') return 'bookings'
  if (pathname === '/availability') return 'availability'
  if (pathname === '/contacts') return 'contacts'
  if (pathname === '/leads') return 'leads'
  if (pathname === '/transactions') return 'transactions'
  if (pathname === '/messages') return 'messages'
  if (pathname === '/reviews') return 'reviews'
  return null
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { customersCount, bookingsCount, contactsCount, refreshNavCounts } = useNavCounts()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifAnchorEl, setNotifAnchorEl] = useState(null)
  const [activityItems, setActivityItems] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [openDesktopGroup, setOpenDesktopGroup] = useState(null)
  const [mobileGroupOpen, setMobileGroupOpen] = useState(null)
  const desktopNavRef = useRef(null)

  const navItems = useMemo(
    () => [
      { type: 'link', id: 'dashboard', label: 'לוח בקרה', icon: '📊', route: '/dashboard' },
      { type: 'link', id: 'for-whom-audience', label: 'למי זה מתאים', icon: '🚪', route: '/for-whom-audience' },
      { type: 'link', id: 'availability', label: 'זמינות', icon: '🕐', route: '/availability' },
      {
        type: 'group',
        id: 'purchases',
        label: 'רכישות',
        icon: '🛒',
        items: [
          { id: 'courses', label: 'מסלולים', icon: '📚', route: '/courses' },
          { id: 'purchase', label: 'רכישה ידנית', icon: '💰', route: '/purchase' },
        ],
      },
      {
        type: 'group',
        id: 'meetings',
        label: 'פגישות',
        icon: '📅',
        items: [
          { id: 'categories', label: 'טיפולים', icon: '💆', route: '/categories' },
          { id: 'new-booking', label: 'צור פגישה', icon: '➕', route: '/new-booking' },
          {
            id: 'bookings',
            label: `רשימת פגישות (${bookingsCount || 0})`,
            icon: '📋',
            route: '/bookings',
          },
        ],
      },
      {
        type: 'group',
        id: 'crm',
        label: 'שיווק ולקוחות',
        icon: '🎯',
        items: [
          { id: 'customers', label: `לקוחות (${customersCount || 0})`, icon: '👥', route: '/customers' },
          { id: 'leads', label: 'לידים', icon: '📋', route: '/leads' },
          { id: 'contacts', label: `פניות (${contactsCount || 0})`, icon: '📧', route: '/contacts' },
        ],
      },
      {
        type: 'group',
        id: 'comms',
        label: 'תקשורת וביקורות',
        icon: '💬',
        items: [
          { id: 'messages', label: 'הודעות', icon: '💬', route: '/messages' },
          { id: 'reviews', label: 'ביקורות', icon: '⭐', route: '/reviews' },
        ],
      },
      { type: 'link', id: 'transactions', label: 'הכנסות והוצאות', icon: '💵', route: '/transactions' },
    ],
    [bookingsCount, customersCount, contactsCount]
  )

  const currentActiveId = getActiveLeafId(location.pathname)

  const loadActivityFeed = useCallback(async () => {
    try {
      setActivityLoading(true)
      const res = await statsService.getActivityFeed({ limit: 120 })
      setActivityItems(Array.isArray(res?.data?.items) ? res.data.items : [])
    } catch (e) {
      console.warn('Activity feed:', e)
      setActivityItems([])
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    loadActivityFeed()
    const id = setInterval(loadActivityFeed, 60_000)
    return () => clearInterval(id)
  }, [loadActivityFeed, location.pathname])

  const unreadActivityCount = useMemo(
    () => activityItems.filter((i) => !i.isRead).length,
    [activityItems]
  )

  const handleMarkActivityRead = useCallback(async (kind, activityId) => {
    try {
      await statsService.markNotificationRead({ kind, activityId })
      setActivityItems((prev) =>
        prev.map((it) =>
          it.id === activityId && it.kind === kind ? { ...it, isRead: true } : it
        )
      )
    } catch (e) {
      console.warn(e)
      toast.error(e.response?.data?.message || 'לא ניתן לשמור את הסימון')
    }
  }, [])

  const handleMarkAllActivityRead = useCallback(async () => {
    const unread = activityItems.filter((i) => !i.isRead)
    if (!unread.length) return
    try {
      await statsService.markAllNotificationsRead({
        items: unread.map((i) => ({ kind: i.kind, activityId: i.id })),
      })
      setActivityItems((prev) => prev.map((it) => (it.isRead ? it : { ...it, isRead: true })))
    } catch (e) {
      console.warn(e)
      toast.error(e.response?.data?.message || 'לא ניתן לסמן הכל כנקרא')
    }
  }, [activityItems])

  const closeNotificationsPanel = useCallback(() => {
    setNotifOpen(false)
    setNotifAnchorEl(null)
    refreshNavCounts()
  }, [refreshNavCounts])

  const openNotificationsPanel = useCallback(
    (e) => {
      const el = e?.currentTarget
      if (el) setNotifAnchorEl(el)
      setNotifOpen(true)
      loadActivityFeed()
    },
    [loadActivityFeed]
  )

  const isGroupActive = (group) =>
    group.items.some((item) => item.id === currentActiveId)

  useEffect(() => {
    if (!openDesktopGroup) return
    const onPointerDown = (e) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target)) {
        setOpenDesktopGroup(null)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [openDesktopGroup])

  useEffect(() => {
    if (!isMobileMenuOpen) return
    if (!currentActiveId) {
      setMobileGroupOpen(null)
      return
    }
    const parent = navItems.find(
      (e) => e.type === 'group' && e.items.some((i) => i.id === currentActiveId)
    )
    setMobileGroupOpen(parent ? parent.id : null)
  }, [isMobileMenuOpen, currentActiveId, navItems])

  const handleNavClick = (route) => {
    setIsMobileMenuOpen(false)
    setOpenDesktopGroup(null)
    setMobileGroupOpen(null)
    navigate(route)
  }

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
      window.localStorage.removeItem('authToken')
    } catch {}
    window.location.replace(buildCustomerHomeWithSessionClear())
  }

  const linkButtonClass = (active) =>
    `shrink-0 px-2 py-2 md:px-3 md:py-2 lg:px-4 lg:py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1 md:gap-1.5 lg:gap-2 text-xs md:text-xs lg:text-sm ${
      active
        ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-soft border border-primary-200/50'
        : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary-600'
    }`

  const logoutButtonClass =
    'px-2 py-2 md:px-3 md:py-2 lg:px-4 lg:py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-1 md:gap-1.5 lg:gap-2 text-xs md:text-xs lg:text-sm text-red-600 hover:bg-red-50 hover:text-red-700 shrink-0'

  const desktopNavInner = (
    <>
      {navItems.map((entry) => {
              if (entry.type === 'link') {
                const active = currentActiveId === entry.id
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleNavClick(entry.route)}
                    className={linkButtonClass(active)}
                  >
                    <span className="hidden navwide:inline text-sm md:text-base lg:text-base">{entry.icon}</span>
                    <span className="whitespace-nowrap">{entry.label}</span>
                  </button>
                )
              }

              const group = entry
              const open = openDesktopGroup === group.id
              const groupHasActiveChild = isGroupActive(group)

              return (
                <div key={group.id} className="relative shrink-0">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="menu"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDesktopGroup(open ? null : group.id)
                    }}
                    className={linkButtonClass(groupHasActiveChild || open)}
                  >
                    <span className="hidden navwide:inline text-sm md:text-base lg:text-base">{group.icon}</span>
                    <span className="whitespace-nowrap">{group.label}</span>
                    <span className="text-[10px] opacity-70 mr-0.5" aria-hidden>
                      {open ? '▴' : '▾'}
                    </span>
                  </button>
                  {open && (
                    <div
                      role="menu"
                      className="absolute top-full right-0 z-[100] mt-1 min-w-[12rem] rounded-xl border border-neutral-200/80 bg-white py-1 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.items.map((item) => {
                        const itemActive = currentActiveId === item.id
                        return (
                          <button
                            key={item.id}
                            role="menuitem"
                            type="button"
                            onClick={() => handleNavClick(item.route)}
                            className={`w-full text-right px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-primary-50/80 ${
                              itemActive ? 'bg-primary-50 text-primary-800 font-medium' : 'text-neutral-700'
                            }`}
                          >
                            <span aria-hidden>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
    </>
  )

  return (
    <>
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200/70 bg-white/80 shadow-soft backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="w-full px-2 sm:px-4 md:px-4 lg:px-6 xl:px-8">
        {/* מובייל: התנתקות + פעמון שמאל, מיתוג במרכז, תפריט ימין */}
        <div className="flex md:hidden items-center justify-between gap-2 h-14">
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={handleLogout} className={logoutButtonClass} aria-label="התנתקות">
              <span className="text-base" aria-hidden>
                ↩️
              </span>
              <span className="whitespace-nowrap">התנתקות</span>
            </button>
            <button
              type="button"
              onClick={(e) => openNotificationsPanel(e)}
              className="relative shrink-0 rounded-xl border border-neutral-200/90 bg-white p-2 text-lg shadow-sm transition hover:bg-neutral-50"
              aria-label="התראות"
            >
              <span aria-hidden>🔔</span>
              {unreadActivityCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadActivityCount > 99 ? '99+' : unreadActivityCount}
                </span>
              ) : null}
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-sky-700 text-white shadow-soft-md ring-1 ring-white/20">
              <span className="text-sm" aria-hidden>
                📊
              </span>
            </div>
            <div className="leading-tight min-w-0 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary-600/90 truncate">
                Healing Fulfillment
              </p>
              <h1 className="font-serif text-sm font-semibold text-neutral-900 truncate">פאנל ניהול</h1>
            </div>
          </div>
          <button
            className="shrink-0 p-2 text-neutral-700 hover:text-primary-600"
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

        {/* דסקטופ: התנתקות + פעמון בפינה השמאלית, קישורים במרכז, מיתוג בימין */}
        <div className="relative hidden md:flex h-16 items-center">
          <div className="absolute left-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1">
            <button
              type="button"
              onClick={handleLogout}
              className={logoutButtonClass}
              aria-label="התנתקות"
            >
              <span className="hidden navwide:inline text-sm md:text-base lg:text-base">↩️</span>
              <span className="whitespace-nowrap">התנתקות</span>
            </button>
            <button
              type="button"
              onClick={(e) => openNotificationsPanel(e)}
              className="relative shrink-0 rounded-xl border border-neutral-200/90 bg-white p-2 text-lg shadow-sm transition hover:bg-neutral-50 md:px-3"
              aria-label="התראות"
            >
              <span aria-hidden>🔔</span>
              {unreadActivityCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadActivityCount > 99 ? '99+' : unreadActivityCount}
                </span>
              ) : null}
            </button>
          </div>
          <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 md:gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-sky-700 text-white shadow-soft-md ring-1 ring-white/20">
              <span className="text-base" aria-hidden>
                📊
              </span>
            </div>
            <div className="leading-tight text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-600/90">
                Healing Fulfillment
              </p>
              <h1 className="font-serif text-lg font-semibold text-neutral-900 lg:text-xl">פאנל ניהול</h1>
            </div>
          </div>
          {/* בלי overflow-y-hidden / overflow על הציר האנכי — אחרת נחתכים תפריטי המשנה (absolute מתחת לכפתור) */}
          <div className="flex min-h-[3.5rem] w-full min-w-0 items-center justify-center px-40 md:px-48 lg:px-52 xl:px-60 2xl:px-64">
            <div
              ref={desktopNavRef}
              className="mx-auto flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-0.5 py-1"
            >
              {desktopNavInner}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200/60 bg-neutral-50/50">
            <div className="space-y-1">
              {navItems.map((entry) => {
                if (entry.type === 'link') {
                  const active = currentActiveId === entry.id
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleNavClick(entry.route)}
                      className={`w-full text-right px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                        active
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-soft border border-primary-200/50'
                          : 'text-neutral-700 hover:bg-white hover:text-primary-600'
                      }`}
                    >
                      <span className="text-lg">{entry.icon}</span>
                      <span>{entry.label}</span>
                    </button>
                  )
                }

                const group = entry
                const expanded = mobileGroupOpen === group.id
                const groupActive = isGroupActive(group)

                return (
                  <div key={group.id} className="rounded-xl border border-neutral-200/60 overflow-hidden bg-white/60">
                    <button
                      type="button"
                      onClick={() => setMobileGroupOpen(expanded ? null : group.id)}
                      className={`w-full text-right px-4 py-3 font-medium flex items-center justify-between gap-2 ${
                        groupActive ? 'text-primary-700 bg-primary-50/40' : 'text-neutral-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">{group.icon}</span>
                        <span>{group.label}</span>
                      </span>
                      <span className="text-neutral-400 text-sm">{expanded ? '▴' : '▾'}</span>
                    </button>
                    {expanded && (
                      <div className="border-t border-neutral-100 bg-neutral-50/80 py-1">
                        {group.items.map((item) => {
                          const itemActive = currentActiveId === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNavClick(item.route)}
                              className={`w-full text-right px-6 py-2.5 text-sm flex items-center gap-2 ${
                                itemActive
                                  ? 'text-primary-800 font-medium bg-primary-50/60'
                                  : 'text-neutral-600 hover:bg-white'
                              }`}
                            >
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
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
    <AdminNotificationsPanel
      open={notifOpen}
      anchorEl={notifAnchorEl}
      onClose={closeNotificationsPanel}
      onMarkRead={handleMarkActivityRead}
      onMarkAllRead={handleMarkAllActivityRead}
      items={activityItems}
      loading={activityLoading && activityItems.length === 0}
    />
    </>
  )
}

export default Navbar
