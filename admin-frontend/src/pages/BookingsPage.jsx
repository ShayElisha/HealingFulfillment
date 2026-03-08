import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'

function BookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [bookingsRes, customersRes] = await Promise.all([
        bookingService.getAll(),
        customerService.getAll()
      ])
      
      const bookingsData = bookingsRes?.data || bookingsRes || []
      const customersData = customersRes?.data || customersRes || []
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const getCustomerForBooking = (booking) => {
    return customers.find(c => 
      c.email === booking.email || 
      c.phone === booking.phone ||
      c.name === booking.name
    )
  }

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false
    if (filterType !== 'all' && booking.meetingType !== filterType) return false
    return true
  })

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    frontend: bookings.filter(b => b.meetingType === 'frontend').length,
    zoom: bookings.filter(b => b.meetingType === 'zoom').length
  }

  return (
    <>
      <Navbar activeTab="bookings" onTabChange={() => {}} purchasesCount={0} bookingsCount={bookings.length} customersCount={customers.length} />
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
              ניהול פגישות
            </h1>
            <p className="text-neutral-600">כל הפגישות והזמנות</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">סה"כ פגישות</h3>
              <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">ממתינות</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">מאושרות</h3>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-1">בוטלו</h3>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">סטטוס</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
              >
                <option value="all">הכל</option>
                <option value="pending">ממתין</option>
                <option value="confirmed">אושר</option>
                <option value="cancelled">בוטל</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">סוג פגישה</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg"
              >
                <option value="all">הכל</option>
                <option value="frontend">פרונטאלי</option>
                <option value="zoom">זום</option>
              </select>
            </div>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-neutral-600">טוען...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">
                {bookings.length === 0 ? 'אין פגישות עדיין' : 'אין פגישות התואמות לסינון'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const customer = getCustomerForBooking(booking)
                return (
                  <Card key={booking._id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {booking.name}
                          </h3>
                          {customer && (
                            <Button
                              onClick={() => navigate(`/customer/${customer._id}`)}
                              variant="soft"
                              className="text-xs px-3 py-1"
                            >
                              פתח תיק לקוח
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-neutral-600">
                          {booking.email && <p>📧 {booking.email}</p>}
                          <p>📞 {booking.phone}</p>
                          <p>
                            📅 תאריך: {new Date(booking.preferredDate).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {booking.preferredTime && (
                            <p>🕐 שעה: {booking.preferredTime}</p>
                          )}
                          <p>
                            💻 סוג פגישה: {booking.meetingType === 'zoom' ? 'זום' : 'פרונטאלי'}
                          </p>
                          {booking.zoomLink && booking.status === 'confirmed' && booking.meetingType === 'zoom' && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs text-blue-700 mb-1 font-medium">🔗 לינק זום:</p>
                              <a
                                href={booking.zoomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline break-all text-xs"
                              >
                                {booking.zoomLink}
                              </a>
                            </div>
                          )}
                          {booking.notes && (
                            <p className="mt-2 text-neutral-500">📝 הערות: {booking.notes}</p>
                          )}
                          <p className="text-xs text-neutral-400 mt-2">
                            נרשם ב: {new Date(booking.createdAt).toLocaleDateString('he-IL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end ml-4">
                        <span className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'אושר' :
                           booking.status === 'cancelled' ? 'בוטל' :
                           'ממתין'}
                        </span>
                        <select
                          value={booking.status}
                          onChange={async (e) => {
                            try {
                              await bookingService.updateStatus(booking._id, e.target.value)
                              await loadData()
                            } catch (error) {
                              alert('שגיאה בעדכון הסטטוס')
                            }
                          }}
                          className="text-xs px-2 py-1 border border-neutral-300 rounded"
                        >
                          <option value="pending">ממתין</option>
                          <option value="confirmed">אושר</option>
                          <option value="cancelled">בוטל</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default BookingsPage

