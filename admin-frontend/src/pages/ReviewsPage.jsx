import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewService } from '../services/adminApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function ReviewsPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await reviewService.getAll()
      const reviewsData = response?.data || []
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('שגיאה בטעינת הביקורות')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (reviewId, newStatus) => {
    try {
      await reviewService.updateStatus(reviewId, newStatus)
      toast.success(`ביקורת ${newStatus === 'approved' ? 'אושרה' : newStatus === 'rejected' ? 'נדחתה' : 'הועברה למצב ממתין'}`)
      await loadReviews()
    } catch (error) {
      console.error('Error updating review status:', error)
      toast.error('שגיאה בעדכון סטטוס הביקורת')
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (filterStatus === 'all') return true
    return review.status === filterStatus
  })

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length
  }

  return (
    <>
      <Navbar activeTab="reviews" onTabChange={() => {}} purchasesCount={0} bookingsCount={0} customersCount={0} contactsCount={0} />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              ← חזור לדף הראשי
            </button>
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
              ניהול ביקורות
            </h1>
            <p className="text-neutral-600">אשר או דחה ביקורות לקוחות</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">סה"כ ביקורות</h3>
              <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">ממתינות לאישור</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">מאושרות</h3>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">נדחות</h3>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-neutral-700">סטטוס</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg"
            >
              <option value="all">הכל</option>
              <option value="pending">ממתין לאישור</option>
              <option value="approved">מאושר</option>
              <option value="rejected">נדחה</option>
            </select>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">טוען ביקורות...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">
                {reviews.length === 0 ? 'אין ביקורות עדיין' : 'אין ביקורות התואמות לסינון'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review._id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {review.customerName || review.customer?.name || 'לקוח'}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          review.status === 'approved' ? 'bg-green-100 text-green-700' :
                          review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {review.status === 'approved' ? 'מאושר' :
                           review.status === 'rejected' ? 'נדחה' :
                           'ממתין לאישור'}
                        </span>
                      </div>
                      
                      {/* Rating */}
                      <div className="mb-3">
                        <div className="flex text-accent-500 text-xl">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>{star <= review.rating ? '⭐' : '☆'}</span>
                          ))}
                        </div>
                        <span className="text-sm text-neutral-600 ml-2">
                          {review.rating} {review.rating === 1 ? 'כוכב' : 'כוכבים'}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-neutral-700 leading-relaxed mb-3 whitespace-pre-wrap">
                        {review.content}
                      </p>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                        <span>📅 {new Date(review.createdAt).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        {review.customer && (
                          <button
                            onClick={() => navigate(`/customer/${review.customer._id || review.customer}`)}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            👤 פתח תיק לקוח
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {review.status === 'pending' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleStatusUpdate(review._id, 'approved')}
                          variant="primary"
                          className="text-sm px-4 py-2"
                        >
                          ✅ אישר
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('האם אתה בטוח שברצונך לדחות את הביקורת?')) {
                              handleStatusUpdate(review._id, 'rejected')
                            }
                          }}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          ❌ דחה
                        </Button>
                      </div>
                    )}
                    {review.status === 'approved' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleStatusUpdate(review._id, 'pending')}
                          variant="soft"
                          className="text-sm px-4 py-2"
                        >
                          🔄 החזר לממתין
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('האם אתה בטוח שברצונך לדחות את הביקורת?')) {
                              handleStatusUpdate(review._id, 'rejected')
                            }
                          }}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          ❌ דחה
                        </Button>
                      </div>
                    )}
                    {review.status === 'rejected' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          onClick={() => handleStatusUpdate(review._id, 'approved')}
                          variant="primary"
                          className="text-sm px-4 py-2"
                        >
                          ✅ אישר
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate(review._id, 'pending')}
                          variant="soft"
                          className="text-sm px-4 py-2"
                        >
                          🔄 החזר לממתין
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ReviewsPage

