import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { blogService } from '../services/api'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'

function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await blogService.getAll()
      setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
      // Fallback to static posts if API fails
      setPosts(staticPosts)
    } finally {
      setLoading(false)
    }
  }

  const staticPosts = [
    {
      _id: '1',
      title: 'איך מתמודדים עם התקף חרדה?',
      excerpt:
        'התקף חרדה יכול להרגיש כמו סכנה אמיתית, אבל יש כלים מעשיים שיכולים לעזור לך להתמודד איתו. במאמר זה נחקור טכניקות שונות להרגעה וניהול חרדות.',
      slug: 'how-to-deal-with-anxiety-attack',
      createdAt: new Date('2024-01-15'),
    },
    {
      _id: '2',
      title: 'סימפטומים של פוסט טראומה – מה צריך לדעת',
      excerpt:
        'פוסט טראומה יכולה להתבטא בדרכים שונות. במאמר זה נסקור את הסימפטומים העיקריים, ונראה איך לזהות אותם אצל עצמך או אצל אדם קרוב.',
      slug: 'ptsd-symptoms',
      createdAt: new Date('2024-01-10'),
    },
    {
      _id: '3',
      title: 'למה אנחנו נשארים תקועים רגשית?',
      excerpt:
        'תקיעות רגשית היא לא גזר דין. במאמר זה נבין מה גורם לנו להישאר תקועים, ואיך אפשר להתחיל לזוז קדימה.',
      slug: 'why-we-stay-emotionally-stuck',
      createdAt: new Date('2024-01-05'),
    },
    {
      _id: '4',
      title: 'איך לשחרר טראומה מהגוף',
      excerpt:
        'טראומה לא נשארת רק בנפש – היא נשארת גם בגוף. במאמר זה נחקור דרכים לשחרר את הטראומה מהגוף ולחזור לחיים מלאים.',
      slug: 'how-to-release-trauma-from-body',
      createdAt: new Date('2023-12-28'),
    },
    {
      _id: '5',
      title: 'תהליכי הגשמה עצמית – איפה מתחילים?',
      excerpt:
        'הגשמה עצמית היא לא יעד, אלא מסע. במאמר זה נבין מה זה אומר עבורך, ואיך להתחיל את המסע הזה.',
      slug: 'self-fulfillment-process',
      createdAt: new Date('2023-12-20'),
    },
    {
      _id: '6',
      title: 'טכניקות הרגעה לחרדות',
      excerpt:
        'כשהחרדה מתחילה, יש כלים מעשיים שיכולים לעזור. במאמר זה נכיר טכניקות שונות להרגעה – מנשימה ועד מדיטציה.',
      slug: 'relaxation-techniques-for-anxiety',
      createdAt: new Date('2023-12-15'),
    },
    {
      _id: '7',
      title: 'הקשר בין גוף ונפש בטיפול בטראומה',
      excerpt:
        'הגוף והנפש קשורים זה לזה בקשר עמוק. במאמר זה נבין איך הטראומה משפיעה על הגוף, ואיך העבודה עם הגוף יכולה לעזור בריפוי.',
      slug: 'body-mind-connection-trauma',
      createdAt: new Date('2023-12-10'),
    },
    {
      _id: '8',
      title: 'דפוסי מחשבה שמזינים חרדות',
      excerpt:
        'המחשבות שלנו יכולות להזין את החרדות או לעזור לנו להתמודד איתן. במאמר זה נזהה דפוסי מחשבה שמזינים חרדות, ונלמד דרכים חדשות לחשוב.',
      slug: 'thought-patterns-that-feed-anxiety',
      createdAt: new Date('2023-12-05'),
    },
    {
      _id: '9',
      title: 'יצירת מרחב בטוח בטיפול',
      excerpt:
        'מרחב בטוח הוא הבסיס לכל תהליך טיפולי. במאמר זה נבין מה זה אומר, ואיך יוצרים מרחב כזה.',
      slug: 'creating-safe-space-in-therapy',
      createdAt: new Date('2023-11-28'),
    },
    {
      _id: '10',
      title: 'מתי זה הזמן לפנות לטיפול?',
      excerpt:
        'לפעמים קשה לדעת מתי זה הזמן הנכון לפנות לטיפול. במאמר זה נעזור לך להבין אם זה הזמן שלך.',
      slug: 'when-is-the-right-time-for-therapy',
      createdAt: new Date('2023-11-20'),
    },
  ]

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      <Helmet>
        <title>בלוג | מאמרים על חרדות, טראומה והגשמה עצמית</title>
        <meta
          name="description"
          content="מאמרים מקצועיים על טיפול בחרדות, פוסט טראומה, שחרור חסימות רגשיות ותהליכי הגשמה עצמית."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                בלוג
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                מאמרים, תובנות וכלים מעשיים על טיפול, ריפוי וצמיחה אישית.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Posts Grid */}
      <Section variant="white">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">טוען...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <AnimatedSection key={post._id} delay={index * 0.1}>
                <Card>
                  <div className="mb-4">
                    <span className="text-sm text-neutral-500">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-3">
                    {post.title}
                  </h2>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <Link
                    to={`/blog/${post.slug}`}
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
    </>
  )
}

export default BlogPage

