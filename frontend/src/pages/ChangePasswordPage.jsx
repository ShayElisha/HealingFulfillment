import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function ChangePasswordPage() {
  const navigate = useNavigate()
  const { changePassword, isAuthenticated, user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
                  <input
                    type="password"
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="הכנס את הסיסמה הנוכחית"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="הכנס סיסמה חדשה (מינימום 6 תווים)"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    סיסמה חייבת להכיל לפחות 6 תווים
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                    אימות סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="הכנס שוב את הסיסמה החדשה"
                  />
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

