import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { contactService } from '../services/adminApi'
import Card from '../components/Card'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

function ContactsPage() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await contactService.getAll()
      const contactsData = response?.data || response || []
      setContacts(Array.isArray(contactsData) ? contactsData : [])
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('שגיאה בטעינת הפניות')
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

  const stats = {
    total: contacts.length,
    today: contacts.filter(c => {
      const contactDate = new Date(c.createdAt)
      const today = new Date()
      return contactDate.toDateString() === today.toDateString()
    }).length,
    thisWeek: contacts.filter(c => {
      const contactDate = new Date(c.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return contactDate >= weekAgo
    }).length
  }

  return (
    <>
      <Navbar 
        activeTab="contacts" 
        onTabChange={() => {}} 
        purchasesCount={0} 
        bookingsCount={0} 
        customersCount={0}
        contactsCount={contacts.length}
      />
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
              ניהול פניות יצירת קשר
            </h1>
            <p className="text-neutral-600">
              כל הפניות שנשלחו דרך טופס יצירת הקשר באתר
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-neutral-600">סה"כ פניות</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {stats.today}
                </div>
                <div className="text-sm text-neutral-600">היום</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {stats.thisWeek}
                </div>
                <div className="text-sm text-neutral-600">השבוע</div>
              </div>
            </Card>
          </div>

          {/* Contacts Table */}
          {loading ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-neutral-600">טוען פניות...</p>
              </div>
            </Card>
          ) : contacts.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-neutral-600">אין פניות עדיין</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">תאריך</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">שם</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">טלפון</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">אימייל</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">הודעה</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr 
                        key={contact._id} 
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-4 px-4 text-neutral-700 text-sm">
                          {formatDate(contact.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-neutral-900 font-medium">
                          {contact.name}
                        </td>
                        <td className="py-4 px-4 text-neutral-700">
                          {contact.phone ? (
                            <a 
                              href={`tel:${contact.phone}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-neutral-700">
                          {contact.email ? (
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-neutral-700 max-w-xs">
                          <div className="truncate" title={contact.message}>
                            {contact.message || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedContact(contact)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            צפה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Contact Detail Modal */}
          {selectedContact && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedContact(null)}
            >
              <div 
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-bold text-neutral-900">
                    פרטי פנייה
                  </h2>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="text-neutral-400 hover:text-neutral-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        תאריך
                      </label>
                      <p className="text-neutral-900">
                        {formatDate(selectedContact.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        שם מלא
                      </label>
                      <p className="text-neutral-900">{selectedContact.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        טלפון
                      </label>
                      {selectedContact.phone ? (
                        <a 
                          href={`tel:${selectedContact.phone}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {selectedContact.phone}
                        </a>
                      ) : (
                        <span className="text-neutral-400">לא צוין</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        אימייל
                      </label>
                      {selectedContact.email ? (
                        <a 
                          href={`mailto:${selectedContact.email}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {selectedContact.email}
                        </a>
                      ) : (
                        <span className="text-neutral-400">לא צוין</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        הודעה
                      </label>
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {selectedContact.message || 'אין הודעה'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-neutral-200 flex gap-4">
                  {selectedContact.phone && (
                    <a
                      href={`tel:${selectedContact.phone}`}
                      className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg text-center hover:bg-primary-700 transition-colors"
                    >
                      התקשר
                    </a>
                  )}
                  {selectedContact.email && (
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="flex-1 bg-neutral-200 text-neutral-900 px-4 py-2 rounded-lg text-center hover:bg-neutral-300 transition-colors"
                    >
                      שלח אימייל
                    </a>
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

export default ContactsPage

