import { useState, useEffect } from 'react'
import { contactService } from '../services/adminApi'
import Card from '../components/Card'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import AdminModalLayout from '../components/AdminModalLayout'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import toast from 'react-hot-toast'

function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)
  const [readFilter, setReadFilter] = useState('all')

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

  const filteredContacts = contacts.filter((c) => {
    if (readFilter === 'unread') return !c.isRead
    if (readFilter === 'read') return c.isRead
    return true
  })

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
      <Navbar />
      <AdminPageShell>
        <PageHeader
          title="ניהול פניות יצירת קשר"
          subtitle="כל הפניות שנשלחו דרך טופס יצירת הקשר באתר"
        />

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { label: 'סה"כ פניות', value: stats.total, className: 'text-primary-600' },
              { label: 'לא נקראו', value: stats.unread, className: 'text-red-600' },
              { label: 'היום', value: stats.today, className: 'text-blue-600' },
              { label: 'השבוע', value: stats.thisWeek, className: 'text-purple-600' },
            ].map((s) => (
              <div key={s.label} className="admin-stat-pill">
                <div className={`font-serif text-3xl font-semibold ${s.className} mb-1`}>{s.value}</div>
                <div className="text-sm font-medium text-neutral-600">{s.label}</div>
              </div>
            ))}
          </div>

          {!loading && contacts.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'הכל' },
                { id: 'unread', label: 'לא נקראו' },
                { id: 'read', label: 'נקראו' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReadFilter(f.id)}
                  className={`admin-chip ${readFilter === f.id ? 'admin-chip-active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}

          {/* Contacts Table */}
          {loading ? (
            <Card>
              <div className="py-12 text-center">
                <p className="text-neutral-600">טוען פניות...</p>
              </div>
            </Card>
          ) : contacts.length === 0 ? (
            <EmptyState
              icon="📧"
              title="אין פניות עדיין"
              description="כאשר ממלאים טופס יצירת קשר באתר, הפניות יופיעו כאן."
            />
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              icon="🔎"
              title="אין תוצאות"
              description="נסו לשנות את מסנן הסטטוס."
            >
              <Button type="button" variant="soft" onClick={() => setReadFilter('all')}>
                הצג הכל
              </Button>
            </EmptyState>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>סטטוס</th>
                      <th>תאריך</th>
                      <th>שם</th>
                      <th>טלפון</th>
                      <th>אימייל</th>
                      <th>הודעה</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <tr
                        key={contact._id}
                        className={!contact.isRead ? 'bg-red-50/25' : ''}
                      >
                        <td>
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
                        <td className="text-sm text-neutral-700">
                          {formatDate(contact.createdAt)}
                        </td>
                        <td className="font-medium text-neutral-900">
                          {contact.name}
                        </td>
                        <td className="text-neutral-700">
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="text-neutral-700">
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="max-w-xs text-neutral-700">
                          <div className="truncate" title={contact.message}>
                            {contact.message || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewContact(contact)}
                              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md px-1"
                            >
                              צפה
                            </button>
                            {!contact.isRead && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(contact._id)}
                                className="text-sm font-medium text-green-600 transition-colors hover:text-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded-md px-1"
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
          )}

          {/* Contact Detail Modal */}
          {selectedContact && (
            <AdminModalLayout
              title="פרטי פנייה"
              onClose={() => setSelectedContact(null)}
              footer={
                <div className="flex w-full flex-wrap gap-3">
                  {!selectedContact.isRead && (
                    <Button
                      type="button"
                      variant="primary"
                      className="min-w-[8rem] flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                      onClick={() => handleMarkAsRead(selectedContact._id)}
                    >
                      סמן כנקרא
                    </Button>
                  )}
                  {selectedContact.phone ? (
                    <a
                      href={`tel:${selectedContact.phone}`}
                      className="btn-primary inline-flex min-w-[8rem] flex-1 items-center justify-center text-center"
                    >
                      התקשר
                    </a>
                  ) : null}
                  {selectedContact.email ? (
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="btn-secondary inline-flex min-w-[8rem] flex-1 items-center justify-center text-center"
                    >
                      שלח אימייל
                    </a>
                  ) : null}
                </div>
              }
            >
                  <div className="space-y-4">
                    <div>
                      <label className="admin-label mb-1">
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
                      <label className="admin-label mb-1">
                        תאריך
                      </label>
                      <p className="text-neutral-900">
                        {formatDate(selectedContact.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="admin-label mb-1">
                        שם מלא
                      </label>
                      <p className="text-neutral-900">{selectedContact.name}</p>
                    </div>
                    <div>
                      <label className="admin-label mb-1">
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
                      <label className="admin-label mb-1">
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
                      <label className="admin-label mb-1">
                        הודעה
                      </label>
                      <p className="text-neutral-900 whitespace-pre-wrap">
                        {selectedContact.message || 'אין הודעה'}
                      </p>
                    </div>
                  </div>
            </AdminModalLayout>
          )}
      </AdminPageShell>
    </>
  )
}

export default ContactsPage

