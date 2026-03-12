import { Link } from 'react-router-dom'
import { useContact } from '../context/ContactContext'

function Footer() {
  const currentYear = new Date().getFullYear()
  const { openContactModal } = useContact()

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto relative" style={{ zIndex: 10 }}>
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* About Section */}
          <div>
            <h3 className="text-white text-xl font-serif font-semibold mb-4">
              ריפוי והגשמה
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              מסע משותף אל עבר שחרור מחסימות רגשיות, ריפוי מטראומות והגשמה עצמית.
              כאן, במקום בטוח ומכיל, נוכל להתחיל את הדרך שלך.
            </p>
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
                  to="/anxiety"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  טיפול בחרדות
                </Link>
              </li>
              <li>
                <Link
                  to="/trauma"
                  className="text-neutral-400 hover:text-primary-400 transition-colors"
                >
                  טיפול בפוסט טראומה
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
                  href="tel:+972501234567"
                  className="text-neutral-400 hover:text-primary-400 transition-colors flex items-center space-x-reverse space-x-2"
                >
                  <span>📞</span>
                  <span>050-123-4567</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@healing-fulfillment.co.il"
                  className="text-neutral-400 hover:text-primary-400 transition-colors flex items-center space-x-reverse space-x-2"
                >
                  <span>✉️</span>
                  <span>info@healing-fulfillment.co.il</span>
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

