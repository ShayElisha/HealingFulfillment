import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerService.getAll()
      const customersData = response?.data || response || []
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('שגיאה בטעינת הלקוחות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar activeTab="customers" onTabChange={() => {}} purchasesCount={0} bookingsCount={0} customersCount={customers.length} contactsCount={0} />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              ← חזור לדף הראשי
            </button>
            <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
              לקוחות
            </h1>
            <p className="text-neutral-600">כל הלקוחות שרכשו מסלולים</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-neutral-600">טוען...</p>
            </div>
          ) : customers.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">אין לקוחות עדיין</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <Card key={customer._id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {customer.name}
                      </h3>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <p>📧 {customer.email}</p>
                        <p>📞 {customer.phone}</p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-neutral-500">פגישות</p>
                            <p className="font-semibold">{customer.stats?.totalSessions || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">רכישות</p>
                            <p className="font-semibold">{customer.purchases?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">סה"כ הוצאה</p>
                            <p className="font-semibold">₪{customer.stats?.totalSpent || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">קבצים</p>
                            <p className="font-semibold">{customer.files?.length || 0}</p>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">
                          נרשם ב: {new Date(customer.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Button
                        onClick={() => navigate(`/customer/${customer._id}`)}
                        variant="primary"
                        className="text-sm px-4 py-2"
                      >
                        פתח תיק לקוח
                      </Button>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        customer.status === 'active' ? 'bg-green-100 text-green-700' :
                        customer.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {customer.status === 'active' ? 'פעיל' :
                         customer.status === 'completed' ? 'הושלם' :
                         'לא פעיל'}
                      </span>
                    </div>
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

export default CustomersPage

