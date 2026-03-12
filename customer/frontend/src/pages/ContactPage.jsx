import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'
import { useContact } from '../context/ContactContext'

function ContactPage() {
  const { openContactModal } = useContact()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Helmet>
        <title>צור קשר | שלח הודעה או התקשר</title>
        <meta
          name="description"
          content="צור קשר לקביעת פגישה, שאלות או כל בקשה אחרת. אני כאן כדי לעזור."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                צור קשר
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                אני כאן כדי לעזור. שלח הודעה, התקשר, או קבע פגישה – מה שנוח לך.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Info */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <AnimatedSection direction="right">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📞</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      טלפון
                    </h3>
                    <a
                      href="tel:+972501234567"
                      className="text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      050-123-4567
                    </a>
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            <AnimatedSection direction="left">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">✉️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      אימייל
                    </h3>
                    <a
                      href="mailto:info@healing-fulfillment.co.il"
                      className="text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      info@healing-fulfillment.co.il
                    </a>
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💬</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      WhatsApp
                    </h3>
                    <a
                      href="https://wa.me/972501234567"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      שלח הודעה ב-WhatsApp
                    </a>
                  </div>
                </div>
              </Card>
            </AnimatedSection>

            <AnimatedSection direction="left">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📝</div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      שלח הודעה
                    </h3>
                    <Button
                      variant="primary"
                      onClick={openContactModal}
                      className="mt-2"
                    >
                      פתח טופס יצירת קשר
                    </Button>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          </div>

          <AnimatedSection>
            <div className="p-6 bg-primary-50 rounded-2xl text-center">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                שעות פעילות
              </h3>
              <p className="text-neutral-600">
                ראשון - חמישי: 9:00 - 20:00<br />
                שישי: 9:00 - 14:00<br />
                שבת: סגור
              </p>
            </div>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default ContactPage

