/** תואם לפרמטר שמוסיפים בהתנתקות מפאנל המנהל (דומיין אחר ב-dev). */
export const ADMIN_LOGOUT_QUERY_KEY = 'hf_customer_logout'
export const ADMIN_LOGOUT_QUERY_VALUE = '1'

/**
 * אם בכתובת יש סימון התנתקות מהאדמין — מנקה את הפרמטר מה-URL ומחזיר true
 * (הקרואה אמורה למחוק גם authToken מ-localStorage ולעדכן AuthContext).
 */
export function takeAdminLogoutRedirectFlag() {
  if (typeof window === 'undefined') return false
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.get(ADMIN_LOGOUT_QUERY_KEY) !== ADMIN_LOGOUT_QUERY_VALUE) {
      return false
    }
    url.searchParams.delete(ADMIN_LOGOUT_QUERY_KEY)
    const qs = url.searchParams.toString()
    const next = `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`
    window.history.replaceState({}, '', next)
    return true
  } catch {
    return false
  }
}
