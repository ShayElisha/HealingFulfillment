import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leadService } from '../services/adminApi'
import Card from '../components/Card'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function LeadsPage() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const response = await leadService.getAll()
      const leadsData = response?.data || response || []
      setLeads(Array.isArray(leadsData) ? leadsData : [])
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('שגיאה בטעינת הלידים')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStatusUpdate = async (leadId, newStatus) => {
    try {
      await leadService.updateStatus(leadId, newStatus, adminNotes)
      toast.success('סטטוס הליד עודכן בהצלחה')
      await loadLeads()
      if (selectedLead && selectedLead._id === leadId) {
        const updatedLead = await leadService.getById(leadId)
        setSelectedLead(updatedLead.data)
      }
      setAdminNotes('')
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('שגיאה בעדכון סטטוס הליד')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'converted':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'not_interested':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'חדש'
      case 'contacted':
        return 'נוצר קשר'
      case 'converted':
        return 'הומר ללקוח'
      case 'not_interested':
        return 'לא מעוניין'
      default:
        return status
    }
  }

  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filterStatus)

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    notInterested: leads.filter(l => l.status === 'not_interested').length
  }

  return (
    <>
      <Navbar 
        activeTab="leads" 
        onTabChange={() => {}} 
        purchasesCount={0} 
        bookingsCount={0} 
        customersCount={0}
        contactsCount={0}
      />
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              ← חזור לדף הראשי
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-neutral-900 mb-2">
                ניהול לידים - שאלון התאמה
              </h1>
              <p className="text-neutral-600">
                כל הלידים שמילאו את שאלון ההתאמה
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-neutral-600 font-medium">סה"כ לידים</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.new}
                </div>
                <div className="text-sm text-neutral-600 font-medium">חדשים</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {stats.contacted}
                </div>
                <div className="text-sm text-neutral-600 font-medium">נוצר קשר</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {stats.converted}
                </div>
                <div className="text-sm text-neutral-600 font-medium">הומרו</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {stats.notInterested}
                </div>
                <div className="text-sm text-neutral-600 font-medium">לא מעוניינים</div>
              </div>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                הכל ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('new')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === 'new'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                חדשים ({stats.new})
              </button>
              <button
                onClick={() => setFilterStatus('contacted')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === 'contacted'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                נוצר קשר ({stats.contacted})
              </button>
              <button
                onClick={() => setFilterStatus('converted')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === 'converted'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                הומרו ({stats.converted})
              </button>
              <button
                onClick={() => setFilterStatus('not_interested')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === 'not_interested'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                לא מעוניינים ({stats.notInterested})
              </button>
            </div>
          </div>

          {/* Leads List */}
          {loading ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-neutral-600">טוען לידים...</p>
              </div>
            </Card>
          ) : filteredLeads.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-neutral-600">אין לידים עדיין</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <Card 
                  key={lead._id}
                  className="hover:shadow-soft-lg transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {lead.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-2">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-primary-600 hover:text-primary-700">
                            📞 {lead.phone}
                          </a>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-primary-600 hover:text-primary-700">
                            📧 {lead.email}
                          </a>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">
                        <span>📅 {formatDate(lead.createdAt)}</span>
                        {lead.nextStep === 'book_appointment' && (
                          <span className="ml-4">✓ ביקש לקבוע פגישה</span>
                        )}
                        {lead.nextStep === 'wait_for_contact' && (
                          <span className="ml-4">✓ ממתין ליצירת קשר</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLead(lead)
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium px-4 py-2"
                    >
                      צפה בפרטים
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Lead Detail Modal */}
          {selectedLead && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedLead(null)}
            >
              <div 
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-soft-xl border border-neutral-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-neutral-200/60 bg-gradient-to-r from-primary-50/30 to-white flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-semibold text-neutral-900">
                    פרטי ליד
                  </h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-neutral-400 hover:text-neutral-600 text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">פרטי יצירת קשר</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-600 mb-1">שם</label>
                          <p className="text-neutral-900">{selectedLead.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-600 mb-1">טלפון</label>
                          {selectedLead.phone ? (
                            <a href={`tel:${selectedLead.phone}`} className="text-primary-600 hover:text-primary-700">
                              {selectedLead.phone}
                            </a>
                          ) : (
                            <span className="text-neutral-400">לא צוין</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-600 mb-1">אימייל</label>
                          {selectedLead.email ? (
                            <a href={`mailto:${selectedLead.email}`} className="text-primary-600 hover:text-primary-700">
                              {selectedLead.email}
                            </a>
                          ) : (
                            <span className="text-neutral-400">לא צוין</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-600 mb-1">תאריך</label>
                          <p className="text-neutral-900">{formatDate(selectedLead.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Answers */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-4">תשובות לשאלון</h3>
                      <div className="space-y-4">
                        {selectedLead.answers?.map((answer, index) => (
                          <div key={index} className="bg-neutral-50 rounded-xl p-4">
                            <p className="font-medium text-neutral-900 mb-2">{answer.question}</p>
                            <p className="text-neutral-700">{answer.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Additional Notes */}
                    {selectedLead.additionalNotes && (
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">הערות נוספות</h3>
                        <p className="text-neutral-700 whitespace-pre-wrap bg-neutral-50 rounded-xl p-4">
                          {selectedLead.additionalNotes}
                        </p>
                      </div>
                    )}

                    {/* Next Step */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">מה ביקש לעשות</h3>
                      <p className="text-neutral-700">
                        {selectedLead.nextStep === 'book_appointment' 
                          ? '✓ ביקש לקבוע פגישה ראשונית'
                          : '✓ ביקש שהמטפל יצור איתו קשר'}
                      </p>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">הערות מנהל</h3>
                      <textarea
                        value={adminNotes || selectedLead.adminNotes || ''}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="הוסף הערות..."
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-neutral-200/60 bg-neutral-50/30 flex gap-4 flex-wrap">
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusUpdate(selectedLead._id, e.target.value)}
                    className="px-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="converted">הומר ללקוח</option>
                    <option value="not_interested">לא מעוניין</option>
                  </select>
                  {selectedLead.phone && (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-center hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-soft-lg font-medium"
                    >
                      התקשר
                    </a>
                  )}
                  {selectedLead.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="px-4 py-2.5 bg-white text-neutral-700 rounded-xl text-center hover:bg-neutral-50 transition-all duration-200 border border-neutral-200 shadow-soft font-medium"
                    >
                      שלח אימייל
                    </a>
                  )}
                  {selectedLead.nextStep === 'book_appointment' && (
                    <button
                      onClick={() => {
                        setSelectedLead(null)
                        navigate('/bookings')
                      }}
                      className="px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-medium"
                    >
                      קבע פגישה
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default LeadsPage

