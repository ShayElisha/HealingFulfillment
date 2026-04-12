import { sanitizeAdminLoginReturnTo } from './sanitizeAdminReturnTo'

const STORAGE_KEY = 'healingFulfillment:customerLoginReturnTo'
const ADMIN_GATE_FAILED_KEY = 'healingFulfillment:adminGateFailedUntil'
const ADMIN_GATE_BLOCK_MS = 5 * 60 * 1000

/** אחרי כישלון אימות בפאנל — מונע לולאת רענון; מסתיים אוטומטית אחרי כמה דקות */
export function setAdminGateFailedSessionFlag() {
  try {
    sessionStorage.setItem(ADMIN_GATE_FAILED_KEY, String(Date.now() + ADMIN_GATE_BLOCK_MS))
  } catch {
    /* ignore */
  }
}

export function clearAdminGateFailedSessionFlag() {
  try {
    sessionStorage.removeItem(ADMIN_GATE_FAILED_KEY)
  } catch {
    /* ignore */
  }
}

export function isAdminGateFailedBlocked() {
  try {
    const v = sessionStorage.getItem(ADMIN_GATE_FAILED_KEY)
    if (!v) return false
    const until = Number(v)
    if (!Number.isFinite(until) || Date.now() > until) {
      sessionStorage.removeItem(ADMIN_GATE_FAILED_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

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
