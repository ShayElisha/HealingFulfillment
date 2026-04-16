import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import ReviewsCarousel from '../components/ReviewsCarousel'
import { usePurchase } from '../context/PurchaseContext'
import { reviewsService } from '../services/reviewsApi'
import { categoryService, forWhomAudienceService } from '../services/api'
import ForWhomAudienceDoorCard from '../components/ForWhomAudienceDoorCard'
import heroVideo from '../assets/PixVerse_V5.5_Extend_720P_Seamless_looping_cin.mp4'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/yanivtan/' },
  { label: 'YouTube', href: 'https://www.youtube.com/@intelligent-space-between-us/videos?app=desktop&view=0&sort=dd&shelf_id=4' },
  { label: 'Facebook', href: 'https://www.facebook.com/groups/1265110442334306/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@yaniv.tanami1' },
]

function SocialIcon({ label, className = 'w-5 h-5' }) {
  if (label === 'Instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (label === 'YouTube') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="2.8" y="6.2" width="18.4" height="11.6" rx="3.2" />
        <path d="M10 9.4l5.2 2.6L10 14.6V9.4z" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (label === 'Facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <path d="M13.4 20v-6.6h2.2l.5-2.6h-2.7V9.4c0-.8.3-1.3 1.4-1.3h1.4V5.8c-.2 0-1-.1-2-.1-2 0-3.3 1.2-3.3 3.5v1.6H9v2.6h1.8V20h2.6z" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M9.8 9.2v5.7c0 1 .8 1.8 1.8 1.8h2.1c1 0 1.8-.8 1.8-1.8V9.2" />
      <path d="M11 7.8h2M12 7.8v8.8" />
    </svg>
  )
}

function HomePage() {
  const { openPurchaseModal } = usePurchase()
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [reviewsError, setReviewsError] = useState('')
  const [treatments, setTreatments] = useState([])
  const [loadingTreatments, setLoadingTreatments] = useState(true)
  const [forWhomProfiles, setForWhomProfiles] = useState([])
  const [loadingForWhom, setLoadingForWhom] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadReviews()
    loadTreatments()
    loadForWhomProfiles()
  }, [])

  const loadReviews = async () => {
    try {
      setLoadingReviews(true)
      setReviewsError('')
      const reviewsRes = await reviewsService.getAll()
      const normalized = Array.isArray(reviewsRes?.data)
        ? reviewsRes.data
        : Array.isArray(reviewsRes)
          ? reviewsRes
          : []
      setReviews(normalized)
    } catch (error) {
      console.error('Error loading reviews:', error)
      console.error('Error details:', error.response?.data || error.message)
      setReviewsError('טעינת הביקורות נכשלה כרגע. נסה לרענן בעוד רגע.')
      setReviews([])
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

  const loadForWhomProfiles = async () => {
    try {
      setLoadingForWhom(true)
      const res = await forWhomAudienceService.getAll()
      setForWhomProfiles(Array.isArray(res?.data) ? res.data : [])
    } catch (error) {
      console.error('Error loading for-whom profiles:', error)
      setForWhomProfiles([])
    } finally {
      setLoadingForWhom(false)
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
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover [transform:translateZ(0)]"
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary-50/25 via-white/25 to-secondary-50/25" />
        <div className="container-custom relative z-10 px-3 sm:px-4">
          {/* מתיחה לרוחב ה־container (ביטול ה-padding הפנימי) + רווח אופקי גדול — תמונה צמודה יותר לשמאל, טקסט לימין */}
          <div className="-mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8">
            <div
              className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-y-10 gap-x-10 px-3 sm:px-4 md:gap-y-12 md:px-6 lg:px-8"
              dir="ltr"
            >
            <div className="order-2 min-w-0 max-w-4xl w-full md:order-2">
              <div
                className="mx-auto min-w-0 w-full max-w-4xl rounded-2xl border border-white/50 bg-white/90 p-5 shadow-xl sm:bg-white/88 sm:p-7 lg:max-w-3xl lg:p-10"
                dir="rtl"
              >
                <h1 className="mb-4 font-serif text-3xl font-bold leading-tight text-neutral-900 sm:mb-5 sm:text-4xl md:text-5xl lg:text-6xl">
                  מהישרדות לשגשוג תהליך אינטגרטיבי מאחד{' '}
                  <span className="text-gradient">ריפוי והגשמה</span>
                </h1>
                <p className="mb-6 text-base leading-relaxed text-neutral-700 sm:mb-8 sm:text-lg md:text-xl lg:text-2xl">
                  המוח שלך לא שבור – הוא פשוט מחווט להישרדות. הגיע הזמן לחזור לריבונות
                </p>
                <div className="flex min-w-0 w-full max-w-full flex-row flex-nowrap items-stretch gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
                  <Button
                    onClick={() => openPurchaseModal()}
                    variant="secondary"
                    className="min-h-[2.75rem] min-w-0 flex-1 basis-0 px-1.5 py-2 text-center text-[11px] leading-tight whitespace-normal sm:px-2 sm:text-xs md:px-3 md:py-3 md:text-sm lg:px-4 lg:text-base"
                  >
                    רכוש מסלול
                  </Button>
                  <Button
                    to="/booking"
                    variant="primary"
                    className="min-h-[2.75rem] min-w-0 flex-1 basis-0 px-1.5 py-2 text-center text-[11px] leading-tight whitespace-normal sm:px-2 sm:text-xs md:px-3 md:py-3 md:text-sm lg:px-4 lg:text-base"
                  >
                    קבע פגישת היכרות
                  </Button>
                  <Button
                    to="/about"
                    variant="soft"
                    className="min-h-[2.75rem] min-w-0 flex-1 basis-0 px-1.5 py-2 text-center text-[11px] leading-tight whitespace-normal sm:px-2 sm:text-xs md:px-3 md:py-3 md:text-sm lg:px-4 lg:text-base"
                  >
                    גלה עוד עליי
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-3 sm:mt-5" aria-label="רשתות חברתיות">
                  {SOCIAL_LINKS.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 transition-colors hover:border-primary-400 hover:text-primary-600"
                    >
                      <SocialIcon label={item.label} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 sm:bottom-10 left-1/2 z-10 -translate-x-1/2 transform flex flex-col items-center px-3">
          {/* Speech bubble with text */}
          <div className="relative mb-3 animate-bounce motion-reduce:animate-none sm:mb-4">
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
            <div className="mx-auto max-w-3xl space-y-3 px-3 text-base text-neutral-600 sm:text-lg md:space-y-4 md:text-xl">
              <p className="leading-relaxed">
                להלן{' '}
                <strong className="font-semibold text-neutral-800">
                  {loadingForWhom || forWhomProfiles.length === 0
                    ? 'פרופילים שכיחים'
                    : `${forWhomProfiles.length} פרופילים שכיחים`}
                </strong>
                . מעל כל דלת — הכותרת; מאחורי הדלת — תקציר.{' '}
                <span className="font-medium text-neutral-700">לחיצה על הכותרת</span> מובילה לעמוד מלא
                בנושא (כתובת דינמית לפי כרטיס — בלי slug נפרד).
              </p>
              <p className="text-sm leading-relaxed text-neutral-500 sm:text-base md:text-lg">
                <span className="font-medium text-neutral-600">איך לפתוח את הדלת?</span>{' '}
                במחשב — העבירו את העכבר מעל הדלת. בטלפון — התוכן מוצג ישירות.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {loadingForWhom ? (
          <div className="py-12 text-center text-neutral-600">טוען כרטיסים…</div>
        ) : forWhomProfiles.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">תוכן הסקציה יתעדכן בקרוב.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 sm:gap-8 md:gap-10 xl:gap-8">
            {forWhomProfiles.map((item, index) => (
              <ForWhomAudienceDoorCard key={item._id} item={item} index={index} />
            ))}
          </div>
        )}
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
        ) : reviewsError ? (
          <div className="text-center py-12">
            <p className="text-neutral-700">{reviewsError}</p>
            <Button
              onClick={loadReviews}
              variant="secondary"
              className="mt-4"
            >
              נסה שוב
            </Button>
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">אין ביקורות מאושרות עדיין</p>
            <p className="text-sm text-neutral-500 mt-2">
              ביקורות יופיעו כאן לאחר אישור המנהל
            </p>
          </div>
        ) : (
          <AnimatedSection>
            <ReviewsCarousel reviews={reviews} />
          </AnimatedSection>
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

