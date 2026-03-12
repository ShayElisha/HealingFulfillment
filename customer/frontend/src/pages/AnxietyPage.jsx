import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function AnxietyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Helmet>
        <title>טיפול בחרדות | איך מתמודדים עם התקף חרדה</title>
        <meta
          name="description"
          content="טיפול מקצועי בחרדות. למד איך להתמודד עם התקפי חרדה, מה הם הסימפטומים, ואיך לשחרר את עצמך מהחרדות ולחזור לחיים שלווים."
        />
        <meta name="keywords" content="טיפול בחרדות, התקף חרדה, סימפטומים של חרדה, איך להתמודד עם חרדות" />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                טיפול בחרדות
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                חרדות יכולות להרגיש כמו כלוב שמגביל אותך. אבל יש דרך לצאת מזה –
                דרך שמתחילה בהבנה, ממשיכה בכלים מעשיים, ומובילה לחיים שלווים יותר.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What is Anxiety */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              מה זה חרדה?
            </h2>
            <div className="prose prose-lg max-w-none text-neutral-700 leading-relaxed space-y-4">
              <p>
                חרדה היא תגובה טבעית של הגוף למצבי לחץ או סכנה. אבל לפעמים,
                החרדה מתחילה לפעול גם כשאין סכנה אמיתית – והיא יכולה להפוך למשהו
                שמשפיע על החיים היומיומיים, על היחסים, על העבודה, על השינה.
              </p>
              <p>
                אם אתה מרגיש שהחרדות מנהלות אותך במקום שאתה תנהל אותן – אתה לא
                לבד, ויש דרך לצאת מזה.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* Symptoms */}
      <Section variant="neutral">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-8 text-center">
              סימפטומים של חרדה
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'דפיקות לב מואצות',
                'קשיי נשימה או תחושת חנק',
                'זיעה מוגברת',
                'רעד או רטט',
                'תחושת פחד או אימה',
                'דאגה מתמשכת',
                'קשיי ריכוז',
                'קשיי שינה',
                'מתח בשרירים',
                'בחילה או בעיות עיכול',
                'הימנעות ממצבים מסוימים',
                'מחשבות טורדניות',
              ].map((symptom, index) => (
                <AnimatedSection key={index} delay={index * 0.05}>
                  <Card className="p-4">
                    <p className="text-neutral-700">{symptom}</p>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* How to Deal */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              איך מתמודדים עם התקף חרדה?
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: 'נשימה מודעת',
                  description:
                    'כשהחרדה מתחילה, הנשימה יכולה להיות הכלי הראשון שלך. נשימות עמוקות ואיטיות יכולות לעזור להרגיע את הגוף ולהחזיר אותך לרגע הנוכחי.',
                },
                {
                  title: 'הכרה במצב',
                  description:
                    'להכיר בכך שזה חרדה, לא סכנה אמיתית. להגיד לעצמך: "זה חרדה, זה יעבור". זה יכול לעזור להפחית את העוצמה.',
                },
                {
                  title: 'קרקוע',
                  description:
                    'להתחבר למה שקורה כאן ועכשיו – להרגיש את הרצפה תחת הרגליים, להסתכל סביב, להקשיב לצלילים. זה עוזר לחזור לרגע הנוכחי.',
                },
                {
                  title: 'טכניקות הרגעה',
                  description:
                    'יש מגוון טכניקות שניתן ללמוד – מדיטציה, הרפיה מתקדמת, תרגילי נשימה ספציפיים. כל אחד מוצא מה עובד בשבילו.',
                },
              ].map((tip, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <Card>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      {tip.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">{tip.description}</p>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* Treatment Approach */}
      <Section variant="primary">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-8 text-center">
              הגישה הטיפולית שלי
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  הבנת מקורות החרדה
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  יחד נבין מה מניע את החרדות שלך – מה הטריגרים, מה הדפוסים,
                  מה הסיבות העמוקות יותר.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  כלים מעשיים
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  נלמד טכניקות מעשיות שתוכל להשתמש בהן כשהחרדה מתחילה – טכניקות
                  נשימה, הרגעה, קרקוע, ועוד.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  עבודה על דפוסי מחשבה
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  נזהה דפוסי מחשבה שמזינים את החרדה, ונלמד דרכים חדשות לחשוב
                  ולהתמודד.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  חשיפה הדרגתית
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  אם יש מצבים שאתה נמנע מהם בגלל החרדה, נעבוד יחד על חשיפה
                  הדרגתית ובטוחה.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="white">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              מוכן להתחיל את הדרך לשחרור מהחרדות?
            </h2>
            <p className="text-xl text-neutral-600 mb-8">
              בואו נכיר בפגישת היכרות ראשונה, ונראה איך נוכל לעבוד יחד.
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

export default AnxietyPage

