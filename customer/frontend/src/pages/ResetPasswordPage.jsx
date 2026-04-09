import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { authService } from '../services/authApi'
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

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('קישור איפוס לא תקין')
      return
    }
    if (newPassword.length < 6) {
      setError('סיסמה חדשה חייבת להכיל לפחות 6 תווים')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('אימות הסיסמה אינו תואם')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, newPassword)
      setDone(true)
      setTimeout(() => navigate('/customer/login'), 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'לא ניתן לאפס סיסמה כרגע')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>איפוס סיסמה | תיק לקוח</title>
      </Helmet>
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">איפוס סיסמה</h1>
              <p className="text-xl text-neutral-600 leading-relaxed">הגדרת סיסמה חדשה לחשבון שלך</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Section variant="white">
        <div className="max-w-md mx-auto">
          <AnimatedSection>
            <Card>
              {done ? (
                <div className="space-y-4 text-center">
                  <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                    הסיסמה עודכנה בהצלחה. מעביר להתחברות...
                  </p>
                  <Link to="/customer/login" className="text-primary-600 hover:underline">
                    מעבר להתחברות
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                      סיסמה חדשה
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-20"
                        placeholder="לפחות 6 תווים"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
                        aria-label={showNew ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      >
                        <EyeIcon closed={showNew} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                      אימות סיסמה
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-20"
                        placeholder="הכנס שוב את הסיסמה"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-900"
                        aria-label={showConfirm ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      >
                        <EyeIcon closed={showConfirm} />
                      </button>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" className="w-full text-lg py-3" disabled={loading}>
                    {loading ? 'מעדכן...' : 'אפס סיסמה'}
                  </Button>
                </form>
              )}
            </Card>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default ResetPasswordPage
