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

/** true = פתיחה במעבר עכבר; false = מסכי מגע — לחיצה לפתיחה/סגירה */
function useForWhomHoverMode() {
  const [hoverMode, setHoverMode] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setHoverMode(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return hoverMode
}

function ForWhomAudienceCard({ item, index, hoverMode }) {
  const [open, setOpen] = useState(false)

  const pointerHandlers = hoverMode
    ? {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      }
    : {
        onClick: () => setOpen((o) => !o),
      }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((o) => !o)
    }
  }

  return (
    <AnimatedSection delay={Math.min(index * 0.08, 0.5)}>
      <div className="mx-auto flex w-full max-w-[300px] flex-col items-center">
        <h3 className="mb-4 flex min-h-[4.5rem] items-end justify-center px-1 text-center text-lg font-serif font-semibold leading-snug text-neutral-900 sm:mb-5 sm:text-xl">
          {item.title}
        </h3>
        <div
          {...pointerHandlers}
          onKeyDown={onKeyDown}
          tabIndex={0}
          className={`flex w-full flex-col items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 ${hoverMode ? '' : 'cursor-pointer touch-manipulation'}`}
          role={hoverMode ? undefined : 'button'}
          aria-expanded={hoverMode ? undefined : open}
          aria-label={hoverMode ? undefined : `${open ? 'סגירת' : 'פתיחת'} פרטים: ${item.title}`}
        >
          <p className="sr-only">{item.description}</p>
          <div className="relative aspect-[3/4] w-full min-h-[240px] max-h-[360px] min-[480px]:min-h-[280px] min-[480px]:max-h-[400px] sm:max-h-[440px] rounded-xl" aria-hidden>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-neutral-100 via-neutral-200/90 to-neutral-300 p-[6px] shadow-[0_10px_40px_-10px_rgba(15,118,110,0.25),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-neutral-400/30 min-[480px]:p-[7px]">
              <div className="relative h-full w-full rounded-lg bg-gradient-to-b from-neutral-300/50 to-neutral-400/30 p-[3px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.12)]">
                <div className="absolute inset-[8px] z-0 flex min-h-0 flex-col overflow-hidden rounded-md border border-primary-100/70 bg-gradient-to-b from-primary-50/95 via-white to-secondary-50/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)] min-[480px]:inset-[10px]">
                  <p className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-right text-xs leading-relaxed text-neutral-700 min-[480px]:px-5 min-[480px]:py-4 sm:px-6 sm:text-sm">
                    {item.description}
                  </p>
                </div>
                <div dir="ltr" className="absolute inset-[3px] z-10 flex overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                  <div
                    className={`relative h-full w-1/2 shrink-0 overflow-hidden border-r border-teal-950/50 transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? '-translate-x-full brightness-[1.03]' : 'translate-x-0'}`}
                    style={{
                      background:
                        'linear-gradient(135deg, #0f766e 0%, #115e59 38%, #134e4a 72%, #042f2e 100%)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -8px 24px rgba(0,0,0,0.35), inset 3px 0 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.14]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 5px)',
                      }}
                    />
                    <div className="pointer-events-none absolute inset-y-4 right-0 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent" />
                    <div
                      className="absolute right-2 top-[42%] h-8 w-2 rounded-full border border-amber-900/40 bg-gradient-to-b from-amber-100 via-amber-400 to-amber-800 shadow-[2px_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]"
                      aria-hidden
                    />
                  </div>
                  <div
                    className={`relative h-full w-1/2 shrink-0 overflow-hidden border-l border-teal-950/50 transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-full brightness-[1.03]' : 'translate-x-0'}`}
                    style={{
                      background:
                        'linear-gradient(225deg, #0f766e 0%, #115e59 38%, #134e4a 72%, #042f2e 100%)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -8px 24px rgba(0,0,0,0.35), inset -3px 0 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.14]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 5px)',
                      }}
                    />
                    <div className="pointer-events-none absolute inset-y-4 left-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    <div
                      className="absolute left-2 top-[42%] h-8 w-2 rounded-full border border-amber-900/40 bg-gradient-to-b from-amber-100 via-amber-400 to-amber-800 shadow-[2px_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p
            className={`mt-3 text-center text-xs transition-colors ${open ? 'text-primary-600/80' : 'text-neutral-500'}`}
          >
            {hoverMode ? 'העברו את העכבר לפתיחה' : 'לחצו על הדלת לפתיחה ולסגירה'}
          </p>
        </div>
      </div>
    </AnimatedSection>
  )
}

