import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { bookingService, contactService } from '../services/adminApi'
import { customerService } from '../services/customerApi'

const NavCountsContext = createContext(null)

function extractDataArray(response) {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (response.data && Array.isArray(response.data)) return response.data
  return []
}

export function NavCountsProvider({ children }) {
  const location = useLocation()
  const [customersCount, setCustomersCount] = useState(0)
  const [bookingsCount, setBookingsCount] = useState(0)
  const [contactsCount, setContactsCount] = useState(0)

  const refreshNavCounts = useCallback(async () => {
    try {
      const [customersRes, bookingsRes, contactsRes] = await Promise.all([
        customerService.getAll({ page: 1, limit: 1 }),
        bookingService.getAll(),
        contactService.getAll()
      ])
      const customers = extractDataArray(customersRes)
      const bookings = extractDataArray(bookingsRes)
      const contacts = extractDataArray(contactsRes)
      setCustomersCount(customersRes?.meta?.total ?? customers.length)
      setBookingsCount(bookings.length)
      setContactsCount(contacts.length)
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
