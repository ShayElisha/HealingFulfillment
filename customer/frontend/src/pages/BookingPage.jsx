import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import BookingForm from '../components/BookingForm'
import Card from '../components/Card'

function BookingPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Helmet>
        <title>קבע פגישה | פגישת היכרות ראשונה</title>
        <meta
          name="description"
          content="קבע פגישת היכרות ראשונה. ללא התחייבות, רק שיחה פתוחה וכנה כדי לראות אם אנחנו מתאימים לעבוד יחד."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                קבע פגישה
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                פגישת ההיכרות הראשונה היא הזדמנות להכיר, להבין מה אתה מחפש,
                ולראות אם אנחנו מתאימים לעבוד יחד. ללא התחייבות, רק שיחה פתוחה
                וכנה.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Booking Form */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <BookingForm />
              </AnimatedSection>
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-1">
              <AnimatedSection direction="left">
                <div className="space-y-6">
                  <Card>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      מה קורה בפגישה הראשונה?
                    </h3>
                    <p className="text-neutral-600 leading-relaxed text-sm">
                      בפגישה הראשונה נכיר, נבין מה אתה מחפש, מה האתגרים שלך,
                      ומה המטרות שלך. זו הזדמנות לראות אם אנחנו מתאימים לעבוד
                      יחד, ללא התחייבות.
                    </p>
                  </Card>
                  <Card>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      כמה זמן נמשכת פגישה?
                    </h3>
                    <p className="text-neutral-600 leading-relaxed text-sm">
                      פגישה נמשכת כ-50 דקות. זה נותן זמן מספיק לשיחה משמעותית
                      בלי להרגיש לחץ.
                    </p>
                  </Card>
                  <Card>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      איפה מתקיימות הפגישות?
                    </h3>
                    <p className="text-neutral-600 leading-relaxed text-sm">
                      הפגישות מתקיימות בקליניקה שלי או בזום, לפי מה שנוח לך.
                      אפשר גם לשלב בין השניים.
                    </p>
                  </Card>
                  <Card>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      מה המחיר?
                    </h3>
                    <p className="text-neutral-600 leading-relaxed text-sm">
                      פגישת ההיכרות הראשונה היא ללא תשלום. אחרי הפגישה הראשונה,
                      נדבר על המחיר והתדירות שמתאימים לך.
                    </p>
                  </Card>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </Section>

      {/* Alternative CTA */}
      <Section variant="primary">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              מעדיף לדבר ישירות?
            </h2>
            <p className="text-xl text-neutral-700 mb-8">
              אתה מוזמן להתקשר או לשלוח הודעה ב-WhatsApp. אני כאן כדי לעזור.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+972501234567"
                className="btn-primary inline-block text-center"
              >
                התקשר עכשיו
              </a>
              <a
                href="https://wa.me/972501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-block text-center"
              >
                שלח הודעה ב-WhatsApp
              </a>
            </div>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default BookingPage

