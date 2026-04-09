import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

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

function ChangePasswordPage() {
  const navigate = useNavigate()
  const { changePassword, isAuthenticated, user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    // אם לא מחובר, הפנה לדף התחברות
    if (!isAuthenticated) {
      navigate('/customer/login')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // בדיקות תקינות
    if (newPassword.length < 6) {
      setError('סיסמה חדשה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('סיסמה חדשה ואימות סיסמה אינם תואמים')
      return
    }

    if (oldPassword === newPassword) {
      setError('סיסמה חדשה חייבת להיות שונה מהסיסמה הישנה')
      return
    }

    setLoading(true)

    try {
      await changePassword(oldPassword, newPassword)
      // אחרי שינוי מוצלח, הפנה לתיק הלקוח
      navigate('/customer/profile')
    } catch (err) {
      setError(err.message || 'שגיאה בשינוי סיסמה. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>שינוי סיסמה | תיק לקוח</title>
        <meta
          name="description"
          content="שנה את הסיסמה שלך"
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                שינוי סיסמה
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                אנא שנה את הסיסמה הראשונית שלך לסיסמה חדשה
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Change Password Form */}
      <Section variant="white">
        <div className="max-w-md mx-auto">
          <AnimatedSection>
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    סיסמה נוכחית
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      id="oldPassword"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-20"
                      placeholder="הכנס את הסיסמה הנוכחית"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
                      aria-label={showOldPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      <EyeIcon closed={showOldPassword} />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    סיסמה חדשה
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-20"
                      placeholder="הכנס סיסמה חדשה (מינימום 6 תווים)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
                      aria-label={showNewPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      <EyeIcon closed={showNewPassword} />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    סיסמה חייבת להכיל לפחות 6 תווים
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    אימות סיסמה חדשה
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-20"
                      placeholder="הכנס שוב את הסיסמה החדשה"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
                      aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      <EyeIcon closed={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-lg py-3"
                  disabled={loading}
                >
                  {loading ? 'מעדכן...' : 'שנה סיסמה'}
                </Button>
              </form>
            </Card>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default ChangePasswordPage

