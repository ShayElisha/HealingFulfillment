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

      {/* Hero Section - עדין ומקצועי */}
      <section className="relative pt-32 pb-24 bg-gradient-to-b from-neutral-50 via-white to-neutral-50 overflow-hidden">
        {/* Decorative Background - עדין מאוד */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-100/30 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-200/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container-custom relative z-10">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-primary-100 shadow-sm">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                <span className="text-primary-700 font-medium text-sm">טיפולים מותאמים אישית</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-neutral-900 mb-6 leading-[1.1]">
                <span className="text-neutral-900">סוגי</span>{' '}
                <span className="text-primary-600">טיפולים</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto font-light">
                כל אדם הוא עולם בפני עצמו, ולכן כל תהליך טיפולי מותאם אישית
                לצרכים הייחודיים שלך. כאן תמצא את המרחב הבטוח והמכיל לצמיחה והתפתחות.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Treatments Grid - עיצוב מקצועי ועדין */}
      <Section variant="white">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-3 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-neutral-500 mt-4 text-sm font-medium">טוען טיפולים...</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500">אין טיפולים זמינים כרגע</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {treatments.map((treatment, index) => (
              <AnimatedSection key={treatment._id} delay={index * 0.1}>
                <div className="group relative h-full bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-neutral-100 hover:border-primary-200/50">
                  {/* Header - עדין ומקצועי */}
                  <div className="relative bg-gradient-to-br from-primary-50 via-primary-50/50 to-white p-8 border-b border-neutral-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-sm">
                        <span className="text-2xl">🌿</span>
                        </div>
                      <span className="text-xs font-medium text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100">
                          טיפול מותאם
                        </span>
                      </div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 leading-tight">
                        {treatment.name}
                      </h2>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-6">
                    {treatment.description && (
                      <p className="text-neutral-700 leading-relaxed text-base font-light">
                        {treatment.description}
                      </p>
                    )}
                    
                    {/* Symptoms - עדין */}
                    {treatment.symptoms && treatment.symptoms.length > 0 && (
                      <div className="p-5 bg-neutral-50/50 rounded-2xl border border-neutral-100">
                        <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                          <span className="text-primary-500">●</span>
                          <span>סימפטומים נפוצים</span>
                        </h3>
                        <ul className="space-y-2.5">
                          {treatment.symptoms.map((symptom, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-600 text-sm">
                              <span className="text-primary-400 mt-1.5 text-xs">▹</span>
                              <span className="flex-1 leading-relaxed">{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Coping Methods - עדין */}
                    {treatment.copingMethods && treatment.copingMethods.length > 0 && (
                      <div className="p-5 bg-primary-50/30 rounded-2xl border border-primary-100/50">
                        <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                          <span className="text-primary-500">●</span>
                          <span>דרכי התמודדות</span>
                        </h3>
                        <ul className="space-y-2.5">
                          {treatment.copingMethods.map((method, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-600 text-sm">
                              <span className="text-primary-400 mt-1.5 text-xs">▹</span>
                              <span className="flex-1 leading-relaxed">{method}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Therapeutic Approach - עדין */}
                    {treatment.therapeuticApproach && treatment.therapeuticApproach.length > 0 && (
                      <div className="p-5 bg-gradient-to-br from-primary-50/40 to-white rounded-2xl border border-primary-100/50">
                        <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                          <span className="text-primary-500">●</span>
                          <span>הגישה הטיפולית</span>
                        </h3>
                        <ul className="space-y-2.5">
                          {treatment.therapeuticApproach.map((approach, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-700 text-sm">
                              <span className="text-primary-500 mt-1 text-xs font-bold">✓</span>
                              <span className="flex-1 leading-relaxed font-light">{approach}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA Button - עדין ומקצועי */}
                    <Link
                      to={`/category/${treatment._id}`}
                      className="group/btn relative inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="relative flex items-center gap-2 text-sm">
                        <span>קרא עוד על הטיפול</span>
                        <span className="text-lg transform group-hover/btn:translate-x-0.5 transition-transform">→</span>
                      </span>
                    </Link>
                  </div>

                  {/* Subtle decorative element */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100/20 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </Section>

      {/* Process Section - עיצוב מקצועי */}
      <Section variant="neutral">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-4">
              איך זה עובד?
            </h2>
              <p className="text-neutral-600 text-lg font-light max-w-2xl mx-auto">
                תהליך מובנה ומקצועי שמוביל אותך צעד אחר צעד אל עבר המטרות שלך
              </p>
            </div>
            <div className="space-y-4">
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
                <AnimatedSection key={index} delay={index * 0.08}>
                  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-100 flex gap-5 group hover:border-primary-200/50">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-primary-700 font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow">
                      {item.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-neutral-600 leading-relaxed text-sm font-light">
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

      {/* CTA - עדין ומקצועי */}
      <Section variant="white">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-primary-50/50 to-white rounded-3xl p-12 border border-neutral-100 shadow-sm">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-4">
              מוכן להתחיל?
            </h2>
              <p className="text-lg text-neutral-600 mb-8 font-light">
              בואו נכיר בפגישת היכרות ראשונה, ללא התחייבות.
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button to="/booking" variant="primary" className="px-8 py-3">
              קבע פגישת היכרות
            </Button>
                <Button to="/contact" variant="secondary" className="px-8 py-3">
                  צור קשר
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default TreatmentsPage
