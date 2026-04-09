import { sanitizeAdminLoginReturnTo } from './sanitizeAdminReturnTo'

const STORAGE_KEY = 'healingFulfillment:customerLoginReturnTo'

/** מסיר את returnTo מסרגל הכתובת ושומר ב-sessionStorage להמשך אחרי התחברות. */
export function stripReturnToQueryFromLoginUrl(search, navigate) {
  const params = new URLSearchParams(search)
  if (!params.has('returnTo')) return
  const raw = params.get('returnTo')
  const clean = sanitizeAdminLoginReturnTo(raw)
  if (clean) {
    try {
      sessionStorage.setItem(STORAGE_KEY, clean)
    } catch {
      /* ignore */
    }
  }
  navigate('/customer/login', { replace: true })
}

/** לשימוש אחרי התחברות / מנהל כבר מחובר: עדיפות ל-query, אחרת session (ומנקה session). */
export function resolveLoginReturnTo(queryString) {
  const params = new URLSearchParams(queryString || '')
  const fromQuery = sanitizeAdminLoginReturnTo(params.get('returnTo'))
  let fromSession
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    fromSession = sanitizeAdminLoginReturnTo(raw) ?? undefined
  } catch {
    fromSession = undefined
  }
  return fromQuery ?? fromSession ?? undefined
}

export function clearStoredLoginReturnTo() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
