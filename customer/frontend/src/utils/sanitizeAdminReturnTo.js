const MAX_RETURN_TO_LEN = 4000

/**
 * מונע שימוש ב־returnTo מקונן או שבור אחרי התחברות מנהל (redirect חזרה לאדמין).
 */
export function sanitizeAdminLoginReturnTo(raw) {
  if (raw == null || typeof raw !== 'string') return null
  if (raw.length > MAX_RETURN_TO_LEN) return null
  let s = raw.trim()
  for (let i = 0; i < 16; i++) {
    try {
      const next = decodeURIComponent(s)
      if (next === s) break
      if (next.length > MAX_RETURN_TO_LEN) return null
      s = next
    } catch {
      return null
    }
  }
  try {
    const u = new URL(s, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    const path = u.pathname
    if (path === '/customer/login' || path.startsWith('/customer/login/')) return null
    return s
  } catch {
    return null
  }
}
