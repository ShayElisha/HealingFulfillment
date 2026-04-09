import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { authService } from '../services/authApi'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'לא ניתן לשלוח בקשת איפוס כרגע')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>שכחתי סיסמה | תיק לקוח</title>
      </Helmet>
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">שכחתי סיסמה</h1>
              <p className="text-xl text-neutral-600 leading-relaxed">נשלח קישור איפוס לאימייל שלך</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Section variant="white">
        <div className="max-w-md mx-auto">
          <AnimatedSection>
            <Card>
              {sent ? (
                <div className="space-y-4 text-center">
                  <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                    אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.
                  </p>
                  <Link to="/customer/login" className="text-primary-600 hover:underline">
                    חזרה להתחברות
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
                  <Button type="submit" variant="primary" className="w-full text-lg py-3" disabled={loading}>
                    {loading ? 'שולח...' : 'שלח קישור איפוס'}
                  </Button>
                  <p className="text-sm text-center text-neutral-600">
                    נזכרת בסיסמה?{' '}
                    <Link to="/customer/login" className="text-primary-600 hover:text-primary-700 underline">
                      חזרה להתחברות
                    </Link>
                  </p>
                </form>
              )}
            </Card>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default ForgotPasswordPage