function HomePage() {
  const forWhomHoverMode = useForWhomHoverMode()
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
              className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-y-10 gap-x-10 px-3 sm:px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-x-28 md:gap-y-12 md:px-6 lg:gap-x-36 lg:px-8 xl:gap-x-44 2xl:gap-x-52"
              dir="ltr"
            >
            <div className="order-2 flex w-full justify-center md:order-1 md:justify-start">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 -inset-3 motion-reduce:will-change-auto motion-reduce:animate-none will-change-transform animate-spin-slow rounded-full sm:-inset-5 md:-inset-8">
                  <div className="absolute inset-0 rounded-full border-[4px] border-primary-700/80 bg-primary-900/10 sm:border-[6px] md:border-[10px]" />
                  <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-primary-800 shadow-md sm:h-4 sm:w-4 md:h-6 md:w-6" />
                  <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary-800 shadow-md sm:h-4 sm:w-4 md:h-6 md:w-6" />
                  <div className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary-800 shadow-md sm:h-4 sm:w-4 md:h-6 md:w-6" />
                  <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary-800 shadow-md sm:h-4 sm:w-4 md:h-6 md:w-6" />
                </div>
                <img
                  src={yanivImage}
                  alt="יניב תנעמי"
                  className="relative z-[1] h-40 w-40 rounded-full border-2 border-white object-cover shadow-2xl sm:h-56 sm:w-56 sm:border-4 md:h-80 md:w-80"
                />
              </div>
            </div>

            <div className="order-2 min-w-0 max-w-4xl w-full md:order-2">
              <div
                className="mx-auto min-w-0 w-full max-w-4xl rounded-2xl border border-white/50 bg-white/90 p-5 shadow-xl sm:bg-white/88 sm:p-7 md:ml-auto md:mr-0 lg:max-w-3xl lg:p-10"
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
                להלן <strong className="font-semibold text-neutral-800">שמונה פרופילים שכיחים</strong>
                . בכל כרטיס תמצאו נתונים, תיאור של ה«כאב» האופייני, ומידע על מוכנות לשינוי.
              </p>
              <p className="text-sm leading-relaxed text-neutral-500 sm:text-base md:text-lg">
                <span className="font-medium text-neutral-600">איך לפתוח?</span>{' '}
                במחשב — העבירו את העכבר מעל הדלת. בטלפון — לחצו על הדלת כדי לפתוח או לסגור.
              </p>
            </div>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 sm:gap-8 md:gap-10 xl:gap-8">
          {[
            {
              title: 'מנהלים ושכירים בכירים — שחיקה (Burnout)',
              description:
                'נתונים: בני 35–52, הכנסה של כ־25,000–45,000 ₪ ברוטו. הכאב: «הכלוב המצופה בזהב» — יש כסף ומעמד, אבל המוח בסטרס כרוני, עם פגיעה בבריאות וביחסים בבית. מוכנות לשינוי: גבוהה מאוד — הרגשה שזה «עכשיו או התקף לב».',
            },
            {
              title: 'הורים לצעירים (22–32) — «תקועים» בבית',
              description:
                'נתונים: הורים בני 50–65, מעמד בינוני–גבוה. הכאב: דאגה קיומית לעתיד הילד, עייפות מלכלכל אותו, ותחושת כישלון בהורות. מוכנות לשינוי: גבוהה — מוכנים לשלם כדי «לקנות» לילד עצמאות.',
            },
            {
              title: 'יזמים ובעלי עסקים — תקרת זכוכית',
              description:
                'נתונים: עסקים קטנים–בינוניים, מחזור שנתי בערך 1–5 מיליון ₪. הכאב: העסק מנהל אותם; תקיעות במצב תפעולי־הישרדותי, בלי צמיחה ובלי מקום למשפחה. מוכנות לשינוי: גבוהה — רואים בליווי השקעה עסקית עם ROI ברור.',
            },
            {
              title: 'זוגות במשבר אמצע הדרך — לפני פירוק',
              description:
                'נתונים: נשואים 10–20 שנה, הורים לילדים. הכאב: חוסר תקשורת, בדידות בתוך הקשר, ותחושה ש«זה לא יכול להמשיך ככה» — לצד פחד מגירושין. מוכנות לשינוי: גבוהה מאוד — האלטרנטיבה יקרה וכואבת בהרבה.',
            },
            {
              title: 'כוחות ביטחון ומילואים — מעבר לאזרחות',
              description:
                'נתונים: יוצאי קבע ארוך או מילואים ממושכים, כולל אחרי אירועי 2023–2025. הכאב: קושי במציאת זהות חדשה, דריכות יתר (מוח הישרדותי) וחוסר סנכרון עם השקט האזרחי. מוכנות לשינוי: גבוהה — חיפוש אחר משמעות וריבונות מחדש.',
            },
            {
              title: 'נשים בקריירה שנייה — פוסט־אימהות',
              description:
                'נתונים: נשים בנות 40+, אחרי שהילדים גדלו קצת. הכאב: תחושת החמצה, רצון למימוש עצמי ושליחות, אבל פחד מחוסר יציבות או מ«מה יגידו». מוכנות לשינוי: בינונית–גבוהה — צורך רגשי עז בשינוי.',
            },
            {
              title: 'רווקים ורווקות — חיפוש זוגיות מתמשך',
              description:
                'נתונים: בני 30–45, מצליחים מקצועית, בערים הגדולות. הכאב: «למה כולם מצליחים ואני לא?» — דפוסים חוזרים של חרדת נטישה או הימנעות (חיווט שמקשה על קשר). מוכנות לשינוי: גבוהה — תסכול מצטבר מאפליקציות ומבדידות.',
            },
            {
              title: 'צעירים High Potentials — איבוד כיוון (Lost 20s)',
              description:
                'נתונים: בני 22–28, אינטליגנציה גבוהה, ללא תואר או מקצוע יציב. הכאב: FOMO, חוסר יכולת להתחייב למסלול אחד, והרגשה שהחיים עוברים לידם. מוכנות לשינוי: גבוהה — רצון «להתניע» מהצד של המטופל.',
            },
          ].map((item, index) => (
            <ForWhomAudienceCard key={item.title} item={item} index={index} hoverMode={forWhomHoverMode} />
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

