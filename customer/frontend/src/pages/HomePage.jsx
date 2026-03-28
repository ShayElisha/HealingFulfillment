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
import { categoryService } from '../services/api'
import yanivImage from '../assets/yaniv.png'
import heroVideo from '../assets/PixVerse_V5.5_Extend_720P_Seamless_looping_cin.mp4'

function HomePage() {
  const { openPurchaseModal } = usePurchase()
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [treatments, setTreatments] = useState([])
  const [loadingTreatments, setLoadingTreatments] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadReviews()
    loadTreatments()
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

  const loadTreatments = async () => {
    try {
      setLoadingTreatments(true)
      const response = await categoryService.getAll()
      const activeTreatments = (response?.data || []).filter((treatment) => treatment.isActive)
      activeTreatments.sort((a, b) => (a.order || 0) - (b.order || 0))
      setTreatments(activeTreatments.slice(0, 4))
    } catch (error) {
      console.error('Error loading treatments:', error)
      setTreatments([])
    } finally {
      setLoadingTreatments(false)
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20 pb-32 sm:pb-24">
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary-50/25 via-white/25 to-secondary-50/25" />
        <div className="container-custom relative z-10 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection delay={0.1}>
              <div className="flex justify-center mb-8 sm:mb-12 md:mb-16">
                <div className="relative">
                  {/* Rotating dark glowing element around the ring */}
                  <div className="absolute inset-0 -inset-3 sm:-inset-5 md:-inset-8 rounded-full animate-spin-slow pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-primary-800 shadow-[0_0_15px_rgba(15,118,110,0.8)] sm:shadow-[0_0_20px_rgba(15,118,110,1)] md:shadow-[0_0_30px_rgba(15,118,110,1.2)]"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-primary-800 shadow-[0_0_15px_rgba(15,118,110,0.8)] sm:shadow-[0_0_20px_rgba(15,118,110,1)] md:shadow-[0_0_30px_rgba(15,118,110,1.2)]"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-primary-800 shadow-[0_0_15px_rgba(15,118,110,0.8)] sm:shadow-[0_0_20px_rgba(15,118,110,1)] md:shadow-[0_0_30px_rgba(15,118,110,1.2)]"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-primary-800 shadow-[0_0_15px_rgba(15,118,110,0.8)] sm:shadow-[0_0_20px_rgba(15,118,110,1)] md:shadow-[0_0_30px_rgba(15,118,110,1.2)]"></div>
                  </div>
                  
                  {/* Rotating ring (not glowing) */}
                  <div className="absolute inset-0 -inset-3 sm:-inset-5 md:-inset-8 rounded-full border-[4px] sm:border-[6px] md:border-[10px] border-primary-700/80 bg-primary-900/10 animate-spin-slow pointer-events-none"></div>
                  
                  {/* Main image */}
                  <img 
                    src={yanivImage} 
                    alt="יניב תנעמי" 
                    className="w-40 h-40 sm:w-56 sm:h-56 md:w-80 md:h-80 rounded-full object-cover shadow-2xl border-2 sm:border-4 border-white"
                  />
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-neutral-900 mb-4 sm:mb-6 leading-tight px-2">
                המסע שלך אל עבר{' '}
                <span className="text-gradient">ריפוי והגשמה</span>
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.4}>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-600 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto px-3">
                במקום בטוח ומכיל, נוכל יחד להתחיל את הדרך לשחרור מחסימות רגשיות,
                ריפוי מטראומות והגשמה עצמית. כאן, כל צעד הוא צעד קדימה.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.6}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <Button onClick={() => openPurchaseModal()} variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                  רכוש מסלול
                </Button>
                <Button to="/booking" variant="primary" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                  קבע פגישת היכרות
                </Button>
                <Button to="/about" variant="soft" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                  גלה עוד עליי
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </div>
        <div className="absolute bottom-6 sm:bottom-10 left-1/2 z-10 -translate-x-1/2 transform flex flex-col items-center px-3">
          {/* Speech bubble with text */}
          <div className="relative mb-3 sm:mb-4 animate-bounce">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 border-primary-200 px-4 sm:px-6 py-3 sm:py-4 max-w-[280px] sm:max-w-xs md:max-w-sm">
              <p className="text-xs sm:text-sm md:text-base text-neutral-700 text-center leading-relaxed font-medium">
                אתה מרגיש תקוע? אתה חושב שהכל חשוך? תבדוק אם אחד הדברים פה מתאים לך?
              </p>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-6 sm:border-l-8 border-r-6 sm:border-r-8 border-t-6 sm:border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
            </div>
          </div>
          
          {/* Scroll down arrow - centered */}
          <button
            onClick={() => {
              const treatmentsSection = document.getElementById('treatments')
              if (treatmentsSection) {
                treatmentsSection.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="cursor-pointer hover:scale-110 transition-transform duration-300 flex items-center justify-center"
            aria-label="גלול לרשימת טיפולים"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400 hover:text-primary-600 transition-colors"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </section>

      {/* למי זה מתאים Section */}
      <Section variant="white" id="for-whom">
        <AnimatedSection>
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-3 sm:mb-4 px-3">
              למי זה מתאים?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto px-3">
              אם אתה מרגיש שאתה תקוע, מתמודד עם חרדות או טראומות מהעבר,
              או פשוט מחפש דרך לצמוח ולהתפתח – אתה במקום הנכון.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
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
                <h3 className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900 mb-2 sm:mb-3">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{item.description}</p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </Section>

      {/* תהליכי ליווי Section */}
      <Section variant="primary" id="treatments">
        <AnimatedSection>
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-3 sm:mb-4 px-3">
              תהליכי ליווי
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-neutral-700 max-w-2xl mx-auto px-3">
              כל אדם הוא עולם בפני עצמו, ולכן כל תהליך טיפולי מותאם אישית לצרכים הייחודיים שלך.
            </p>
          </div>
        </AnimatedSection>

        {loadingTreatments ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">טוען טיפולים...</p>
          </div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">אין טיפולים זמינים כרגע</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {treatments.map((treatment, index) => (
              <AnimatedSection key={treatment._id} delay={index * 0.15}>
                <Card className="bg-white shadow-lg">
                  <h3 className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900 mb-2 sm:mb-3">
                    {treatment.name}
                  </h3>
                  <p
                    className="text-sm sm:text-base text-neutral-700 leading-relaxed mb-3 sm:mb-4"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {treatment.description || 'פרטים נוספים זמינים בעמוד הטיפול.'}
                  </p>
                  <Link
                    to={`/category/${treatment._id}`}
                    className="text-sm sm:text-base text-primary-600 font-medium hover:text-primary-700 transition-colors inline-flex items-center"
                  >
                    קרא עוד ←
                  </Link>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        )}
      </Section>

      {/* על המטפל Section */}
      <Section variant="white" id="about">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            <AnimatedSection direction="right">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center text-3xl sm:text-4xl">
                    🌿
                  </div>
                  <p className="text-sm sm:text-base text-neutral-600 italic">
                    "כל מסע מתחיל בצעד אחד"
                  </p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="left">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 sm:mb-6">
                  על המסע המשותף שלנו
                </h2>
                <div className="space-y-3 sm:space-y-4 text-base sm:text-lg text-neutral-700 leading-relaxed">
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
                <div className="mt-6 sm:mt-8">
                  <Button to="/about" variant="secondary" className="w-full sm:w-auto">
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
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-3 sm:mb-4 px-3">
              חוות דעת
            </h2>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto px-3 sm:px-4">
            {reviews.slice(0, 6).map((review, index) => (
              <AnimatedSection key={review._id} delay={index * 0.1}>
                <Card>
                  <div className="mb-3 sm:mb-4">
                    <div className="flex text-accent-500 mb-2 text-lg sm:text-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>{star <= review.rating ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mb-3 sm:mb-4 italic">
                    "{review.content}"
                  </p>
                  <p className="text-sm sm:text-base text-neutral-900 font-semibold">— {review.customerName || review.customer?.name || 'לקוח'}</p>
                  {review.createdAt && (
                    <p className="text-xs sm:text-sm text-neutral-500 mt-2">
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
        <div className="max-w-3xl mx-auto text-center px-3 sm:px-4">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 sm:mb-6">
              מוכן להתחיל את המסע?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-neutral-700 mb-6 sm:mb-8 leading-relaxed">
              פגישת ההיכרות הראשונה היא הזדמנות להכיר, להבין מה אתה מחפש,
              ולראות אם אנחנו מתאימים לעבוד יחד. ללא התחייבות, רק שיחה פתוחה
              וכנה.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button onClick={() => openPurchaseModal()} variant="primary" className="w-full sm:w-auto">
                רכוש מסלול
              </Button>
              <Button to="/booking" variant="primary" className="w-full sm:w-auto">
                קבע פגישת היכרות
              </Button>
              <Button
                href="https://wa.me/972526264507"
                variant="secondary"
                className="w-full sm:w-auto"
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

