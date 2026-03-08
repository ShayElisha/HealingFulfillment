import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'
import { categoryService } from '../services/api'

function TreatmentsPage() {
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadTreatments()
  }, [])

  const loadTreatments = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getAll()
      const activeTreatments = (response?.data || []).filter(t => t.isActive)
      // Sort by order
      activeTreatments.sort((a, b) => (a.order || 0) - (b.order || 0))
      setTreatments(activeTreatments)
    } catch (error) {
      console.error('Error loading treatments:', error)
      setTreatments([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>סוגי טיפולים | טיפול בחרדות, פוסט טראומה והגשמה עצמית</title>
        <meta
          name="description"
          content="מגוון טיפולים מותאמים אישית: טיפול בחרדות, פוסט טראומה, שחרור חסימות רגשיות ותהליכי הגשמה עצמית."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                סוגי טיפולים
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                כל אדם הוא עולם בפני עצמו, ולכן כל תהליך טיפולי מותאם אישית
                לצרכים הייחודיים שלך.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Treatments Grid */}
      <Section variant="white">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-neutral-600">טוען טיפולים...</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-600">אין טיפולים זמינים כרגע</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {treatments.map((treatment, index) => (
              <AnimatedSection key={treatment._id} delay={index * 0.15}>
                <Card>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-4">
                    {treatment.name}
                  </h2>
                  {treatment.description && (
                    <p className="text-neutral-600 leading-relaxed mb-6">
                      {treatment.description}
                    </p>
                  )}
                  
                  {/* Symptoms */}
                  {treatment.symptoms && treatment.symptoms.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                        סימפטומים נפוצים:
                      </h3>
                      <ul className="space-y-2">
                        {treatment.symptoms.map((symptom, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-700">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Coping Methods */}
                  {treatment.copingMethods && treatment.copingMethods.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                        דרכי התמודדות:
                      </h3>
                      <ul className="space-y-2">
                        {treatment.copingMethods.map((method, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-700">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{method}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Therapeutic Approach */}
                  {treatment.therapeuticApproach && treatment.therapeuticApproach.length > 0 && (
                    <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                        הגישה הטיפולית שלי:
                      </h3>
                      <ul className="space-y-2">
                        {treatment.therapeuticApproach.map((approach, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-neutral-700">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{approach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link
                    to={`/category/${treatment._id}`}
                    className="text-primary-600 font-medium hover:text-primary-700 transition-colors inline-flex items-center"
                  >
                    קרא עוד ←
                  </Link>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        )}
      </Section>

      {/* Process Section */}
      <Section variant="primary">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-8 text-center">
              איך זה עובד?
            </h2>
            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'פגישת היכרות',
                  description:
                    'פגישה ראשונה שבה נכיר, נבין מה אתה מחפש, ונראה אם אנחנו מתאימים לעבוד יחד.',
                },
                {
                  step: '2',
                  title: 'הערכה ראשונית',
                  description:
                    'יחד נבין את המצב הנוכחי, את האתגרים, ואת המטרות שלך.',
                },
                {
                  step: '3',
                  title: 'תכנית טיפול מותאמת',
                  description:
                    'נבנה יחד תכנית טיפול שמותאמת בדיוק לצרכים הייחודיים שלך.',
                },
                {
                  step: '4',
                  title: 'תהליך טיפולי',
                  description:
                    'פגישות שבועיות או דו-שבועיות, בהן נעבוד יחד על המטרות שהצבנו.',
                },
                {
                  step: '5',
                  title: 'צמיחה והתפתחות',
                  description:
                    'תהליך של צמיחה מתמשכת, עם כלים שתוכל להשתמש בהם גם אחרי סיום הטיפול.',
                },
              ].map((item, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <div className="bg-white rounded-2xl p-6 shadow-soft flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-neutral-700 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="white">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              מוכן להתחיל?
            </h2>
            <p className="text-xl text-neutral-600 mb-8">
              בואו נכיר בפגישת היכרות ראשונה, ללא התחייבות.
            </p>
            <Button to="/booking" variant="primary">
              קבע פגישת היכרות
            </Button>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default TreatmentsPage

