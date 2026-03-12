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
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl"></div>
        
        <div className="container-custom relative z-10">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6 px-4 py-2 bg-primary-100 rounded-full">
                <span className="text-primary-700 font-semibold text-sm">טיפולים מותאמים אישית</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-neutral-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  סוגי טיפולים
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed max-w-2xl mx-auto font-medium">
                כל אדם הוא עולם בפני עצמו, ולכן כל תהליך טיפולי מותאם אישית
                לצרכים הייחודיים שלך.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="text-2xl">🎯</span>
                  <span className="text-sm font-medium">מותאם אישית</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="text-2xl">💚</span>
                  <span className="text-sm font-medium">מקצועי ואמין</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                  <span className="text-2xl">🌟</span>
                  <span className="text-sm font-medium">תוצאות מוכחות</span>
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {treatments.map((treatment, index) => (
              <AnimatedSection key={treatment._id} delay={index * 0.15}>
                <div className="group relative h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-neutral-100 hover:border-primary-200 transform hover:-translate-y-2">
                  {/* Gradient Header */}
                  <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-6 text-white">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-2xl">✨</span>
                        </div>
                        <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                          טיפול מותאם
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2 leading-tight">
                        {treatment.name}
                      </h2>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {treatment.description && (
                      <p className="text-neutral-700 leading-relaxed mb-6 text-lg">
                        {treatment.description}
                      </p>
                    )}
                    
                    {/* Symptoms */}
                    {treatment.symptoms && treatment.symptoms.length > 0 && (
                      <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                        <h3 className="text-lg font-bold text-primary-800 mb-3 flex items-center gap-2">
                          <span className="text-xl">🔍</span>
                          סימפטומים נפוצים:
                        </h3>
                        <ul className="space-y-2">
                          {treatment.symptoms.map((symptom, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-700">
                              <span className="text-primary-600 mt-1.5 font-bold">▸</span>
                              <span className="flex-1">{symptom}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Coping Methods */}
                    {treatment.copingMethods && treatment.copingMethods.length > 0 && (
                      <div className="mb-6 p-4 bg-primary-100 rounded-xl border border-primary-300">
                        <h3 className="text-lg font-bold text-primary-800 mb-3 flex items-center gap-2">
                          <span className="text-xl">🛠️</span>
                          דרכי התמודדות:
                        </h3>
                        <ul className="space-y-2">
                          {treatment.copingMethods.map((method, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-700">
                              <span className="text-primary-600 mt-1.5 font-bold">▸</span>
                              <span className="flex-1">{method}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Therapeutic Approach */}
                    {treatment.therapeuticApproach && treatment.therapeuticApproach.length > 0 && (
                      <div className="mb-6 p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
                        <h3 className="text-lg font-bold text-primary-900 mb-3 flex items-center gap-2">
                          <span className="text-xl">💜</span>
                          הגישה הטיפולית שלי:
                        </h3>
                        <ul className="space-y-2">
                          {treatment.therapeuticApproach.map((approach, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-800">
                              <span className="text-primary-600 mt-1.5 font-bold text-lg">✓</span>
                              <span className="flex-1 font-medium">{approach}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Link
                      to={`/category/${treatment._id}`}
                      className="group/btn relative inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-300 origin-left"></span>
                      <span className="relative flex items-center gap-2">
                        <span>קרא עוד על הטיפול</span>
                        <span className="text-xl transform group-hover/btn:translate-x-1 transition-transform">→</span>
                      </span>
                    </Link>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/10 rounded-full blur-3xl -z-10"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-300/10 rounded-full blur-2xl -z-10"></div>
                </div>
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

