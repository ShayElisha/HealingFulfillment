import { useState, useEffect } from 'react'
import { messageService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import AdminPager from '../components/AdminPager'
import toast from 'react-hot-toast'

const MESSAGES_PAGE_SIZE = 30

function MessagesPage() {
  const [customers, setCustomers] = useState([])
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesPagination, setMessagesPagination] = useState(null)
  const [showSendForm, setShowSendForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    channels: []
  })

  useEffect(() => {
    loadData()
  }, [messagesPage])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersRes, messagesRes] = await Promise.all([
        customerService
          .getAll({ forLookup: 1, page: 1, limit: 1000 })
          .catch((err) => {
            console.error('Error loading customers:', err)
            return { data: [] }
          }),
        messageService
          .getAll({ page: messagesPage, limit: MESSAGES_PAGE_SIZE })
          .catch((err) => {
            console.error('Error loading messages:', err)
            return { data: [], pagination: null }
          }),
      ])

      const customersData = customersRes?.data || []
      const messagesData = messagesRes?.data || []

      setCustomers(Array.isArray(customersData) ? customersData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
      setMessagesPagination(messagesRes?.pagination || null)
    } catch (error) {
      console.error('Error loading data:', error)
      const errorMessage = error.response?.data?.message || error.message || 'שגיאה לא ידועה'
      toast.error(`שגיאה בטעינת הנתונים: ${errorMessage}`)
      // Set empty arrays to prevent crashes
      setCustomers([])
      setMessages([])
      setMessagesPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerToggle = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    } else {
      setSelectedCustomers([...selectedCustomers, customerId])
    }
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map(c => c._id))
    }
  }

  const handleChannelToggle = (channel) => {
    if (formData.channels.includes(channel)) {
      setFormData({
        ...formData,
        channels: formData.channels.filter(c => c !== channel)
      })
    } else {
      setFormData({
        ...formData,
        channels: [...formData.channels, channel]
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedCustomers.length === 0) {
      toast.error('אנא בחר לפחות לקוח אחד')
      return
    }
    
    if (!formData.subject || !formData.content) {
      toast.error('אנא מלא נושא ותוכן')
      return
    }
    
    if (formData.channels.length === 0) {
      toast.error('אנא בחר לפחות ערוץ אחד (מערכת או אימייל)')
      return
    }

    try {
      await messageService.send({
        recipientIds: selectedCustomers,
        subject: formData.subject,
        content: formData.content,
        channels: formData.channels
      })
      
      toast.success(`הודעה נשלחה ל-${selectedCustomers.length} לקוחות`)
      setShowSendForm(false)
      setFormData({
        subject: '',
        content: '',
        channels: []
      })
      setSelectedCustomers([])
      await loadData()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('שגיאה בשליחת ההודעה')
    }
  }

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader
          title="ניהול הודעות"
          subtitle="שליחת הודעות ללקוחות במייל או במערכת"
          actions={
            <Button onClick={() => setShowSendForm(!showSendForm)} variant="primary">
              {showSendForm ? 'ביטול' : 'שלח הודעה חדשה'}
            </Button>
          }
        />

          {/* Send Form */}
          {showSendForm && (
            <Card className="mb-8 border-2 border-primary-100">
              <h2 className="text-2xl font-serif font-semibold text-neutral-900 mb-6">שלח הודעה חדשה</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipients Selection */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-neutral-700">
                      נמענים ({selectedCustomers.length} נבחרו)
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {selectedCustomers.length === customers.length ? 'בטל בחירה' : 'בחר הכל'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50/30">
                    {customers.map(customer => (
                      <label
                        key={customer._id}
                        className="flex items-center gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-all duration-150 border border-transparent hover:border-neutral-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleCustomerToggle(customer._id)}
                          className="w-5 h-5 text-primary-600 rounded border-neutral-300 focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900">{customer.name}</div>
                          <div className="text-sm text-neutral-600">
                            {customer.email} | {customer.phone}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    ערוצי שליחה *
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes('system')}
                        onChange={() => handleChannelToggle('system')}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <span className="text-neutral-700 font-medium">💬 מערכת</span>
                      <span className="text-xs text-neutral-500">(הודעה פנימית בפרופיל הלקוח)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes('email')}
                        onChange={() => handleChannelToggle('email')}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <span className="text-neutral-700 font-medium">📧 אימייל</span>
                    </label>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    ניתן לבחור כמה ערוצים בו-זמנית
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-2">
                    נושא ההודעה *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white shadow-soft"
                    placeholder="לדוגמה: תזכורת לפגישה"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-neutral-700 mb-2">
                    תוכן ההודעה *
                  </label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows="8"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none shadow-soft"
                    placeholder="כתוב את תוכן ההודעה כאן..."
                    required
                  />
                  <p className="text-sm text-neutral-500 mt-2">
                    {formData.content.length} תווים
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button type="submit" variant="primary">
                    שלח הודעה
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowSendForm(false)
                      setFormData({ subject: '', content: '', channels: [] })
                      setSelectedCustomers([])
                    }}
                    variant="soft"
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Messages History */}
          <div>
            <h2 className="text-2xl font-serif font-semibold text-neutral-900 mb-6">היסטוריית הודעות</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-neutral-600">טוען הודעות...</p>
              </div>
            ) : messages.length === 0 ? (
              <Card>
                <p className="text-center text-neutral-500 py-8">אין הודעות עדיין</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {messages.map(message => (
                  <Card key={message._id} className="hover:shadow-soft-lg transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-serif font-semibold text-neutral-900">
                            {message.subject}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            message.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                            message.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                            message.status === 'partially_sent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            message.status === 'sending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}>
                            {message.status === 'sent' ? 'נשלח' :
                             message.status === 'failed' ? 'נכשל' :
                             message.status === 'partially_sent' ? 'חלקי' :
                             message.status === 'sending' ? 'שולח' :
                             'ממתין'}
                          </span>
                        </div>
                        <p className="text-neutral-600 mb-3">{message.content}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                          {message.channels.includes('system') && <span>💬 מערכת</span>}
                          {message.channels.includes('email') && <span>📧 אימייל</span>}
                          <span>👥 {message.recipients?.length || 0} נמענים</span>
                          <span>📅 {new Date(message.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <AdminPager
              page={messagesPagination?.page ?? messagesPage}
              pages={messagesPagination?.pages ?? 1}
              total={messagesPagination?.total}
              loading={loading}
              onPageChange={setMessagesPage}
            />
          </div>
      </AdminPageShell>
    </>
  )
}

export default MessagesPage

