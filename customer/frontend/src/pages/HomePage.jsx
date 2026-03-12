import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/Button'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import { usePurchase } from '../context/PurchaseContext'
import { reviewsService } from '../services/reviewsApi'

function HomePage() {
  const { openPurchaseModal } = usePurchase()
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoadingReviews(true)
      const [reviewsRes, statsRes] = await Promise.all([
        reviewsService.getAll(),
        reviewsService.getStats()
      ])
      console.log('Reviews response:', reviewsRes)
      console.log('Stats response:', statsRes)
      setReviews(reviewsRes?.data || [])
      setReviewStats(statsRes?.data || null)
    } catch (error) {
      console.error('Error loading reviews:', error)
      console.error('Error details:', error.response?.data || error.message)
      // Set empty arrays on error
      setReviews([])
      setReviewStats(null)
    } finally {
      setLoadingReviews(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>טיפול בחרדות ופוסט טראומה | שחרור חסימות רגשיות והגשמה עצמית</title>
        <meta
          name="description"
          content="מסע משותף אל עבר ריפוי מטראומות, שחרור מחסימות רגשיות והגשמה עצמית. טיפול מקצועי בחרדות, פוסט טראומה ותהליכי צמיחה אישית."
        />
        <meta name="keywords" content="טיפול בחרדות, פוסט טראומה, שחרור חסימות רגשיות, הגשמה עצמית, טיפול נפשי" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection delay={0.2}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-neutral-900 mb-6 leading-tight">
                המסע שלך אל עבר{' '}
                <span className="text-gradient">ריפוי והגשמה</span>
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <p className="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                במקום בטוח ומכיל, נוכל יחד להתחיל את הדרך לשחרור מחסימות רגשיות,
                ריפוי מטראומות והגשמה עצמית. כאן, כל צעד הוא צעד קדימה.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.6}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => openPurchaseModal()} variant="secondary" className="text-lg px-8 py-4">
                  רכוש מסלול
                </Button>
                <Button to="/booking" variant="primary" className="text-lg px-8 py-4">
                  קבע פגישת היכרות
                </Button>
                <Button to="/about" variant="soft" className="text-lg px-8 py-4">
                  גלה עוד עליי
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-neutral-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* למי זה מתאים Section */}
      <Section variant="white" id="for-whom">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-4">
              למי זה מתאים?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              אם אתה מרגיש שאתה תקוע, מתמודד עם חרדות או טראומות מהעבר,
              או פשוט מחפש דרך לצמוח ולהתפתח – אתה במקום הנכון.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'מתמודדים עם חרדות',
              description:
                'אם חרדות משפיעות על החיים היומיומיים שלך, על היחסים, על העבודה או על השינה – יש דרך לצאת מזה.',
            },
            {
              title: 'חווים פוסט טראומה',
              description:
                'טראומות מהעבר יכולות להמשיך להשפיע על ההווה. יחד נוכל לעבד אותן ולשחרר את העומס הרגשי.',
            },
            {
              title: 'מחפשים צמיחה',
              description:
                'גם אם הכל נראה בסדר מבחוץ, אם יש תחושה של תקיעות או רצון לצמוח – זה המקום להתחיל.',
            },
          ].map((item, index) => (
            <AnimatedSection key={index} delay={index * 0.2}>
              <Card>
                <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">{item.description}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* סוגי טיפולים Section */}
      <Section variant="primary" id="treatments">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-4">
              סוגי טיפולים
            </h2>
            <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
              כל אדם הוא עולם בפני עצמו, ולכן כל תהליך טיפולי מותאם אישית לצרכים הייחודיים שלך.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: 'טיפול בחרדות',
              description:
                'עבודה משותפת על הבנת מקורות החרדה, טכניקות להרגעה עצמית, וכלים מעשיים להתמודדות יומיומית.',
              link: '/anxiety',
            },
            {
              title: 'טיפול בפוסט טראומה',
              description:
                'תהליך עדין ומכיל לעיבוד טראומות מהעבר, שחרור מהגוף והנפש, וחזרה לחיים מלאים ומשמעותיים.',
              link: '/trauma',
            },
            {
              title: 'שחרור חסימות רגשיות',
              description:
                'זיהוי ושחרור של דפוסים רגשיים שמחזיקים אותך במקום, ופתיחת דרך לצמיחה והתפתחות.',
              link: '/treatments',
            },
            {
              title: 'תהליכי הגשמה עצמית',
              description:
                'מסע אישי אל עבר הבנה עמוקה יותר של עצמך, הגשמת הפוטנציאל שלך וחיים מלאי משמעות.',
              link: '/treatments',
            },
          ].map((item, index) => (
            <AnimatedSection key={index} delay={index * 0.15}>
              <Card className="bg-white shadow-lg">
                <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed mb-4">{item.description}</p>
                <Link
                  to={item.link}
                  className="text-primary-600 font-medium hover:text-primary-700 transition-colors inline-flex items-center"
                >
                  קרא עוד ←
                </Link>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* על המטפל Section */}
      <Section variant="white" id="about">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection direction="right">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl p-8 md:p-12 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">
                    🌿
                  </div>
                  <p className="text-neutral-600 italic">
                    "כל מסע מתחיל בצעד אחד"
                  </p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="left">
              <div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
                  על המסע המשותף שלנו
                </h2>
                <div className="space-y-4 text-lg text-neutral-700 leading-relaxed">
                  <p>
                    אני מאמין שכל אדם נושא בתוכו את היכולת לרפא, לצמוח ולהתפתח.
                    לפעמים אנחנו רק צריכים מישהו שילך איתנו בדרך, שיראה אותנו,
                    שיקשיב באמת.
                  </p>
                  <p>
                    התהליך הטיפולי שלנו יחד הוא לא רק על פתרון בעיות, אלא על יצירת
                    מרחב בטוח שבו תוכל לחקור את עצמך, להבין מה מניע אותך, ולמצוא את
                    הדרך שלך קדימה.
                  </p>
                  <p>
                    עם שנים של ניסיון וכלים מגוונים, אני כאן כדי ללוות אותך במסע
                    הזה – בצעדים קטנים, בקצב שלך, עם הרבה סבלנות ואמון.
                  </p>
                </div>
                <div className="mt-8">
                  <Button to="/about" variant="secondary">
                    קרא עוד עליי
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </Section>

      {/* ביקורות Section */}
      <Section variant="neutral" id="reviews">
        <AnimatedSection>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-4">
              מה אומרים
            </h2>
            {reviewStats && reviewStats.totalReviews > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-3xl font-bold text-primary-600">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <div className="flex text-accent-500 text-2xl">
                  {'⭐'.repeat(Math.round(reviewStats.averageRating))}
                </div>
                <div className="text-neutral-600">
                  ({reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'ביקורת' : 'ביקורות'})
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>

        {loadingReviews ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">טוען ביקורות...</p>
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">אין ביקורות מאושרות עדיין</p>
            <p className="text-sm text-neutral-500 mt-2">
              ביקורות יופיעו כאן לאחר אישור המנהל
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {reviews.slice(0, 6).map((review, index) => (
              <AnimatedSection key={review._id} delay={index * 0.1}>
                <Card>
                  <div className="mb-4">
                    <div className="flex text-accent-500 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>{star <= review.rating ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-neutral-700 leading-relaxed mb-4 italic">
                    "{review.content}"
                  </p>
                  <p className="text-neutral-900 font-semibold">— {review.customerName || review.customer?.name || 'לקוח'}</p>
                  {review.createdAt && (
                    <p className="text-sm text-neutral-500 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </Card>
              </AnimatedSection>
            ))}
          </div>
        )}
      </Section>

      {/* CTA Section */}
      <Section variant="primary" id="cta">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
              מוכן להתחיל את המסע?
            </h2>
            <p className="text-xl text-neutral-700 mb-8 leading-relaxed">
              פגישת ההיכרות הראשונה היא הזדמנות להכיר, להבין מה אתה מחפש,
              ולראות אם אנחנו מתאימים לעבוד יחד. ללא התחייבות, רק שיחה פתוחה
              וכנה.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => openPurchaseModal()} variant="primary">
                רכוש מסלול
              </Button>
              <Button to="/booking" variant="primary">
                קבע פגישת היכרות
              </Button>
              <Button
                href="https://wa.me/972501234567"
                variant="secondary"
              >
                שלח הודעה ב-WhatsApp
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </Section>
    </>
  )
}

export default HomePage

