import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoryService, courseService, purchaseService, bookingService, contactService, reviewService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    customers: { total: 0, active: 0, new: 0 },
    bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, upcoming: [] },
    purchases: { total: 0, pending: 0, completed: 0, revenue: 0 },
    reviews: { total: 0, pending: 0, approved: 0, averageRating: 0 },
    contacts: { total: 0, unread: 0 }
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [
        customersRes,
        bookingsRes,
        purchasesRes,
        reviewsRes,
        contactsRes
      ] = await Promise.all([
        customerService.getAll(),
        bookingService.getAll(),
        purchaseService.getAll(),
        reviewService.getAll(),
        contactService.getAll()
      ])

      const customers = customersRes?.data || []
      const bookings = bookingsRes?.data || []
      const purchases = purchasesRes?.data || []
      const reviewsData = reviewsRes?.data || []
      const contacts = contactsRes?.data || []
      
      setReviews(Array.isArray(reviewsData) ? reviewsData : [])

      // Calculate upcoming bookings (next 7 days)
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      const upcomingBookings = bookings
        .filter(b => {
          const bookingDate = new Date(b.preferredDate)
          return bookingDate >= today && bookingDate <= nextWeek && 
                 (b.status === 'pending' || b.status === 'confirmed')
        })
        .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate))
        .slice(0, 5)

      // Calculate stats
      const completedPurchases = purchases.filter(p => p.status === 'completed')
      const revenue = completedPurchases.reduce((sum, p) => sum + (p.price || 0), 0)

      const approvedReviews = reviewsData.filter(r => r.status === 'approved')
      const averageRating = approvedReviews.length > 0
        ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
        : 0

      setStats({
        customers: {
          total: customers.length,
          active: customers.filter(c => c.status === 'active').length,
          new: customers.filter(c => {
            const createdDate = new Date(c.createdAt)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return createdDate >= weekAgo
          }).length
        },
        bookings: {
          total: bookings.length,
          pending: bookings.filter(b => b.status === 'pending').length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          upcoming: upcomingBookings
        },
        purchases: {
          total: purchases.length,
          pending: purchases.filter(p => p.status === 'pending').length,
          completed: completedPurchases.length,
          revenue: revenue
        },
        reviews: {
          total: reviewsData.length,
          pending: reviewsData.filter(r => r.status === 'pending').length,
          approved: approvedReviews.length,
          averageRating: Math.round(averageRating * 10) / 10
        },
        contacts: {
          total: contacts.length,
          unread: contacts.filter(c => !c.read).length
        }
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('שגיאה בטעינת נתוני הדאשבורד')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar activeTab="dashboard" onTabChange={() => {}} purchasesCount={stats.purchases.pending} bookingsCount={stats.bookings.pending} customersCount={stats.customers.total} contactsCount={stats.contacts.unread} />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
              לוח בקרה
            </h1>
            <p className="text-neutral-600">סקירה כללית של המערכת</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">טוען נתונים...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Customers */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">לקוחות</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.customers.total}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {stats.customers.active} פעילים • {stats.customers.new} חדשים השבוע
                      </p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                  <Button
                    onClick={() => navigate('/customers')}
                    variant="soft"
                    className="w-full mt-4 text-blue-700"
                  >
                    צפה בכל הלקוחות
                  </Button>
                </Card>

                {/* Bookings */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">פגישות</p>
                      <p className="text-3xl font-bold text-green-900">{stats.bookings.total}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {stats.bookings.pending} ממתינות • {stats.bookings.confirmed} מאושרות
                      </p>
                    </div>
                    <div className="text-4xl">📅</div>
                  </div>
                  <Button
                    onClick={() => navigate('/bookings')}
                    variant="soft"
                    className="w-full mt-4 text-green-700"
                  >
                    צפה בכל הפגישות
                  </Button>
                </Card>

                {/* Revenue */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">הכנסות</p>
                      <p className="text-3xl font-bold text-purple-900">₪{stats.purchases.revenue.toLocaleString()}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        {stats.purchases.completed} רכישות הושלמו
                      </p>
                    </div>
                    <div className="text-4xl">💰</div>
                  </div>
                  <Button
                    onClick={() => navigate('/')}
                    variant="soft"
                    className="w-full mt-4 text-purple-700"
                  >
                    צפה ברכישות
                  </Button>
                </Card>

                {/* Reviews */}
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700 mb-1">ביקורות</p>
                      <p className="text-3xl font-bold text-yellow-900">{stats.reviews.total}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {stats.reviews.pending} ממתינות • ⭐ {stats.reviews.averageRating || 0}
                      </p>
                    </div>
                    <div className="text-4xl">⭐</div>
                  </div>
                  <Button
                    onClick={() => navigate('/reviews')}
                    variant="soft"
                    className="w-full mt-4 text-yellow-700"
                  >
                    צפה בביקורות
                  </Button>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Upcoming Bookings */}
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-neutral-900">פגישות קרובות (7 ימים הבאים)</h2>
                    <Button
                      onClick={() => navigate('/bookings')}
                      variant="soft"
                      className="text-sm"
                    >
                      צפה בכל
                    </Button>
                  </div>
                  {stats.bookings.upcoming.length === 0 ? (
                    <p className="text-neutral-500 text-center py-4">אין פגישות קרובות</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.bookings.upcoming.map((booking) => (
                        <div
                          key={booking._id}
                          className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                          onClick={() => navigate('/bookings')}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-neutral-900">{booking.name}</p>
                              <p className="text-sm text-neutral-600">
                                {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {booking.preferredTime && ` • ${booking.preferredTime}`}
                              </p>
                              {booking.isIntroMeeting && (
                                <span className="text-xs text-primary-600 mt-1 inline-block">⭐ פגישת היכרות</span>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {booking.status === 'confirmed' ? 'מאושר' : 'ממתין'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Pending Reviews */}
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-neutral-900">ביקורות ממתינות לאישור</h2>
                    <Button
                      onClick={() => navigate('/reviews')}
                      variant="soft"
                      className="text-sm"
                    >
                      צפה בכל
                    </Button>
                  </div>
                  {stats.reviews.pending === 0 ? (
                    <p className="text-neutral-500 text-center py-4">אין ביקורות ממתינות</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.filter(r => r.status === 'pending').slice(0, 3).map((review) => (
                        <div
                          key={review._id}
                          className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                          onClick={() => navigate('/reviews')}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-neutral-900">
                                {review.customerName || review.customer?.name || 'לקוח'}
                              </p>
                              <div className="flex text-yellow-500 text-sm mt-1">
                                {'⭐'.repeat(review.rating)}
                              </div>
                              <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                                {review.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contacts */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-neutral-900">פניות יצירת קשר</h3>
                    <span className="text-2xl">📧</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">סה"כ פניות</span>
                      <span className="font-bold">{stats.contacts.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">לא נקראו</span>
                      <span className="font-bold text-red-600">{stats.contacts.unread}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/contacts')}
                    variant="soft"
                    className="w-full mt-4"
                  >
                    צפה בפניות
                  </Button>
                </Card>

                {/* Bookings Status */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-neutral-900">סטטוס פגישות</h3>
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">ממתינות</span>
                      <span className="font-bold text-yellow-600">{stats.bookings.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">מאושרות</span>
                      <span className="font-bold text-green-600">{stats.bookings.confirmed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">הושלמו</span>
                      <span className="font-bold text-blue-600">{stats.bookings.completed}</span>
                    </div>
                  </div>
                </Card>

                {/* Purchases Status */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-neutral-900">סטטוס רכישות</h3>
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">ממתינות</span>
                      <span className="font-bold text-yellow-600">{stats.purchases.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">הושלמו</span>
                      <span className="font-bold text-green-600">{stats.purchases.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">סה"כ הכנסות</span>
                      <span className="font-bold text-primary-600">₪{stats.purchases.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default DashboardPage

