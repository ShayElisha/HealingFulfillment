import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoriesService } from '../services/categoriesApi'

function CategoriesDropdown({ isOpen, onClose }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const response = await categoriesService.getAll()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay - only on desktop */}
      <div
        className="hidden md:block fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown Menu */}
      <div className="relative md:absolute md:top-full md:right-0 md:mt-2 w-full md:w-80 bg-white rounded-2xl shadow-soft-lg z-50 max-h-[60vh] md:max-h-[80vh] overflow-y-auto border border-neutral-200 md:border-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-serif font-bold text-neutral-900">
              טיפולים ומסלולים
            </h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">טוען...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600 text-sm">
                אין טיפולים זמינים
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category._id} className="border-b border-neutral-100 last:border-0 pb-2 last:pb-0">
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/category/${category._id}`}
                      onClick={onClose}
                      className="flex-1 text-right p-2 hover:bg-neutral-50 rounded-lg transition-colors font-semibold text-primary-600 hover:text-primary-700"
                    >
                      {category.name}
                    </Link>
                    <button
                      onClick={() => toggleCategory(category._id)}
                      className="p-2 hover:bg-neutral-50 rounded-lg transition-colors"
                    >
                      <span className="text-neutral-400">
                        {expandedCategory === category._id ? '▲' : '▼'}
                      </span>
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {expandedCategory === category._id && (
                    <div className="mr-4 mt-2 space-y-3">
                      {/* Category Videos */}
                      {category.videos && category.videos.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-neutral-700 mb-2">
                            סרטוני הטיפול:
                          </h4>
                          <div className="space-y-1">
                            {category.videos.map((video, idx) => (
                              <a
                                key={idx}
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-primary-600 hover:text-primary-700 p-2 rounded hover:bg-primary-50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-primary-500 mr-1">▶</span>
                                {video.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Link to full category page */}
                      <Link
                        to={`/category/${category._id}`}
                        onClick={onClose}
                        className="block text-sm text-primary-600 hover:text-primary-700 font-medium p-2 rounded hover:bg-primary-50 transition-colors text-center border-t border-neutral-100 mt-2 pt-2"
                      >
                        צפה בדף הטיפול המלא →
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Treatment Pages Links */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-700 mb-2">
              דפי טיפול:
            </h4>
            <div className="space-y-1">
              <Link
                to="/anxiety"
                onClick={onClose}
                className="block text-sm text-neutral-700 hover:text-primary-600 p-2 rounded hover:bg-neutral-50 transition-colors"
              >
                טיפול בחרדות
              </Link>
              <Link
                to="/trauma"
                onClick={onClose}
                className="block text-sm text-neutral-700 hover:text-primary-600 p-2 rounded hover:bg-neutral-50 transition-colors"
              >
                טיפול בפוסט טראומה
              </Link>
              <Link
                to="/treatments"
                onClick={onClose}
                className="block text-sm text-neutral-700 hover:text-primary-600 p-2 rounded hover:bg-neutral-50 transition-colors"
              >
                כל סוגי הטיפולים
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CategoriesDropdown

