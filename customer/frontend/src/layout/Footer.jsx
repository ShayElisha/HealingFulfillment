import { Link } from 'react-router-dom'
import { useContact } from '../context/ContactContext'
import logoImage from '../assets/IMG_1562-Photoroom.png'

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

function Footer() {
  const currentYear = new Date().getFullYear()
  const { openContactModal } = useContact()

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto relative" style={{ zIndex: 10 }}>
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* About Section */}
          <div>
            <div className="mb-4">
              <img
                src={logoImage}
                alt="יניב תנעמי"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h3 className="text-white text-xl font-serif font-semibold mb-4">
              ריפוי והגשמה
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              מסע משותף אל עבר שחרור מחסימות רגשיות, ריפוי מטראומות והגשמה עצמית.
              כאן, במקום בטוח ומכיל, נוכל להתחיל את הדרך שלך.
            </p>
            <div className="mt-4 flex items-center gap-3" aria-label="רשתות חברתיות">
              {SOCIAL_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition-colors hover:border-primary-400 hover:text-primary-400"
                >
                  <SocialIcon label={item.label} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">קישורים מהירים</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  אודות
                </Link>
              </li>
              <li>
                <Link
                  to="/treatments"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  סוגי טיפולים
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  מסלולים
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  צור קשר
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">צור קשר</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+972526264507"
                  className="text-neutral-400 hover:text-primary-400 transition-colors flex items-center space-x-reverse space-x-2"
                >
                  <span>📞</span>
                  <span>052-6264507</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:yaniv@elatzmi.com"
                  className="text-neutral-400 hover:text-primary-400 transition-colors flex items-center space-x-reverse space-x-2"
                >
                  <span>✉️</span>
                  <span>yaniv@elatzmi.com</span>
                </a>
              </li>
              <li>
                <button
                  onClick={openContactModal}
                  className="text-primary-400 hover:text-primary-300 transition-colors inline-block mt-2 text-right"
                >
                  שלח הודעה ←
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-500 text-sm">
            © {currentYear} ריפוי והגשמה. כל הזכויות שמורות.
          </p>
          <div className="flex space-x-reverse space-x-4 mt-4 md:mt-0">
            <Link
              to="/contact"
              className="text-neutral-500 hover:text-primary-400 text-sm transition-colors"
            >
              מדיניות פרטיות
            </Link>
            <span className="text-neutral-600">|</span>
            <Link
              to="/contact"
              className="text-neutral-500 hover:text-primary-400 text-sm transition-colors"
            >
              תנאי שימוש
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

