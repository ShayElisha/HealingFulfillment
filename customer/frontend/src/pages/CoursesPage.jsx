import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { coursesService } from '../services/coursesApi'
import { usePurchase } from '../context/PurchaseContext'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'

function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const { openPurchaseModal } = usePurchase()

  useEffect(() => {
    window.scrollTo(0, 0)
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await coursesService.getAll()
      setCourses(response.data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseClick = (course) => {
    openPurchaseModal(course)
  }

  return (
    <>
      <Helmet>
        <title>מסלולי טיפול | קורסים וסרטונים</title>
        <meta
          name="description"
          content="גלה את המסלולים שלנו - סרטונים מקצועיים, תרגילים מעשיים ותהליכי ריפוי מותאמים אישית."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 mb-6">
                מסלולי טיפול
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                סרטונים מקצועיים, תרגילים מעשיים ותהליכי ריפוי מותאמים אישית.
                בחר את המסלול שמתאים לך.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* All Courses */}
      <Section variant="white">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">טוען מסלולים...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-lg">
              אין מסלולים זמינים כרגע. בדוק שוב מאוחר יותר.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <AnimatedSection key={course._id} delay={index * 0.1}>
                <Card>
                  <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-3">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                  )}
                  {course.sessionsCount && (
                    <div className="mb-4">
                      <p className="text-sm text-neutral-500 mb-2">
                        <span className="text-primary-600 font-medium">{course.sessionsCount}</span> מפגש{course.sessionsCount > 1 ? 'ים' : ''}
                        {(() => {
                          const n = course.installmentsCount ?? 1
                          return (
                            <span className="mr-1">
                              {' '}
                              · {n} {n === 1 ? 'תשלום' : 'תשלומים'}
                            </span>
                          )
                        })()}
                      </p>
                    </div>
                  )}
                  {course.price > 0 && (() => {
                    // price is the full price, discounted price is calculated from it
                    let originalPrice = course.originalPrice || course.price
                    let discountPercent = course.discount || 0
                    let discountedPrice = course.price
                    
                    if (course.discount && course.discount > 0) {
                      discountPercent = course.discount
                      // Calculate discounted price: discountedPrice = price * (1 - discount/100)
                      discountedPrice = Math.round(course.price * (1 - course.discount / 100))
                      originalPrice = course.price
                    } else if (course.originalPrice && course.originalPrice > course.price) {
                      // If originalPrice is set and greater than price, use it
                      originalPrice = course.originalPrice
                      discountedPrice = course.price
                      discountPercent = Math.round(((originalPrice - course.price) / originalPrice) * 100)
                    }
                    
                    const hasDiscount = discountPercent > 0 && originalPrice > discountedPrice
                    
                    return (
                      <div className="mb-4">
                        {hasDiscount ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg text-neutral-400 line-through">
                                ₪{originalPrice}
                              </span>
                              <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                {discountPercent}% הנחה
                              </span>
                            </div>
                            <span className="text-2xl font-bold text-primary-600">
                              ₪{discountedPrice}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-primary-600">
                            ₪{course.price}
                          </span>
                        )}
                      </div>
                    )
                  })()}
                  <Button
                    variant="primary"
                    onClick={() => handlePurchaseClick(course)}
                    className="w-full"
                  >
                    רכוש מסלול
                  </Button>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        )}
      </Section>

      {/* CTA Section */}
      <Section variant="primary">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900 mb-6">
              יש לך שאלות?
            </h2>
            <p className="text-xl text-neutral-700 mb-8">
              אנחנו כאן כדי לעזור. צור קשר לקבלת מידע נוסף על המסלולים.
            </p>
            <Button to="/contact" variant="primary">
              צור קשר
            </Button>
          </AnimatedSection>
        </div>
      </Section>

    </>
  )
}

export default CoursesPage

