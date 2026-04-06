import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import AdminModalLayout from '../components/AdminModalLayout'
import EmptyState from '../components/EmptyState'
import { forWhomAudienceService } from '../services/adminApi'
import toast from 'react-hot-toast'

const emptyForm = {
  title: '',
  description: '',
  order: '',
  isActive: true,
}

function ForWhomAudiencePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await forWhomAudienceService.getAll()
      setItems(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      console.error(e)
      toast.error('שגיאה בטעינת הכרטיסים')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id)
    setForm({
      title: row.title || '',
      description: row.description || '',
      order: row.order != null ? String(row.order) : '',
      isActive: row.isActive !== false,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('נדרשים כותרת ותיאור')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      }
      if (form.order !== '' && Number.isFinite(Number(form.order))) {
        payload.order = Number(form.order)
      }
      if (editingId) {
        await forWhomAudienceService.update(editingId, payload)
        toast.success('עודכן')
      } else {
        await forWhomAudienceService.create(payload)
        toast.success('נוצר כרטיס חדש')
      }
      closeModal()
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הכרטיס?')) return
    try {
      await forWhomAudienceService.delete(id)
      toast.success('נמחק')
      await load()
    } catch {
      toast.error('שגיאה במחיקה')
    }
  }

  const handleSeed = async () => {
    try {
      await forWhomAudienceService.seed()
      toast.success('נוצרו כרטיסי דוגמה')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'לא ניתן למלא דוגמאות (אולי כבר יש נתונים)')
    }
  }

  const toggleActive = async (row) => {
    try {
      await forWhomAudienceService.update(row._id, { isActive: !row.isActive })
      await load()
    } catch {
      toast.error('שגיאה בעדכון')
    }
  }

  const sorted = [...items].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <PageHeader
          title="למי זה מתאים — כרטיסי דלתות"
          subtitle="התוכן מוצג בדף הבית באתר הלקוחות. כל כרטיס הוא «דלת» שנפתחת במעבר עכבר או במגע."
          backTo="/dashboard"
          backLabel="חזור ללוח הבקרה"
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onClick={openCreate}>
            + כרטיס חדש
          </Button>
          <Button type="button" variant="soft" onClick={handleSeed} disabled={items.length > 0}>
            מילוי 8 כרטיסי דוגמה (רק כשהרשימה ריקה)
          </Button>
        </div>

        {loading ? (
          <p className="text-neutral-600">טוען…</p>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon="🚪"
            title="אין כרטיסים"
            description="הוסיפו כרטיס או לחצו על מילוי דוגמאות כשהמסד ריק."
          />
        ) : (
          <div className="space-y-4">
            {sorted.map((row) => (
              <Card key={row._id} className="border border-neutral-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        סדר: {row.order ?? 0}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          row.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {row.isActive ? 'מוצג באתר' : 'מוסתר'}
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold text-neutral-900">{row.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-neutral-600">{row.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="soft" className="text-sm" onClick={() => openEdit(row)}>
                      עריכה
                    </Button>
                    <Button type="button" variant="soft" className="text-sm" onClick={() => toggleActive(row)}>
                      {row.isActive ? 'הסתר' : 'הצג'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row._id)}
                      className="rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AdminPageShell>

      {modalOpen && (
        <AdminModalLayout
          title={editingId ? 'עריכת כרטיס' : 'כרטיס חדש'}
          onClose={closeModal}
          maxWidthClass="max-w-2xl"
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="soft" onClick={closeModal}>
                ביטול
              </Button>
              <Button type="submit" form="for-whom-form" variant="primary" disabled={saving}>
                {saving ? 'שומר…' : 'שמור'}
              </Button>
            </div>
          }
        >
          <form id="for-whom-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">כותרת</label>
              <input
                className="admin-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="admin-label">תיאור (מופיע מאחורי הדלת)</label>
              <textarea
                className="admin-textarea"
                rows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="admin-label">סדר תצוגה (מספר, אופציונלי)</label>
              <input
                type="number"
                className="admin-input"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                placeholder="ריק = אחרון ברשימה"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              מוצג באתר הלקוחות
            </label>
          </form>
        </AdminModalLayout>
      )}
    </>
  )
}

export default ForWhomAudiencePage
