import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Button from '../components/Button'

function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Helmet>
        <title>אודות | המטפל והגישה הטיפולית</title>
        <meta
          name="description"
          content="למד על הגישה הטיפולית, הניסיון והפילוסופיה מאחורי התהליך הטיפולי. מסע משותף אל עבר ריפוי והגשמה."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-neutral-900 mb-8 leading-tight tracking-tight">
                על המסע המשותף שלנו
              </h1>
              <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed font-light max-w-2xl mx-auto">
                כל אדם נושא בתוכו את היכולת לרפא, לצמוח ולהתפתח.
                <span className="text-primary-600 font-medium"> לפעמים אנחנו רק צריכים מישהו שילך איתנו בדרך.</span>
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Story Section */}
      <Section variant="white">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="max-w-none">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-12 text-center tracking-tight">
                המסע שלי
              </h2>
              <div className="space-y-8 text-lg md:text-xl text-neutral-700 leading-[1.8] font-light">
                <p className="text-justify">
                  המסע שלי בעולם הטיפול התחיל מתוך <span className="font-medium text-neutral-900">הבנה עמוקה</span> שכל אדם הוא עולם
                  בפני עצמו, עם סיפור ייחודי, עם כאבים ייחודיים, ועם פוטנציאל
                  ייחודי לצמוח ולהתפתח.
                </p>
                <p className="text-justify">
                  לאורך השנים, למדתי שטיפול אמיתי הוא לא רק טכניקות ושיטות, אלא
                  קודם כל <span className="font-medium text-primary-600">יצירת מרחב בטוח ומכיל</span> שבו האדם יכול להיות מי שהוא באמת –
                  עם כל הכאב, עם כל הפחד, עם כל התקווה.
                </p>
                <p className="text-justify">
                  אני מאמין שטיפול טוב הוא כזה שמכבד את הקצב של האדם, לא דוחף
                  אותו מעבר למה שהוא מוכן, אבל גם לא מוותר עליו כשהוא יכול יותר.
                  <span className="font-medium text-neutral-900"> זה איזון עדין</span> בין סבלנות ואמון לבין עידוד וצמיחה.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* Approach Section */}
      <Section variant="primary">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-12 text-center tracking-tight">
              הגישה הטיפולית שלי
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  title: 'מרחב בטוח',
                  description:
                    'יצירת סביבה מכילה ומקבלת שבה תוכל להיות מי שאתה באמת, ללא שיפוט וללא ביקורת.',
                  accent: 'primary',
                },
                {
                  title: 'קצב אישי',
                  description:
                    'כל אדם מתקדם בקצב שלו. אני כאן כדי ללוות אותך בקצב שלך, לא לדחוף ולא למשוך.',
                  accent: 'secondary',
                },
                {
                  title: 'כלים מעשיים',
                  description:
                    'מעבר לשיחה, אני נותן כלים מעשיים שתוכל להשתמש בהם בחיי היומיום – טכניקות הרגעה, תרגילי נשימה, ועוד.',
                  accent: 'primary',
                },
                {
                  title: 'ראייה הוליסטית',
                  description:
                    'אני רואה את האדם כמכלול – גוף, נפש, רוח. כל חלק משפיע על האחר, וכל חלק ראוי לטיפול.',
                  accent: 'secondary',
                },
              ].map((item, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-neutral-100">
                    <div className={`w-12 h-1 rounded-full mb-6 ${
                      item.accent === 'primary' ? 'bg-primary-500' : 'bg-secondary-500'
                    }`}></div>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-4 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed text-lg font-light">
                      {item.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* Qualifications */}
      <Section variant="white">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-12 text-center tracking-tight">
              הכשרה וניסיון
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'תואר שני בטיפול נפשי',
                  subtitle: 'אוניברסיטת תל אביב',
                  icon: '🎓',
                },
                {
                  title: 'התמחות בטיפול בטראומה',
                  subtitle: 'מכון לטיפול בטראומה',
                  icon: '💫',
                },
                {
                  title: 'הכשרה בטיפול בחרדות',
                  subtitle: 'מכון לבריאות הנפש',
                  icon: '🌱',
                },
                {
                  title: 'ניסיון של למעלה מ-10 שנים',
                  subtitle: 'ליווי מאות אנשים בתהליכי ריפוי וצמיחה',
                  icon: '✨',
                },
              ].map((item, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <div className="bg-gradient-to-br from-neutral-50 to-white rounded-3xl p-8 border border-neutral-100 hover:shadow-lg transition-all duration-300">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-neutral-900 mb-3 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-neutral-600 text-lg font-light">
                      {item.subtitle}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="neutral">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6 tracking-tight">
              מוכן להתחיל?
            </h2>
            <p className="text-xl md:text-2xl text-neutral-700 mb-10 font-light leading-relaxed max-w-2xl mx-auto">
              בואו נכיר בפגישת היכרות ראשונה, <span className="font-medium text-neutral-900">ללא התחייבות.</span>
            </p>
            <Button to="/booking" variant="primary" className="text-lg px-10 py-4">
              קבע פגישת היכרות
            </Button>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default AboutPage

