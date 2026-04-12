/**
 * קישורי `/uploads/...` נשמרים ביחס לשרת המנהל (קבצי תיק לקוח, «למי זה מתאים» וכו').
 * בפיתוח, פרוקסי Vite מפנה `/uploads` לשרת המנהל.
 * בפרודקשן (למשל אתר לקוחות ב-Vercel): הגדר `VITE_ADMIN_ASSET_URL` לכתובת הציבורית
 * של שרת המנהל בלי סלאש סופי (למשל https://api-admin.example.com).
 */
export function resolveAdminAssetUrl(urlPath) {
  if (!urlPath) return ''
  const s = String(urlPath).trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (import.meta.env.DEV) return s
  const adminBase = import.meta.env.VITE_ADMIN_ASSET_URL?.replace(/\/$/, '')
  if (adminBase) return `${adminBase}${s.startsWith('/') ? s : `/${s}`}`
  const apiBase = import.meta.env.VITE_API_URL
  if (apiBase) {
    const origin = apiBase.replace(/\/api\/?$/, '')
    return `${origin}${s.startsWith('/') ? s : `/${s}`}`
  }
  return s
}
