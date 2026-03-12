import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function TraumaPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Helmet>
        <title>טיפול בפוסט טראומה | איך לשחרר טראומה מהגוף</title>
        <meta
          name="description"
          content="טיפול מקצועי בפוסט טראומה. למד על הסימפטומים, איך טראומה משפיעה על הגוף והנפש, ואיך לשחרר את העומס הרגשי ולחזור לחיים מלאים."
        />
        <meta name="keywords" content="טיפול בפוסט טראומה, סימפטומים של פוסט טראומה, איך לשחרר טראומה, טיפול בטראומה" />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                טיפול בפוסט טראומה
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                טראומות מהעבר יכולות להמשיך להשפיע על ההווה. אבל יש דרך לעבד
                אותן, לשחרר את העומס הרגשי והגופני, ולחזור לחיים מלאים ומשמעותיים.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* What is Trauma */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              מה זה פוסט טראומה?
            </h2>
            <div className="prose prose-lg max-w-none text-neutral-700 leading-relaxed space-y-4">
              <p>
                פוסט טראומה (PTSD) היא תגובה נפשית לטראומה – חוויה קשה, מפחידה,
                או מסכנת חיים. הטראומה יכולה להיות חד-פעמית או מתמשכת, והיא יכולה
                להשאיר חותם עמוק על הנפש והגוף.
              </p>
              <p>
                אבל חשוב להבין: פוסט טראומה היא לא גזר דין. עם טיפול נכון ותמיכה,
                אפשר לעבד את הטראומה, לשחרר את העומס הרגשי והגופני, ולחזור לחיים
                מלאים.
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
              סימפטומים של פוסט טראומה
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  category: 'זיכרונות פולשניים',
                  items: ['פלשבקים', 'סיוטים', 'זיכרונות טורדניים'],
                },
                {
                  category: 'הימנעות',
                  items: [
                    'הימנעות ממקומות או מצבים שמזכירים את הטראומה',
                    'הימנעות ממחשבות או רגשות קשורים',
                  ],
                },
                {
                  category: 'שינויים במצב הרוח',
                  items: [
                    'דיכאון',
                    'אשמה או בושה',
                    'קשיי אמון',
                    'תחושת ניתוק',
                  ],
                },
                {
                  category: 'עוררות מוגברת',
                  items: [
                    'קשיי שינה',
                    'חוסר ריכוז',
                    'תגובות בהלה מוגברות',
                    'מתח מתמיד',
                  ],
                },
              ].map((group, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <Card>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      {group.category}
                    </h3>
                    <ul className="space-y-2 text-neutral-600">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary-500 ml-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* How Trauma Affects */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              איך טראומה משפיעה על הגוף והנפש?
            </h2>
            <div className="prose prose-lg max-w-none text-neutral-700 leading-relaxed space-y-4">
              <p>
                טראומה לא משפיעה רק על הנפש – היא משפיעה גם על הגוף. כשאנחנו
                חווים טראומה, הגוף נכנס למצב של "הילחם או ברח", והטראומה יכולה
                להישאר "תקועה" בגוף גם אחרי שהאירוע הסתיים.
              </p>
              <p>
                זה יכול להתבטא במתח בשרירים, כאבים כרוניים, קשיי שינה, בעיות
                עיכול, ועוד. הטיפול בטראומה צריך לקחת בחשבון גם את הגוף, לא רק את
                הנפש.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* How to Release */}
      <Section variant="primary">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-8 text-center">
              איך לשחרר טראומה מהגוף?
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: 'עיבוד בטוח ומכיל',
                  description:
                    'הטיפול מתחיל ביצירת מרחב בטוח שבו תוכל לספר את הסיפור שלך, בקצב שלך, בלי לחץ או דחיפה.',
                },
                {
                  title: 'עבודה עם הגוף',
                  description:
                    'נשתמש בטכניקות שמחברות את הגוף – תרגילי נשימה, תנועה, הרפיה. זה עוזר לשחרר את הטראומה מהגוף.',
                },
                {
                  title: 'עיבוד רגשי',
                  description:
                    'יחד נעבד את הרגשות הקשורים לטראומה – הפחד, הכעס, האשמה, הבושה. כל רגש ראוי להכרה ולעיבוד.',
                },
                {
                  title: 'יצירת משמעות חדשה',
                  description:
                    'הטראומה היא חלק מהסיפור שלך, אבל היא לא כל הסיפור. יחד נעזור לך ליצור משמעות חדשה, ולמצוא דרך קדימה.',
                },
              ].map((item, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  <div className="bg-white rounded-2xl p-6 shadow-soft">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* Treatment Approach */}
      <Section variant="white">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              הגישה הטיפולית שלי
            </h2>
            <div className="prose prose-lg max-w-none text-neutral-700 leading-relaxed space-y-4">
              <p>
                הטיפול בטראומה דורש גישה עדינה ומכילה. אני מאמין שכל אדם יודע
                בדיוק מה הקצב שלו, מה הוא מוכן לעבוד עליו, ומה עדיין לא. אני כאן
                כדי ללוות אותך בקצב שלך, לא לדחוף ולא למשוך.
              </p>
              <p>
                נשתמש בכלים מגוונים – שיחה, עבודה עם הגוף, טכניקות הרגעה,
                ועוד. כל אחד מוצא מה עובד בשבילו, ומה עוזר לו להתקדם.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="neutral">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              מוכן להתחיל את הדרך לריפוי?
            </h2>
            <p className="text-xl text-neutral-600 mb-8">
              בואו נכיר בפגישת היכרות ראשונה, ונראה איך נוכל לעבוד יחד על עיבוד
              הטראומה ושחרור העומס.
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

export default TraumaPage

