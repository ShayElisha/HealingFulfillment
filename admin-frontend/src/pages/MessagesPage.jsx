import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { messageService } from '../services/adminApi'
import { customerService } from '../services/customerApi'
import Card from '../components/Card'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function MessagesPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSendForm, setShowSendForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    channels: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [customersRes, messagesRes] = await Promise.all([
        customerService.getAll(),
        messageService.getAll()
      ])
      
      const customersData = customersRes?.data || customersRes || []
      const messagesData = messagesRes?.data || messagesRes || []
      
      setCustomers(Array.isArray(customersData) ? customersData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('שגיאה בטעינת הנתונים')
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
      toast.error('אנא בחר לפחות ערוץ אחד (מייל או וואטסאפ)')
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
      <Navbar activeTab="messages" onTabChange={() => {}} purchasesCount={0} bookingsCount={0} customersCount={customers.length} contactsCount={0} />
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
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
                  ניהול הודעות
                </h1>
                <p className="text-neutral-600">שליחת הודעות ללקוחות במייל ו/או וואטסאפ</p>
              </div>
              <Button
                onClick={() => setShowSendForm(!showSendForm)}
                variant="primary"
              >
                {showSendForm ? 'ביטול' : 'שלח הודעה חדשה'}
              </Button>
            </div>
          </div>

          {/* Send Form */}
          {showSendForm && (
            <Card className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">שלח הודעה חדשה</h2>
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
                  <div className="max-h-60 overflow-y-auto border border-neutral-300 rounded-lg p-4 space-y-2">
                    {customers.map(customer => (
                      <label
                        key={customer._id}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleCustomerToggle(customer._id)}
                          className="w-5 h-5 text-primary-600 rounded"
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
                    ערוצי שליחה
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes('email')}
                        onChange={() => handleChannelToggle('email')}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <span className="text-neutral-700">📧 אימייל</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes('whatsapp')}
                        onChange={() => handleChannelToggle('whatsapp')}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <span className="text-neutral-700">💬 וואטסאפ</span>
                    </label>
                  </div>
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
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">היסטוריית הודעות</h2>
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
                  <Card key={message._id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">
                            {message.subject}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            message.status === 'sent' ? 'bg-green-100 text-green-700' :
                            message.status === 'failed' ? 'bg-red-100 text-red-700' :
                            message.status === 'partially_sent' ? 'bg-yellow-100 text-yellow-700' :
                            message.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
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
                          <span>📧 {message.channels.includes('email') ? 'אימייל' : ''}</span>
                          <span>💬 {message.channels.includes('whatsapp') ? 'וואטסאפ' : ''}</span>
                          <span>👥 {message.recipients?.length || 0} נמענים</span>
                          <span>📅 {new Date(message.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MessagesPage

