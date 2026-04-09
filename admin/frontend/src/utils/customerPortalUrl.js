/**
 * כתובת דף התחברות הלקוח (אתר ציבורי).
 *
 * בפרודקשן ב-Vercel: חובה להגדיר אחד מהבאים בהגדרות ה-build של ה־Admin:
 * - VITE_CUSTOMER_LOGIN_URL — כתובת מלאה, למשל https://your-app.vercel.app/customer/login
 * - VITE_CUSTOMER_SITE_URL — בסיס האתר בלי סלאש, למשל https://your-app.vercel.app
 *
 * בלי זה, בגרסה ישנה ברירת המחדל הייתה localhost — ולכן בפאנל מקוון נפתח דף התחברות מקומי.
 */
export function getCustomerLoginUrl() {
  const full = import.meta.env.VITE_CUSTOMER_LOGIN_URL
  if (full && String(full).trim()) return String(full).trim()

  const site = import.meta.env.VITE_CUSTOMER_SITE_URL
  if (site && String(site).trim()) {
    return `${String(site).replace(/\/$/, '')}/customer/login`
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000/customer/login'
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    console.warn(
      '[Admin] הגדר ב-Vercel את VITE_CUSTOMER_LOGIN_URL (או VITE_CUSTOMER_SITE_URL) כדי להפנות לאתר הלקוחות הנכון. כרגע משתמשים באותו מקור כמו הפאנל.'
    )
    return `${window.location.origin}/customer/login`
  }

  return '/customer/login'
}

/**
 * דף הבית הציבורי של אתר הלקוחות (אחרי התנתקות מהאדמין).
 * בפרודקשן: הגדר VITE_CUSTOMER_SITE_URL (למשל https://healing-fulfillment.vercel.app).
 */
export function getCustomerPublicHomeUrl() {
  const site = import.meta.env.VITE_CUSTOMER_SITE_URL
  if (site && String(site).trim()) {
    return `${String(site).replace(/\/$/, '')}/`
  }

  const full = import.meta.env.VITE_CUSTOMER_LOGIN_URL
  if (full && String(full).trim()) {
    try {
      let s = String(full).trim()
      if (!/^[a-z][a-z0-9+.-]*:/i.test(s) && s.startsWith('//')) s = `https:${s}`
      if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s.replace(/^\/*/, '')}`
      const u = new URL(s)
      return `${u.origin}/`
    } catch {
      /* fall through */
    }
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000/'
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`
  }

  return '/'
}
