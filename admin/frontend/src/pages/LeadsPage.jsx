import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { leadService } from '../services/adminApi'
import Card from '../components/Card'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import AdminModalLayout from '../components/AdminModalLayout'
import Button from '../components/Button'
import AdminPager from '../components/AdminPager'
import toast from 'react-hot-toast'

const LEADS_PAGE_SIZE = 50

function LeadsPage() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [listSummary, setListSummary] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    setPage(1)
  }, [filterStatus])

  useEffect(() => {
    loadLeads()
  }, [page, filterStatus])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const response = await leadService.getAll({
        page,
        limit: LEADS_PAGE_SIZE,
        ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
      })
      const leadsData = response?.data || []
      setLeads(Array.isArray(leadsData) ? leadsData : [])
      setPagination(response?.pagination || null)
      setListSummary(response?.summary || null)
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

  const stats = listSummary || {
    total: pagination?.total ?? leads.length,
    new: 0,
    contacted: 0,
    converted: 0,
    not_interested: 0,
  }

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader
          title="ניהול לידים — שאלון התאמה"
          subtitle="כל הלידים שמילאו את שאלון ההתאמה"
        />

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
                לא מעוניינים ({stats.not_interested})
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
          ) : leads.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-neutral-600">
                  {(listSummary?.total ?? 0) === 0 ? 'אין לידים עדיין' : 'אין לידים במסנן זה'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
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

          <AdminPager
            page={pagination?.page ?? page}
            pages={pagination?.pages ?? 1}
            total={pagination?.total}
            loading={loading}
            onPageChange={setPage}
          />

          {/* Lead Detail Modal */}
          {selectedLead && (
            <AdminModalLayout
              title="פרטי ליד"
              maxWidthClass="max-w-3xl"
              onClose={() => setSelectedLead(null)}
              footer={
                <div className="flex w-full flex-wrap items-stretch gap-3 md:items-center">
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusUpdate(selectedLead._id, e.target.value)}
                    className="admin-select min-w-[10rem] shrink-0"
                  >
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="converted">הומר ללקוח</option>
                    <option value="not_interested">לא מעוניין</option>
                  </select>
                  {selectedLead.phone ? (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="btn-primary inline-flex min-w-[7rem] flex-1 items-center justify-center text-center"
                    >
                      התקשר
                    </a>
                  ) : null}
                  {selectedLead.email ? (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="btn-secondary inline-flex min-w-[7rem] flex-1 items-center justify-center text-center"
                    >
                      שלח אימייל
                    </a>
                  ) : null}
                  {selectedLead.nextStep === 'book_appointment' ? (
                    <Button
                      type="button"
                      variant="primary"
                      className="min-w-[7rem] flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                      onClick={() => {
                        setSelectedLead(null)
                        navigate('/bookings')
                      }}
                    >
                      קבע פגישה
                    </Button>
                  ) : null}
                </div>
              }
            >
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-neutral-900">פרטי יצירת קשר</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="admin-label mb-1">שם</label>
                      <p className="text-neutral-900">{selectedLead.name}</p>
                    </div>
                    <div>
                      <label className="admin-label mb-1">טלפון</label>
                      {selectedLead.phone ? (
                        <a href={`tel:${selectedLead.phone}`} className="text-primary-600 hover:text-primary-700">
                          {selectedLead.phone}
                        </a>
                      ) : (
                        <span className="text-neutral-400">לא צוין</span>
                      )}
                    </div>
                    <div>
                      <label className="admin-label mb-1">אימייל</label>
                      {selectedLead.email ? (
                        <a href={`mailto:${selectedLead.email}`} className="text-primary-600 hover:text-primary-700">
                          {selectedLead.email}
                        </a>
                      ) : (
                        <span className="text-neutral-400">לא צוין</span>
                      )}
                    </div>
                    <div>
                      <label className="admin-label mb-1">תאריך</label>
                      <p className="text-neutral-900">{formatDate(selectedLead.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold text-neutral-900">תשובות לשאלון</h3>
                  <div className="space-y-4">
                    {selectedLead.answers?.map((answer, index) => (
                      <div key={index} className="rounded-xl bg-neutral-50 p-4">
                        <p className="mb-2 font-medium text-neutral-900">{answer.question}</p>
                        <p className="text-neutral-700">{answer.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLead.additionalNotes && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-neutral-900">הערות נוספות</h3>
                    <p className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-4 text-neutral-700">
                      {selectedLead.additionalNotes}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">מה ביקש לעשות</h3>
                  <p className="text-neutral-700">
                    {selectedLead.nextStep === 'book_appointment'
                      ? 'ביקש לקבוע פגישה ראשונית'
                      : 'ביקש שהמטפל יצור איתו קשר'}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">הערות מנהל</h3>
                  <textarea
                    value={adminNotes || selectedLead.adminNotes || ''}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="3"
                    className="admin-textarea resize-none"
                    placeholder="הוסף הערות..."
                  />
                </div>
              </div>
            </AdminModalLayout>
          )}
      </AdminPageShell>
    </>
  )
}

export default LeadsPage

