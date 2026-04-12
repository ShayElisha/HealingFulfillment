import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { statsService } from '../services/adminApi'

const NavCountsContext = createContext(null)

export function NavCountsProvider({ children }) {
  const location = useLocation()
  const [customersCount, setCustomersCount] = useState(0)
  const [bookingsCount, setBookingsCount] = useState(0)
  const [contactsCount, setContactsCount] = useState(0)

  const refreshNavCounts = useCallback(async () => {
    try {
      const res = await statsService.getNavCounts()
      const d = res?.data
      if (!d) return
      setCustomersCount(d.customersCount ?? 0)
      setBookingsCount(d.bookingsCount ?? 0)
      setContactsCount(d.contactsCount ?? 0)
    } catch (e) {
      console.warn('NavCounts: failed to refresh', e)
    }
  }, [])

  useEffect(() => {
    refreshNavCounts()
    const id = setInterval(refreshNavCounts, 45000)
    const onFocus = () => {
      refreshNavCounts()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [location.pathname, refreshNavCounts])

  const value = useMemo(
    () => ({
      customersCount,
      bookingsCount,
      contactsCount,
      refreshNavCounts
    }),
    [customersCount, bookingsCount, contactsCount, refreshNavCounts]
  )

  return <NavCountsContext.Provider value={value}>{children}</NavCountsContext.Provider>
}

export function useNavCounts() {
  const ctx = useContext(NavCountsContext)
  if (!ctx) {
    return {
      customersCount: 0,
      bookingsCount: 0,
      contactsCount: 0,
      refreshNavCounts: async () => {}
    }
  }
  return ctx
}
