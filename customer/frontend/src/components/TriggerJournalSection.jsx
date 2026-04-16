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

const BREATHING_OPTIONS = [
  { value: 'unaware_held', label: '1 עצורה לא מודעת' },
  { value: 'fast_contracted', label: '2 מהירה מכווצת' },
  { value: 'regular_flowing', label: '3 סדירה זורמת' },
  { value: 'not_noticed', label: '4 לא שמתי לב' },
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
  thoughts: '',
  breathingType: 'not_noticed',
  contextOrBody: '',
  intensity: '',
  feelingsNotes: '',
  bodySensations: '',
  lessonLearned: '',
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
        thoughts: form.thoughts.trim(),
        breathingType: form.breathingType,
        contextOrBody: form.contextOrBody.trim(),
        feelingsNotes: form.feelingsNotes.trim(),
        bodySensations: form.bodySensations.trim(),
        lessonLearned: form.lessonLearned.trim(),
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
          רישום קצר עוזר להבין דפוסים: אופי האירוע, המחשבות והתחושות בגוף, הנשימה והעוצמה.
          הנתונים נשמרים במערכת
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
              אופי האירוע *
            </label>
            <textarea
              required
              rows={4}
              value={form.triggerDescription}
              onChange={(e) => setForm({ ...form, triggerDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 resize-y min-h-[100px]"
              placeholder="מה קרה באירוע?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              מה היו המחשבות שלי
            </label>
            <textarea
              rows={2}
              value={form.thoughts}
              onChange={(e) => setForm({ ...form, thoughts: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 resize-y"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">נשימה</label>
              <select
                value={form.breathingType}
                onChange={(e) => setForm({ ...form, breathingType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500"
              >
                {BREATHING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                עוצמה
              </label>
              <select
                value={form.intensity}
                onChange={(e) => setForm({ ...form, intensity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300"
              >
                <option value="">בחרי עוצמה</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              מה הרגשתי
            </label>
            <textarea
              rows={2}
              value={form.feelingsNotes}
              onChange={(e) => setForm({ ...form, feelingsNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              תחושות בגוף
            </label>
            <textarea
              rows={2}
              value={form.bodySensations}
              onChange={(e) => setForm({ ...form, bodySensations: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">מה לדעתך השיעור שלך?</label>
            <textarea
              rows={2}
              value={form.lessonLearned}
              onChange={(e) => setForm({ ...form, lessonLearned: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">הערות אישיות</label>
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
                    <span className="font-medium">הקשר: </span>
                    {row.contextOrBody}
                  </p>
                ) : null}
                {row.thoughts ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">מחשבות: </span>
                    {row.thoughts}
                  </p>
                ) : null}
                {row.feelingsNotes ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">רגשות: </span>
                    {row.feelingsNotes}
                  </p>
                ) : null}
                <p className="text-sm text-neutral-600 mt-1">
                  <span className="font-medium">נשימה: </span>
                  {BREATHING_OPTIONS.find((o) => o.value === row.breathingType)?.label ||
                    BREATHING_OPTIONS.find((o) => o.value === 'not_noticed')?.label}
                </p>
                {row.bodySensations ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">תחושות בגוף: </span>
                    {row.bodySensations}
                  </p>
                ) : null}
                {row.lessonLearned ? (
                  <p className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">השיעור שלי: </span>
                    {row.lessonLearned}
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
