import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewService } from '../services/adminApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import AdminPager from '../components/AdminPager'
import toast from 'react-hot-toast'

const REVIEWS_PAGE_SIZE = 50

function ReviewsPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [listSummary, setListSummary] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    setPage(1)
  }, [filterStatus])

  useEffect(() => {
    loadReviews()
  }, [page, filterStatus])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const response = await reviewService.getAll({
        page,
        limit: REVIEWS_PAGE_SIZE,
        ...(filterStatus !== 'all' ? { reviewStatus: filterStatus } : {}),
      })
      const reviewsData = response?.data || []
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])
      setPagination(response?.pagination || null)
      setListSummary(response?.summary || null)
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

  const handleDeleteVideo = async (reviewId) => {
    const confirmed = window.confirm('האם למחוק את הסרטון מהביקורת? הפעולה תמחק גם מהענן.')
    if (!confirmed) return
    try {
      await reviewService.deleteVideo(reviewId)
      toast.success('הסרטון נמחק מהביקורת')
      await loadReviews()
    } catch (error) {
      console.error('Error deleting review video:', error)
      toast.error(error.response?.data?.message || 'שגיאה במחיקת הסרטון')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm('האם למחוק את הביקורת? אם קיים סרטון, הוא יימחק גם מהענן.')
    if (!confirmed) return
    try {
      await reviewService.deleteReview(reviewId)
      toast.success('הביקורת נמחקה בהצלחה')
      await loadReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error(error.response?.data?.message || 'שגיאה במחיקת הביקורת')
    }
  }

  const stats = listSummary || {
    total: pagination?.total ?? reviews.length,
    pending: 0,
    approved: 0,
    rejected: 0,
  }

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader title="ניהול ביקורות" subtitle="אשר או דחה ביקורות לקוחות" />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">סה"כ ביקורות</h3>
              <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">ממתינות לאישור</h3>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">מאושרות</h3>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-white">
              <h3 className="text-sm font-medium text-neutral-600 mb-1">נדחות</h3>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-neutral-700">סטטוס</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setPage(1)
                setFilterStatus(e.target.value)
              }}
              className="px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft"
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
          ) : reviews.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">
                {(listSummary?.total ?? 0) === 0 ? 'אין ביקורות עדיין' : 'אין ביקורות התואמות לסינון'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review._id} className="hover:shadow-soft-lg transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-serif font-semibold text-neutral-900">
                          {review.customerName || review.customer?.name || 'לקוח'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          review.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                          review.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
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
                      {review.video?.url && (
                        <div className="mb-3">
                          <p className="text-xs text-neutral-500 mb-2">סרטון מצורף:</p>
                          <video
                            src={review.video.url}
                            controls
                            className="w-full max-w-md rounded-lg border border-neutral-200"
                          />
                        </div>
                      )}

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
                            const confirmed = window.confirm('האם אתה בטוח שברצונך לדחות את הביקורת?')
                            if (confirmed) {
                              handleStatusUpdate(review._id, 'rejected')
                            }
                          }}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          ❌ דחה
                        </Button>
                        {review.video?.url && (
                          <Button
                            onClick={() => handleDeleteVideo(review._id)}
                            variant="soft"
                            className="text-sm px-4 py-2 text-orange-600 hover:text-orange-700"
                          >
                            🗑️ מחק סרטון
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteReview(review._id)}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          🗑️ מחק ביקורת
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
                            const confirmed = window.confirm('האם אתה בטוח שברצונך לדחות את הביקורת?')
                            if (confirmed) {
                              handleStatusUpdate(review._id, 'rejected')
                            }
                          }}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          ❌ דחה
                        </Button>
                        {review.video?.url && (
                          <Button
                            onClick={() => handleDeleteVideo(review._id)}
                            variant="soft"
                            className="text-sm px-4 py-2 text-orange-600 hover:text-orange-700"
                          >
                            🗑️ מחק סרטון
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteReview(review._id)}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          🗑️ מחק ביקורת
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
                        {review.video?.url && (
                          <Button
                            onClick={() => handleDeleteVideo(review._id)}
                            variant="soft"
                            className="text-sm px-4 py-2 text-orange-600 hover:text-orange-700"
                          >
                            🗑️ מחק סרטון
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteReview(review._id)}
                          variant="soft"
                          className="text-sm px-4 py-2 text-red-600 hover:text-red-700"
                        >
                          🗑️ מחק ביקורת
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <AdminPager
            page={pagination?.page ?? page}
            pages={pagination?.pages ?? 1}
            total={pagination?.total}
            loading={loading}
            onPageChange={setPage}
          />
      </AdminPageShell>
    </>
  )
}

export default ReviewsPage

