/**
 * כתובת בסיס של פאנל המנהל (עם נתיב, לרוב .../dashboard).
 *
 * ב־Vercel (אתר לקוחות): הגדר VITE_ADMIN_PANEL_URL ל־URL המלא של הפאנל בפרודקשן,
 * למשל https://your-admin.vercel.app/dashboard
 *
 * בלי זה ב־production ה-build ממשיך להשתמש בברירת מחדל ישנה של localhost בקוד — ולכן נחיתה שגויה.
 */
export function getAdminPanelBaseUrl() {
  const explicit = import.meta.env.VITE_ADMIN_PANEL_URL
  if (explicit && String(explicit).trim()) return String(explicit).trim()

  if (import.meta.env.DEV) {
    return 'http://localhost:3001/dashboard'
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    console.warn(
      '[Customer] הגדר VITE_ADMIN_PANEL_URL ב־Vercel (אתר הלקוחות) לכתובת פאנל המנהל. כרגע משתמשים ב־/dashboard על אותו דומיין.'
    )
    return `${window.location.origin}/dashboard`
  }

  return '/dashboard'
}

/**
 * לאחר התחברות מנהל: איזו כתובת להשתמש כשיש returnTo בקישור.
 * אם הוגדר VITE_ADMIN_PANEL_URL — תמיד הוא (גם מ־localhost).
 * אחרת, ב־DEV על localhost בלבד: אם returnTo מצביע על דומיין חיצוני, חוזרים למנהל מקומי (מניעת קישור "דביק" מפרודקשן).
 */
export function resolveAdminRedirectUrl(returnToFromQuery) {
  const envUrl = import.meta.env.VITE_ADMIN_PANEL_URL?.trim()
  if (envUrl) return envUrl

  const devLocal = 'http://localhost:3001/dashboard'
  const raw = (returnToFromQuery || devLocal).trim()

  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    try {
      const u = new URL(raw, window.location.origin)
      const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      if (!isLocal) return devLocal
    } catch {
      return devLocal
    }
  }

  if (!import.meta.env.DEV) {
    return getAdminPanelBaseUrl()
  }

  return raw
}
