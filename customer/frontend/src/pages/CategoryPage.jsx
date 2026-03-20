import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { categoriesService } from '../services/categoriesApi'
import { usePurchase } from '../context/PurchaseContext'
import Section from '../components/Section'
import AnimatedSection from '../components/AnimatedSection'
import Card from '../components/Card'
import Button from '../components/Button'
import VideoCard from '../components/VideoCard'
import { getVideoEmbedUrl } from '../utils/videoUtils'

function CategoryPage() {
  const { id } = useParams()
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const { openPurchaseModal } = usePurchase()
  const [showMainVideo, setShowMainVideo] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadCategory()
  }, [id])

  const loadCategory = async () => {
    setLoading(true)
    try {
      console.log('Loading category with ID:', id)
      const response = await categoriesService.getById(id)
      console.log('Category response:', response)
      const categoryData = response.data.category
      
      // Ensure arrays are properly formatted
      if (categoryData) {
        // Normalize symptoms
        if (categoryData.symptoms) {
          if (typeof categoryData.symptoms === 'string' && categoryData.symptoms.trim() !== '') {
            categoryData.symptoms = [categoryData.symptoms]
          } else if (!Array.isArray(categoryData.symptoms)) {
            categoryData.symptoms = []
          }
        } else {
          categoryData.symptoms = []
        }
        
        // Normalize copingMethods
        if (categoryData.copingMethods) {
          if (typeof categoryData.copingMethods === 'string' && categoryData.copingMethods.trim() !== '') {
            categoryData.copingMethods = [categoryData.copingMethods]
          } else if (!Array.isArray(categoryData.copingMethods)) {
            categoryData.copingMethods = []
          }
        } else {
          categoryData.copingMethods = []
        }
        
        // Normalize therapeuticApproach
        if (categoryData.therapeuticApproach) {
          if (typeof categoryData.therapeuticApproach === 'string' && categoryData.therapeuticApproach.trim() !== '') {
            categoryData.therapeuticApproach = [categoryData.therapeuticApproach]
          } else if (!Array.isArray(categoryData.therapeuticApproach)) {
            categoryData.therapeuticApproach = []
          }
        } else {
          categoryData.therapeuticApproach = []
        }
      }
      
      console.log('Category loaded:', categoryData)
      setCategory(categoryData)
    } catch (error) {
      console.error('Error loading category:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-neutral-600">טוען...</p>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">טיפול לא נמצא</h1>
          <Link to="/courses" className="text-primary-600 hover:text-primary-700">
            חזור למסלולים →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{category.name} | מסלולי טיפול</title>
        <meta name="description" content={category.description || `גלה את המסלולים והסרטונים בטיפול ${category.name}`} />
      </Helmet>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08),transparent_50%)]"></div>
        <div className="container-custom relative z-10">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100/80 backdrop-blur-sm text-primary-700 text-sm font-medium border border-primary-200/50">
                  טיפול מותאם אישית
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-neutral-900 mb-8 leading-tight tracking-tight">
                {category.name}
              </h1>
            </div>
            
            {/* Main Video - Large, between title and description */}
            {category.videos && category.videos.length > 0 && (
              <div className="max-w-5xl mx-auto mb-8 px-4">
                {(() => {
                  const mainVideo = category.videos[0]
                  const embedUrl = getVideoEmbedUrl(mainVideo.url)
                  return embedUrl && showMainVideo ? (
                    <div className="aspect-video bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl">
                      <iframe
                        src={embedUrl}
                        title={mainVideo.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div 
                      className="relative aspect-video bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl overflow-hidden shadow-2xl cursor-pointer group hover:shadow-3xl transition-all duration-300"
                      onClick={() => embedUrl ? setShowMainVideo(true) : window.open(mainVideo.url, '_blank')}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                          <span className="text-4xl text-primary-600 ml-2">▶</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                  )
                })()}
              </div>
            )}
            
            <div className="max-w-4xl mx-auto text-center">
              {category.description && (
                <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed max-w-3xl mx-auto font-light">
                  {category.description}
                </p>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Additional Videos - Only show if there are more than 1 video */}
      {category.videos && category.videos.length > 1 && (
        <Section variant="white">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 mb-6 shadow-lg shadow-blue-100/50">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 tracking-tight">
                  סרטונים נוספים
                </h2>
                <p className="text-neutral-600 text-lg md:text-xl max-w-2xl mx-auto font-light">
                  סרטונים מקצועיים נוספים שיעזרו לך להבין את התהליך הטיפולי
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.videos.slice(1).map((video, idx) => (
                  <AnimatedSection key={idx + 1} delay={idx * 0.1}>
                    <VideoCard video={video} delay={idx * 0.1} />
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </Section>
      )}

      {/* Category Videos (Uploaded Files) - Also moved after title */}
      {category.files && category.files.length > 0 && (
        <Section variant="neutral">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 mb-6 shadow-lg shadow-indigo-100/50">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 tracking-tight">
                  סרטונים שהועלו
                </h2>
                <p className="text-neutral-600 text-lg md:text-xl max-w-2xl mx-auto font-light">
                  תוכן וידאו נוסף זמין לצפייה
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.files.map((file, idx) => (
                  <AnimatedSection key={idx} delay={idx * 0.1}>
                    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                      <div>
                        <div className="mb-4 relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden aspect-video shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                          <video
                            src={file.url}
                            controls
                            className="w-full h-full"
                            preload="metadata"
                          >
                            הדפדפן שלך לא תומך בהצגת וידאו.
                          </video>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h3 className="font-semibold text-neutral-900 mb-2 text-lg group-hover:text-primary-600 transition-colors">
                          {file.name}
                        </h3>
                        <p className="text-sm text-neutral-500 mb-4 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'גודל לא ידוע'}
                        </p>
                        {file.url && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 font-medium group-hover:gap-3 transition-all"
                          >
                            צפה בסרטון
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </Section>
      )}

      {/* Symptoms Section */}
      {category.symptoms && Array.isArray(category.symptoms) && category.symptoms.length > 0 && (
        <Section variant="white">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 mb-6 shadow-lg shadow-purple-100/50">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 tracking-tight">
                  סימפטומים נפוצים
                </h2>
                <p className="text-neutral-600 text-lg md:text-xl max-w-2xl mx-auto font-light">
                  סימפטומים שיכולים להצביע על הצורך בטיפול מקצועי
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.symptoms.map((symptom, idx) => (
                  <AnimatedSection key={idx} delay={idx * 0.06}>
                    <div className="group relative bg-white rounded-2xl p-6 border border-neutral-200/60 hover:border-primary-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-primary-100/50 hover:-translate-y-1">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white text-sm font-bold">{idx + 1}</span>
                          </div>
                          <p className="text-neutral-700 text-base leading-relaxed flex-1 pt-1.5 font-medium group-hover:text-neutral-900 transition-colors">
                            {symptom}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </Section>
      )}

      {/* Coping Methods Section */}
      {category.copingMethods && Array.isArray(category.copingMethods) && category.copingMethods.length > 0 && (
        <Section variant="primary">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/90 backdrop-blur-sm mb-6 shadow-xl shadow-primary-200/30">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 tracking-tight">
                  דרכי התמודדות
                </h2>
                <p className="text-neutral-700 text-lg md:text-xl max-w-2xl mx-auto font-light">
                  כלים וטכניקות מעשיות שיעזרו לך להתמודד ולהתקדם
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.copingMethods.map((method, idx) => (
                  <AnimatedSection key={idx} delay={idx * 0.06}>
                    <div className="group relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/60 hover:border-primary-200/80 shadow-lg shadow-primary-100/20 hover:shadow-2xl hover:shadow-primary-200/30 transition-all duration-500 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/0 to-primary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-neutral-700 text-base leading-relaxed flex-1 pt-2 font-medium group-hover:text-neutral-900 transition-colors">
                          {method}
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </Section>
      )}

      {/* Therapeutic Approach Section */}
      {category.therapeuticApproach && Array.isArray(category.therapeuticApproach) && category.therapeuticApproach.length > 0 && (
        <Section variant="white">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 mb-6 shadow-lg shadow-emerald-100/50">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-4 tracking-tight">
                  הגישה הטיפולית שלי
                </h2>
                <p className="text-neutral-600 text-lg md:text-xl max-w-2xl mx-auto font-light">
                  העקרונות והגישה שמנחים את העבודה הטיפולית שלנו יחד
                </p>
              </div>
              <div className="space-y-5">
                {category.therapeuticApproach.map((approach, idx) => (
                  <AnimatedSection key={idx} delay={idx * 0.08}>
                    <div className="group relative bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/50 rounded-2xl p-7 border border-emerald-100/60 hover:border-emerald-300/60 shadow-lg shadow-emerald-50/30 hover:shadow-xl hover:shadow-emerald-100/40 transition-all duration-500 hover:-translate-y-0.5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative flex items-start gap-5">
                        <div className="flex-shrink-0 relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            {idx + 1}
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl opacity-20 blur group-hover:opacity-30 transition-opacity duration-300"></div>
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <p className="text-neutral-700 text-lg md:text-xl leading-relaxed font-medium group-hover:text-neutral-900 transition-colors pr-4">
                            {approach}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </Section>
      )}


      {/* CTA Section */}
      <Section variant="primary">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-neutral-900 mb-6 leading-tight">
                {category.purchaseCTA || 'מוכן להתחיל את המסע?'}
              </h2>
              <p className="text-2xl text-neutral-700 mb-12 max-w-4xl mx-auto leading-relaxed">
                פגישת ההיכרות הראשונה היא הזדמנות להכיר, להבין מה אתה מחפש, ולראות אם אנחנו מתאימים לעבוד יחד. ללא התחייבות, רק שיחה פתוחה וכנה.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={() => openPurchaseModal()}
                  className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-all duration-300 font-semibold text-3xl"
                >
                  רכוש מסלול
                </button>
                <Link
                  to="/booking"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 transition-all duration-300 font-semibold text-3xl"
                >
                  קבע פגישת היכרות
                </Link>
                <a
                  href="https://wa.me/972526264507"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-2xl bg-transparent text-primary-600 border-4 border-primary-500 hover:bg-primary-50 transition-all duration-300 font-semibold text-3xl"
                >
                  שלח הודעה ב-WhatsApp
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </Section>

    </>
  )
}

export default CategoryPage

