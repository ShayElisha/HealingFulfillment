import { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import WhatsAppButton from '../components/WhatsAppButton'

function Layout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header isScrolled={isScrolled} />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default Layout

