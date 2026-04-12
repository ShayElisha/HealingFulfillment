import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../services/authApi'
import Card from './Card'
import Button from './Button'

const PART_OF_DAY_OPTIONS = [
  { value: 'night', label: 'לילה / אחרי חצות' },
  { value: 'early_morning', label: 'שחר' },
  { value: 'morning', label: 'בוקר' },
  { value: 'noon', label: 'צהריים' },
  { value: 'afternoon', label: 'אחר צהריים' },
  { value: 'evening', label: 'ערב' },
  { value: 'late_evening', label: 'סוף ערב / לפני שינה' },
]

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatEntryDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function partLabel(value) {
  return PART_OF_DAY_OPTIONS.find((o) => o.value === value)?.label || value
}

const emptyForm = () => ({
  entryDate: todayYmd(),
  partOfDay: 'afternoon',
  triggerDescription: '',
  contextOrBody: '',
  intensity: '',
  feelingsNotes: '',
  copingOrWhatHelped: '',
  notes: '',
})

export default function TriggerJournalSection() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const to = todayYmd()
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 90)
      const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`
      const res = await authService.getTriggerJournal({ from, to, limit: 80 })
      setEntries(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      console.error(e)
      toast.error('לא ניתן לטעון את התיעוד')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.triggerDescription.trim()) {
      toast.error('נא לתאר את התריגר או מה שקרה')
      return
    }
    try {
      setSaving(true)
      const payload = {
        entryDate: form.entryDate,
        partOfDay: form.partOfDay,
        triggerDescription: form.triggerDescription.trim(),
        contextOrBody: form.contextOrBody.trim(),
        feelingsNotes: form.feelingsNotes.trim(),
        copingOrWhatHelped: form.copingOrWhatHelped.trim(),
        notes: form.notes.trim(),
      }
      if (form.intensity !== '' && form.intensity != null) {
        payload.intensity = Number(form.intensity)
      }
      await authService.createTriggerJournal(payload)
      toast.success('התיעוד נשמר')
      setForm(emptyForm())
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק את רשומה זו?')) return
    try {
      await authService.deleteTriggerJournal(id)
      toast.success('נמחק')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה במחיקה')
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border border-primary-100 bg-primary-50/30">
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">תיעוד תריגרים</h3>
        <p className="text-sm text-neutral-600 leading-relaxed">
          רישום קצר עוזר להבין דפוסים: מתי ביום זה קרה, מה היה התריגר, ומה עזר. הנתונים נשמרים במערכת
          וזמינים גם למטפל בתיק שלך.
        </p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">רשומה חדשה</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">תאריך</label>
              <input
                type="date"
                required
                value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">מתי ביום?</label>
              <select
                value={form.partOfDay}
                onChange={(e) => setForm({ ...form, partOfDay: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500"
              >
                {PART_OF_DAY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              מה היה התריגר / מה קרה? *
            </label>
            <textarea
              required
              rows={4}
              value={form.triggerDescription}
              onChange={(e) => setForm({ ...form, triggerDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 resize-y min-h-[100px]"
              placeholder="תאר בקצרה..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              איפה בגוף / הקשר (אופציונלי)
            </label>
            <input
              type="text"
              value={form.contextOrBody}
              onChange={(e) => setForm({ ...form, contextOrBody: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300"
              placeholder="למשל: חזה, בטן, לחות, לפני פגישה..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                עוצמה (1–10, אופציונלי)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.intensity}
                onChange={(e) => setForm({ ...form, intensity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                placeholder="ריק אם לא רלוונטי"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">רגשות / מחשבות</label>
              <input
                type="text"
                value={form.feelingsNotes}
                onChange={(e) => setForm({ ...form, feelingsNotes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">מה עזר / מה ניסית</label>
            <textarea
              rows={2}
              value={form.copingOrWhatHelped}
              onChange={(e) => setForm({ ...form, copingOrWhatHelped: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">הערות נוספות</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 resize-y"
            />
          </div>
          <Button type="submit" variant="primary" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'שומר…' : 'שמור תיעוד'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold">הרשומות שלי (90 יום אחרונים)</h3>
          <Button type="button" variant="soft" onClick={load} disabled={loading}>
            רענון
          </Button>
        </div>
        {loading ? (
          <p className="text-neutral-500 text-center py-8">טוען…</p>
        ) : entries.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">עדיין אין רשומות. הוסיפי רשומה ראשונה למעלה.</p>
        ) : (
          <ul className="space-y-4">
            {entries.map((row) => (
              <li
                key={row._id}
                className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-right"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-semibold text-neutral-900">
                      {formatEntryDate(row.entryDate)}
                    </span>
                    <span className="text-neutral-500 mx-2">·</span>
                    <span className="text-primary-700">{partLabel(row.partOfDay)}</span>
                    {row.intensity != null && (
                      <span className="text-sm text-neutral-600 mr-2">עוצמה {row.intensity}/10</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(row._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    מחק
                  </button>
                </div>
                <p className="text-neutral-800 whitespace-pre-wrap">{row.triggerDescription}</p>
                {row.contextOrBody ? (
                  <p className="text-sm text-neutral-600 mt-2">
                    <span className="font-medium">הקשר / גוף: </span>
                    {row.contextOrBody}
                  </p>
                ) : null}
                {row.feelingsNotes ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">רגשות: </span>
                    {row.feelingsNotes}
                  </p>
                ) : null}
                {row.copingOrWhatHelped ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">מה עזר: </span>
                    {row.copingOrWhatHelped}
                  </p>
                ) : null}
                {row.notes ? (
                  <p className="text-sm text-neutral-500 mt-2 whitespace-pre-wrap">{row.notes}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
