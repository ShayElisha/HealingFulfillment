import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function TransactionsPage() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [customers, setCustomers] = useState([])
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  })
  
  const [formData, setFormData] = useState({
    type: 'income',
    category: 'course_sales',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    customer: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      // Prepare API params - remove 'all' values and empty strings
      const apiParams = {}
      if (filters.type && filters.type !== 'all') {
        apiParams.type = filters.type
      }
      if (filters.category && filters.category !== 'all') {
        apiParams.category = filters.category
      }
      if (filters.startDate) {
        apiParams.startDate = filters.startDate
      }
      if (filters.endDate) {
        apiParams.endDate = filters.endDate
      }
      
      const [transactionsRes, customersRes] = await Promise.all([
        transactionService.getAll(apiParams).catch((err) => {
          console.error('❌ Error fetching transactions:', err)
          console.error('❌ Error details:', err.response?.data || err.message)
          console.error('❌ Error stack:', err.stack)
          return { data: { data: [] } }
        }),
        customerService.getAll().catch(() => ({ data: { data: [] } }))
      ])
      
      console.log('📊 Transactions API Response (full):', transactionsRes)
      console.log('📊 Transactions API Response type:', typeof transactionsRes)
      console.log('📊 Transactions API Response.data:', transactionsRes?.data)
      console.log('📊 Transactions API Response.data type:', typeof transactionsRes?.data)
      console.log('📊 Transactions API Response.data.data:', transactionsRes?.data?.data)
      console.log('📊 Transactions API Response.data.data type:', typeof transactionsRes?.data?.data)
      console.log('📊 Transactions API Response.data.data isArray:', Array.isArray(transactionsRes?.data?.data))
      
      // Handle different response formats
      let transactionsData = []
      if (transactionsRes?.data?.data && Array.isArray(transactionsRes.data.data)) {
        // Standard format: { message, data: [transactions], pagination }
        transactionsData = transactionsRes.data.data
      } else if (Array.isArray(transactionsRes?.data)) {
        // Direct array format
        transactionsData = transactionsRes.data
      } else if (Array.isArray(transactionsRes)) {
        // Response is already an array
        transactionsData = transactionsRes
      }
      
      const customersData = customersRes?.data || []
      
      console.log('✅ Parsed Transactions:', transactionsData)
      console.log('✅ Transactions Count:', transactionsData.length)
      console.log('✅ First Transaction Sample:', transactionsData[0])
      
      console.log('Parsed Transactions:', transactionsData)
      console.log('Transactions Count:', Array.isArray(transactionsData) ? transactionsData.length : 0)
      
      setTransactions(Array.isArray(transactionsData) ? transactionsData : [])
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction._id, formData)
        toast.success('רשומה עודכנה בהצלחה')
      } else {
        await transactionService.create(formData)
        toast.success('רשומה נוצרה בהצלחה')
      }
      setShowForm(false)
      setEditingTransaction(null)
      setFormData({
        type: 'income',
        category: 'course_sales',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        reference: '',
        customer: '',
        notes: ''
      })
      loadData()
    } catch (error) {
      console.error('Error saving transaction:', error)
      toast.error(`שגיאה בשמירת הרשומה: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: transaction.paymentMethod || 'bank_transfer',
      reference: transaction.reference || '',
      customer: transaction.customer?._id || '',
      notes: transaction.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הרשומה?')) {
      return
    }
    try {
      await transactionService.delete(id)
      toast.success('רשומה נמחקה בהצלחה')
      loadData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('שגיאה במחיקת הרשומה')
    }
  }

  const incomeCategories = [
    { value: 'course_sales', label: 'מכירת מסלולים' },
    { value: 'session_fees', label: 'תשלומי פגישות' },
    { value: 'consultation', label: 'ייעוץ' },
    { value: 'other_income', label: 'הכנסה אחרת' }
  ]

  const expenseCategories = [
    { value: 'salaries', label: 'משכורות' },
    { value: 'rent', label: 'שכר דירה' },
    { value: 'marketing', label: 'שיווק' },
    { value: 'utilities', label: 'תשתיות' },
    { value: 'supplies', label: 'אספקה' },
    { value: 'software', label: 'תוכנה' },
    { value: 'insurance', label: 'ביטוח' },
    { value: 'taxes', label: 'מסים' },
    { value: 'other_expense', label: 'הוצאה אחרת' }
  ]

  const getCategoryLabel = (category) => {
    const allCategories = [...incomeCategories, ...expenseCategories]
    return allCategories.find(c => c.value === category)?.label || category
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const filteredTransactions = transactions.filter(t => {
    if (filters.type !== 'all' && t.type !== filters.type) return false
    if (filters.category !== 'all' && t.category !== filters.category) return false
    return true
  })

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const balance = totalIncome - totalExpense

  return (
    <>
      <Navbar 
        activeTab="transactions" 
        onTabChange={() => {}} 
        purchasesCount={0} 
        bookingsCount={0} 
        customersCount={0}
        contactsCount={0}
      />
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
            >
              ← חזור לדף הראשי
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
                  ניהול הכנסות והוצאות
                </h1>
                <p className="text-neutral-600">מעקב אחר כל ההכנסות וההוצאות</p>
              </div>
              <Button
                onClick={() => {
                  setEditingTransaction(null)
                  setFormData({
                    type: 'income',
                    category: 'course_sales',
                    amount: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'bank_transfer',
                    reference: '',
                    customer: '',
                    notes: ''
                  })
                  setShowForm(true)
                }}
                variant="primary"
              >
                + הוסף רשומה
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {formatCurrency(totalIncome)}
                </div>
                <div className="text-sm text-neutral-600 font-medium">סה"כ הכנסות</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {formatCurrency(totalExpense)}
                </div>
                <div className="text-sm text-neutral-600 font-medium">סה"כ הוצאות</div>
              </div>
            </Card>
            <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-white border-blue-200' : 'from-orange-50 to-white border-orange-200'}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(balance)}
                </div>
                <div className="text-sm text-neutral-600 font-medium">מאזן תזרימי</div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">סוג</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                >
                  <option value="all">הכל</option>
                  <option value="income">הכנסות</option>
                  <option value="expense">הוצאות</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">קטגוריה</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                >
                  <option value="all">הכל</option>
                  {filters.type === 'income' || filters.type === 'all' ? (
                    incomeCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))
                  ) : null}
                  {filters.type === 'expense' || filters.type === 'all' ? (
                    expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))
                  ) : null}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">מתאריך</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">עד תאריך</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                />
              </div>
            </div>
          </Card>

          {/* Form Modal */}
          {showForm && (
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingTransaction ? 'ערוך רשומה' : 'רשומה חדשה'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">סוג *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          type: e.target.value,
                          category: e.target.value === 'income' ? 'course_sales' : 'salaries'
                        })
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                      required
                    >
                      <option value="income">הכנסה</option>
                      <option value="expense">הוצאה</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">קטגוריה *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                      required
                    >
                      {formData.type === 'income' ? (
                        incomeCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))
                      ) : (
                        expenseCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">סכום (₪) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">תאריך *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">אמצעי תשלום</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                    >
                      <option value="cash">מזומן</option>
                      <option value="credit_card">כרטיס אשראי</option>
                      <option value="bank_transfer">העברה בנקאית</option>
                      <option value="check">צ'ק</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">לקוח (אופציונלי)</label>
                    <select
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                    >
                      <option value="">ללא לקוח</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name} ({customer.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">תיאור *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">מספר הפניה (אופציונלי)</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                    placeholder="מספר חשבונית, העברה וכו'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">הערות</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300"
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" variant="primary">
                    {editingTransaction ? 'עדכן' : 'שמור'}
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTransaction(null)
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Transactions List */}
          {loading ? (
            <Card>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-neutral-600">טוען רשומות...</p>
              </div>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-neutral-700 font-medium mb-2">אין רשומות להצגה</p>
                <p className="text-neutral-500 text-sm mb-4">
                  {filters.type !== 'all' || filters.category !== 'all' || filters.startDate || filters.endDate
                    ? 'לא נמצאו רשומות לפי הפילטרים שנבחרו'
                    : 'עדיין לא נוצרו רשומות הכנסות או הוצאות'}
                </p>
                {filters.type !== 'all' || filters.category !== 'all' || filters.startDate || filters.endDate ? (
                  <Button
                    variant="secondary"
                    onClick={() => setFilters({ type: 'all', category: 'all', startDate: '', endDate: '' })}
                    className="mt-4"
                  >
                    נקה פילטרים
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction._id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                        </span>
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs">
                          {getCategoryLabel(transaction.category)}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        {transaction.description}
                      </h3>
                      {transaction.customer && (
                        <p className="text-sm text-neutral-600 mb-1">
                          לקוח: {transaction.customer.name || transaction.customer.email}
                        </p>
                      )}
                      {transaction.reference && (
                        <p className="text-xs text-neutral-500">
                          הפניה: {transaction.reference}
                        </p>
                      )}
                      {transaction.notes && (
                        <p className="text-sm text-neutral-600 mt-2">
                          {transaction.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {transaction.paymentMethod === 'cash' ? 'מזומן' :
                           transaction.paymentMethod === 'credit_card' ? 'כרטיס אשראי' :
                           transaction.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' :
                           transaction.paymentMethod === 'check' ? 'צ\'ק' : 'אחר'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(transaction)}
                          className="text-sm px-3 py-1"
                        >
                          ערוך
                        </Button>
                        <Button
                          variant="soft"
                          onClick={() => handleDelete(transaction._id)}
                          className="text-sm px-3 py-1"
                        >
                          מחק
                        </Button>
                      </div>
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

export default TransactionsPage

