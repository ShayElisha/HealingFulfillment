import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { purchaseService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

function CustomersPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const orderId = searchParams.get('orderId')
    const cardcomFlag = searchParams.get('cardcom')
    const lowProfileCode = searchParams.get('lowprofilecode') || searchParams.get('LowProfileCode')
    if (!orderId || !cardcomFlag) return

    let cancelled = false
    ;(async () => {
      try {
        if (cardcomFlag === 'success') {
          if (!lowProfileCode) {
            toast.error('הרכישה לא אושרה: חסר קוד אימות מהסולק')
          } else {
            await purchaseService.confirmFromRedirect({ orderId, lowProfileCode })
            if (!cancelled) {
              toast.success('הרכישה הושלמה בהצלחה! הלקוח עודכן במערכת')
              await loadCustomers()
            }
          }
        } else {
          toast.error('הרכישה לא הושלמה')
        }
      } catch (error) {
        if (!cancelled) {
          const msg = error?.response?.data?.message || 'לא ניתן לאמת את העסקה מול Cardcom'
          toast.error(msg)
        }
      } finally {
        if (!cancelled) {
          const sp = new URLSearchParams(location.search)
          sp.delete('orderId')
          sp.delete('cardcom')
          sp.delete('lowprofilecode')
          sp.delete('LowProfileCode')
          navigate({ pathname: location.pathname, search: sp.toString() ? `?${sp}` : '' }, { replace: true })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search, navigate])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerService.getAll({
        page: 1,
        limit: 100,
        includeDetails: true
      })
      const customersData = response?.data || []
      const finalCustomers = Array.isArray(customersData) ? customersData : []
      setCustomers(finalCustomers)
    } catch (error) {
      console.error('Error loading customers:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.error(`שגיאה בטעינת הלקוחות: ${error.response?.data?.message || error.message}`)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase()
    if (!q) return customers
    return customers.filter((customer) => {
      const haystack = [customer?.name, customer?.email, customer?.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [customers, searchTerm])

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader title="לקוחות" subtitle="כל הלקוחות שרכשו מסלולים" />

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-neutral-700">חיפוש לקוח</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם, טלפון או אימייל"
              className="w-full md:w-[420px] px-4 py-2.5 border border-neutral-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-neutral-600">טוען...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <p className="text-center text-neutral-500 py-8">
                {customers.length === 0 ? 'אין לקוחות עדיין' : 'לא נמצאו לקוחות לפי החיפוש'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <Card key={customer._id} className="hover:shadow-soft-lg transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-3">
                        {customer.name}
                      </h3>
                      <div className="space-y-2 text-sm text-neutral-600 mb-4">
                        <p className="flex items-center gap-2">📧 {customer.email}</p>
                        <p className="flex items-center gap-2">📞 {customer.phone}</p>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-100">
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-1">פגישות</p>
                            <p className="font-semibold text-neutral-900">{customer.stats?.totalSessions || 0}</p>
                          </div>
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-1">רכישות</p>
                            <p className="font-semibold text-neutral-900">{customer.purchases?.length || 0}</p>
                          </div>
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-1">סה"כ הוצאה</p>
                            <p className="font-semibold text-primary-600">₪{customer.stats?.totalSpent || 0}</p>
                          </div>
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <p className="text-xs text-neutral-500 mb-1">קבצים</p>
                            <p className="font-semibold text-neutral-900">{customer.files?.length || 0}</p>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-400 mt-3">
                          נרשם ב: {new Date(customer.createdAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end ml-4">
                      <Button
                        onClick={() => navigate(`/customer/${customer._id}`)}
                        variant="primary"
                        className="text-sm px-4 py-2"
                      >
                        פתח תיק לקוח
                      </Button>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                        customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                        customer.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-neutral-100 text-neutral-600 border-neutral-200'
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
      </AdminPageShell>
    </>
  )
}

export default CustomersPage

