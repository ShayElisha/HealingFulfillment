import { useState, useEffect } from 'react'
import { transactionService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'

function TransactionsPage() {
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
      // Prepare data for API - convert amount to number and handle empty customer
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        customer: formData.customer && formData.customer.trim() !== '' ? formData.customer : null,
        reference: formData.reference && formData.reference.trim() !== '' ? formData.reference : undefined,
        notes: formData.notes && formData.notes.trim() !== '' ? formData.notes : undefined
      }
      
      console.log('📤 Submitting transaction data:', submitData)
      
      if (editingTransaction) {
        await transactionService.update(editingTransaction._id, submitData)
        toast.success('רשומה עודכנה בהצלחה')
      } else {
        await transactionService.create(submitData)
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
      console.error('❌ Error saving transaction:', error)
      console.error('❌ Error response:', error.response?.data)
      
      // Show detailed error message
      let errorMessage = 'שגיאה בשמירת הרשומה'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage += ': ' + error.response.data.errors.join(', ')
      } else if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
        errorMessage += ': ' + error.response.data.details.map(d => d.message).join(', ')
      }
      
      toast.error(errorMessage)
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
      <Navbar />
      <AdminPageShell>
        <PageHeader
          title="ניהול הכנסות והוצאות"
          subtitle="מעקב אחר כל ההכנסות וההוצאות"
          actions={
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
          }
        />

          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="admin-stat-pill text-center">
              <div className="mb-1 font-serif text-3xl font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
              <div className="text-sm font-medium text-neutral-600">סה"כ הכנסות</div>
            </div>
            <div className="admin-stat-pill text-center">
              <div className="mb-1 font-serif text-3xl font-semibold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
              <div className="text-sm font-medium text-neutral-600">סה"כ הוצאות</div>
            </div>
            <div className="admin-stat-pill text-center">
              <div
                className={`mb-1 font-serif text-3xl font-semibold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
              >
                {formatCurrency(balance)}
              </div>
              <div className="text-sm font-medium text-neutral-600">מאזן תזרימי</div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 rounded-2xl border border-neutral-200/70 shadow-soft">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <div>
                <label className="admin-label">סוג</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="admin-select"
                >
                  <option value="all">הכל</option>
                  <option value="income">הכנסות</option>
                  <option value="expense">הוצאות</option>
                </select>
              </div>
              <div>
                <label className="admin-label">קטגוריה</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="admin-select"
                >
                  <option value="all">הכל</option>
                  {filters.type === 'income' || filters.type === 'all'
                    ? incomeCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))
                    : null}
                  {filters.type === 'expense' || filters.type === 'all'
                    ? expenseCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))
                    : null}
                </select>
              </div>
              <div>
                <label className="admin-label">מתאריך</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">עד תאריך</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="admin-input"
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
            <EmptyState
              icon="📊"
              title="אין רשומות להצגה"
              description={
                filters.type !== 'all' ||
                filters.category !== 'all' ||
                filters.startDate ||
                filters.endDate
                  ? 'לא נמצאו רשומות לפי הפילטרים שנבחרו.'
                  : 'עדיין לא נוצרו רשומות הכנסות או הוצאות.'
              }
            >
              {filters.type !== 'all' ||
              filters.category !== 'all' ||
              filters.startDate ||
              filters.endDate ? (
                <Button
                  variant="secondary"
                  onClick={() => setFilters({ type: 'all', category: 'all', startDate: '', endDate: '' })}
                >
                  נקה פילטרים
                </Button>
              ) : null}
            </EmptyState>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table min-w-[960px]">
                <thead>
                  <tr>
                    <th>תאריך</th>
                    <th>סוג</th>
                    <th>קטגוריה</th>
                    <th>תיאור</th>
                    <th>לקוח</th>
                    <th>סכום</th>
                    <th>תשלום</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="whitespace-nowrap text-sm text-neutral-600">
                        {formatDate(transaction.date)}
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                        </span>
                      </td>
                      <td className="text-sm text-neutral-700">
                        {getCategoryLabel(transaction.category)}
                      </td>
                      <td className="max-w-[220px]">
                        <div className="font-medium text-neutral-900">{transaction.description}</div>
                        {transaction.reference ? (
                          <div className="mt-0.5 text-xs text-neutral-500">הפניה: {transaction.reference}</div>
                        ) : null}
                        {transaction.notes ? (
                          <div className="mt-1 line-clamp-2 text-xs text-neutral-600">{transaction.notes}</div>
                        ) : null}
                      </td>
                      <td className="text-sm text-neutral-700">
                        {transaction.customer
                          ? transaction.customer.name || transaction.customer.email || '—'
                          : '—'}
                      </td>
                      <td
                        className={`whitespace-nowrap font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="text-xs text-neutral-500">
                        {transaction.paymentMethod === 'cash'
                          ? 'מזומן'
                          : transaction.paymentMethod === 'credit_card'
                            ? 'כרטיס אשראי'
                            : transaction.paymentMethod === 'bank_transfer'
                              ? 'העברה בנקאית'
                              : transaction.paymentMethod === 'check'
                                ? "צ'ק"
                                : 'אחר'}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleEdit(transaction)}
                            className="px-3 py-1.5 text-sm"
                          >
                            ערוך
                          </Button>
                          <Button
                            type="button"
                            variant="soft"
                            onClick={() => handleDelete(transaction._id)}
                            className="px-3 py-1.5 text-sm"
                          >
                            מחק
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </AdminPageShell>
    </>
  )
}

export default TransactionsPage

