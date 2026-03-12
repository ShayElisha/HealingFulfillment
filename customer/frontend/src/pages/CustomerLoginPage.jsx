import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../context/AuthContext'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function CustomerLoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    // אם כבר מחובר, הפנה לתיק הלקוח
    if (isAuthenticated) {
      navigate('/customer/profile')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      
      // אם צריך לשנות סיסמה, הפנה לדף שינוי סיסמה
      if (result.mustChangePassword) {
        navigate('/customer/change-password')
      } else {
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
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="הכנס את הסיסמה שלך"
                  />
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

