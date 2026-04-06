import { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import WhatsAppButton from '../components/WhatsAppButton'
import QuestionnaireModal from '../components/QuestionnaireModal'

function Layout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header isScrolled={isScrolled} />
      <button
        type="button"
        onClick={() => setQuestionnaireOpen(true)}
        className="fixed start-4 top-24 z-[45] rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 md:top-28 md:px-5 md:py-3 md:text-base"
      >
        שאלון התאמה
      </button>
      <QuestionnaireModal isOpen={questionnaireOpen} onClose={() => setQuestionnaireOpen(false)} />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default Layout

