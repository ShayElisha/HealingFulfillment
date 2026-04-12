import { useState, useEffect, useLayoutEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'
import { resolveAdminRedirectUrl } from '../utils/adminPanelUrl'
import {
  stripReturnToQueryFromLoginUrl,
  resolveLoginReturnTo,
  clearStoredLoginReturnTo,
  isAdminGateFailedBlocked,
  clearAdminGateFailedSessionFlag,
  setAdminGateFailedSessionFlag,
} from '../utils/loginReturnToSession'

function EyeIcon({ closed = false }) {
  if (closed) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 5.1A10.9 10.9 0 0 1 12 4c5.5 0 9.4 4.6 10 7.8a10.9 10.9 0 0 1-3.5 5.4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.3A11.4 11.4 0 0 0 2 11.8C2.6 15 6.5 19.6 12 19.6c1.6 0 3.1-.4 4.4-1" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.8-8 10-8 10 8 10 8-3.8 8-10 8S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function CustomerLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectAdmin = (returnTo) => {
    const token = localStorage.getItem('authToken')
    if (!token) return false
    const adminBase = resolveAdminRedirectUrl(returnTo)
    try {
      const target = new URL(adminBase, window.location.origin)
      target.searchParams.set('token', token)
      window.location.href = target.toString()
      return true
    } catch {
      window.location.href = `${adminBase}?token=${encodeURIComponent(token)}`
      return true
    }
  }

  useLayoutEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('adminVerifyFailed') === '1') {
      setAdminGateFailedSessionFlag()
      params.delete('adminVerifyFailed')
      const q = params.toString()
      navigate(`/customer/login${q ? `?${q}` : ''}`, { replace: true })
      return
    }
    stripReturnToQueryFromLoginUrl(location.search, navigate)
  }, [location.search, navigate])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!isAuthenticated || !user) return
    if (user.mustChangePassword === true) return
    if (user.isAdmin === true) {
      if (isAdminGateFailedBlocked()) return
      const returnTo = resolveLoginReturnTo(location.search)
      redirectAdmin(returnTo)
      return
    }
    navigate('/customer/profile')
  }, [isAuthenticated, navigate, user, location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      // אם צריך לשנות סיסמה, הפנה לדף שינוי סיסמה
      if (result.mustChangePassword) {
        navigate('/customer/change-password')
      } else if (result.isAdmin) {
        clearAdminGateFailedSessionFlag()
        // הפניה לפאנל רק ב-useEffect — מונע קריאה כפולה ל-resolveLoginReturnTo ומצב מירוץ עם ה-effect
      } else {
        clearStoredLoginReturnTo()
        navigate('/customer/profile')
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>התחברות | תיק לקוח</title>
        <meta
          name="description"
          content="התחבר לתיק הלקוח שלך כדי לצפות בפרטים, רכישות ופגישות"
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                התחברות לתיק לקוח
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                התחבר כדי לצפות בפרטים האישיים שלך, רכישות ופגישות
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Login Form */}
      <Section variant="white">
        <div className="max-w-md mx-auto">
          <AnimatedSection>
            <Card>
              {isAuthenticated && user?.isAdmin === true && isAdminGateFailedBlocked() && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="mb-2 font-medium">לא ניתן להתחבר לפאנל הניהול כרגע</p>
                  <p className="mb-3 text-amber-800/90">
                    ייתכן שהשרת לא זמין או שיש בעיית הרשאות. כדי לא לרענן את הדף בלולאה, ההפניה האוטומטית הושבתה זמנית.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      className="py-2 text-sm"
                      onClick={() => {
                        clearAdminGateFailedSessionFlag()
                        const returnTo = resolveLoginReturnTo(location.search)
                        redirectAdmin(returnTo)
                      }}
                    >
                      נסה שוב לפאנל
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-2 text-sm"
                      onClick={() => {
                        clearAdminGateFailedSessionFlag()
                        navigate('/customer/profile')
                      }}
                    >
                      המשך לתיק לקוח
                    </Button>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="הכנס את האימייל שלך"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    סיסמה
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-20"
                      placeholder="הכנס את הסיסמה שלך"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
                      aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      <EyeIcon closed={showPassword} />
                    </button>
                  </div>
                  <div className="mt-2 text-left">
                    <Link to="/customer/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
                      שכחתי סיסמה
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-lg py-3"
                  disabled={loading}
                >
                  {loading ? 'מתחבר...' : 'התחבר'}
                </Button>

                <p className="text-sm text-center text-neutral-600">
                  אין לך חשבון?{' '}
                  <a href="/contact" className="text-primary-600 hover:text-primary-700 underline">
                    צור קשר עם המנהל
                  </a>
                </p>
              </form>
            </Card>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default CustomerLoginPage

