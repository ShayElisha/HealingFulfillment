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

  const handleViewContact = async (contact) => {
    setSelectedContact(contact)
    // אם הפנייה לא נקראה, סמן אותה כנקראה
    if (!contact.isRead) {
      try {
        await contactService.markAsRead(contact._id)
        // עדכן את הרשימה המקומית
        setContacts(contacts.map(c => 
          c._id === contact._id 
            ? { ...c, isRead: true, readAt: new Date() }
            : c
        ))
        // עדכן גם את הפנייה הנבחרת
        setSelectedContact({ ...contact, isRead: true, readAt: new Date() })
      } catch (error) {
        console.error('Error marking contact as read:', error)
        toast.error('שגיאה בסימון הפנייה כנקראה')
      }
    }
  }

  const handleMarkAsRead = async (contactId) => {
    try {
      await contactService.markAsRead(contactId)
      // עדכן את הרשימה המקומית
      setContacts(contacts.map(c => 
        c._id === contactId 
          ? { ...c, isRead: true, readAt: new Date() }
          : c
      ))
      // אם זו הפנייה הנבחרת, עדכן גם אותה
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({ ...selectedContact, isRead: true, readAt: new Date() })
      }
      toast.success('הפנייה סומנה כנקראה')
    } catch (error) {
      console.error('Error marking contact as read:', error)
      toast.error('שגיאה בסימון הפנייה כנקראה')
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
    unread: contacts.filter(c => !c.isRead).length,
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
                ניהול פניות יצירת קשר
              </h1>
              <p className="text-neutral-600">
                כל הפניות שנשלחו דרך טופס יצירת הקשר באתר
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {stats.total}
                </div>
                <div className="text-sm text-neutral-600 font-medium">סה"כ פניות</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {stats.unread}
                </div>
                <div className="text-sm text-neutral-600 font-medium">לא נקראו</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stats.today}
                </div>
                <div className="text-sm text-neutral-600 font-medium">היום</div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {stats.thisWeek}
                </div>
                <div className="text-sm text-neutral-600 font-medium">השבוע</div>
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
                    <tr className="border-b border-neutral-200 bg-neutral-50/50">
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">סטטוס</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">תאריך</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">שם</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">טלפון</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">אימייל</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">הודעה</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-700 text-sm">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
                      <tr 
                        key={contact._id} 
                        className={`border-b border-neutral-100 hover:bg-primary-50/30 transition-colors duration-150 ${!contact.isRead ? 'bg-red-50/20' : ''}`}
                      >
                        <td className="py-4 px-4">
                          {!contact.isRead ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              לא נקרא
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              נקרא
                            </span>
                          )}
                        </td>
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
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewContact(contact)}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              צפה
                            </button>
                            {!contact.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(contact._id)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                נקרא
                              </button>
                            )}
                          </div>
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedContact(null)}
            >
              <div 
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-soft-xl border border-neutral-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-neutral-200/60 bg-gradient-to-r from-primary-50/30 to-white flex justify-between items-center">
                  <h2 className="text-2xl font-serif font-semibold text-neutral-900">
                    פרטי פנייה
                  </h2>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="text-neutral-400 hover:text-neutral-600 text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">
                        סטטוס
                      </label>
                      {!selectedContact.isRead ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          לא נקרא
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            נקרא
                          </span>
                          {selectedContact.readAt && (
                            <p className="text-xs text-neutral-500 mt-1">
                              נקרא ב: {formatDate(selectedContact.readAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
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
                <div className="p-6 border-t border-neutral-200/60 bg-neutral-50/30 flex gap-4">
                  {!selectedContact.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(selectedContact._id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl text-center hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-soft-lg font-medium"
                    >
                      סמן כנקרא
                    </button>
                  )}
                  {selectedContact.phone && (
                    <a
                      href={`tel:${selectedContact.phone}`}
                      className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2.5 rounded-xl text-center hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-soft-lg font-medium"
                    >
                      התקשר
                    </a>
                  )}
                  {selectedContact.email && (
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="flex-1 bg-white text-neutral-700 px-4 py-2.5 rounded-xl text-center hover:bg-neutral-50 transition-all duration-200 border border-neutral-200 shadow-soft font-medium"
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

