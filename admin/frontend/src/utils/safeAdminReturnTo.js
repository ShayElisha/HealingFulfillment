/**
 * כתובת חזרה לאחר התחברות מנהל בדף הלקוחות.
 * כשאדמין והלוגין מוגשים מאותו origin (למשל שני אפליקציות על *.vercel.app),
 * pathname /customer/login עדיין עובר דרך ה-Shell של האדמין → בלי תיקון, returnTo
 * הופך ל־login?returnTo=login?returnTo=… עד אינסוף.
 */
function decodeReturnToChain(param) {
  if (!param || typeof param !== 'string') return ''
  let s = param.trim()
  for (let i = 0; i < 16; i++) {
    try {
      const next = decodeURIComponent(s)
      if (next === s) break
      s = next
    } catch {
      break
    }
  }
  return s
}

export function getSafeAdminReturnToUrl() {
  if (typeof window === 'undefined') return ''
  const u = new URL(window.location.href)
  const isLogin =
    u.pathname === '/customer/login' || u.pathname.startsWith('/customer/login/')

  if (!isLogin) {
    return u.toString()
  }

  const nested = u.searchParams.get('returnTo')
  if (nested) {
    try {
      const decoded = decodeReturnToChain(nested)
      const inner = new URL(decoded, u.origin)
      const innerPath = inner.pathname
      if (
        inner.origin === u.origin &&
        innerPath !== '/customer/login' &&
        !innerPath.startsWith('/customer/login/')
      ) {
        return inner.toString()
      }
    } catch {
      /* fall through */
    }
  }

  return `${u.origin}/dashboard`
}
