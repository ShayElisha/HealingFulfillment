import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import AdminModalLayout from '../components/AdminModalLayout'
import EmptyState from '../components/EmptyState'
import { forWhomAudienceService, forWhomUploadService } from '../services/adminApi'
import toast from 'react-hot-toast'

const emptyForm = {
  title: '',
  description: '',
  order: '',
  isActive: true,
  detailVideoUrl: '',
  detailPageContent: '',
  detailBlocks: [],
}

function mapDetailBlocksFromRow(row) {
  if (!row || !Array.isArray(row.detailBlocks) || row.detailBlocks.length === 0) return []
  return row.detailBlocks
    .map((b) => {
      const type = b.type
      if (type === 'timeline') {
        let pts = []
        if (Array.isArray(b.timelinePoints) && b.timelinePoints.length > 0) {
          pts = b.timelinePoints.map((p) => String(p ?? ''))
        } else if (b.timelineText) {
          pts = String(b.timelineText)
            .split(/\n+/)
            .map((s) => s.trim())
            .filter(Boolean)
        }
        if (pts.length === 0) pts = ['']
        return {
          type: 'timeline',
          timelinePoints: pts,
          audioUrl: '',
          audioTitle: '',
          imageItems: [],
        }
      }
      if (type === 'audio') {
        return {
          type: 'audio',
          timelinePoints: [],
          audioUrl: String(b.audioUrl || ''),
          audioTitle: String(b.audioTitle || ''),
          imageItems: [],
        }
      }
      if (type === 'images') {
        const items =
          Array.isArray(b.imageItems) && b.imageItems.length > 0
            ? b.imageItems.map((i) => ({ url: String(i?.url || ''), caption: String(i?.caption || '') }))
            : [{ url: '', caption: '' }]
        return { type: 'images', timelinePoints: [], audioUrl: '', audioTitle: '', imageItems: items }
      }
      return null
    })
    .filter(Boolean)
}

function newEmptyBlock(type) {
  const base = { timelinePoints: [], audioUrl: '', audioTitle: '', imageItems: [] }
  if (type === 'timeline') return { type: 'timeline', ...base, timelinePoints: [''] }
  if (type === 'images') {
    return { type: 'images', ...base, imageItems: [{ url: '', caption: '' }] }
  }
  return { type, ...base }
}

function blockLabel(type) {
  if (type === 'timeline') return 'ציר זמן (נקודות)'
  if (type === 'audio') return 'אודיו'
  if (type === 'images') return 'תמונות'
  return type
}

function ForWhomAudiencePage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [openBlocks, setOpenBlocks] = useState({})

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
    setOpenBlocks({})
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id)
    setForm({
      title: row.title || '',
      description: row.description || '',
      order: row.order != null ? String(row.order) : '',
      isActive: row.isActive !== false,
      detailVideoUrl: row.detailVideoUrl || '',
      detailPageContent: row.detailPageContent || '',
      detailBlocks: mapDetailBlocksFromRow(row),
    })
    setOpenBlocks({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    setOpenBlocks({})
  }

  const addBlock = (type) => {
    setForm((f) => {
      const nextIndex = f.detailBlocks.length
      setOpenBlocks((prev) => ({ ...prev, [nextIndex]: true }))
      return {
        ...f,
        detailBlocks: [...f.detailBlocks, newEmptyBlock(type)],
      }
    })
  }

  const moveBlock = (index, delta) => {
    setForm((f) => {
      const arr = [...f.detailBlocks]
      const j = index + delta
      if (j < 0 || j >= arr.length) return f
      const t = arr[index]
      arr[index] = arr[j]
      arr[j] = t
      return { ...f, detailBlocks: arr }
    })
  }

  const removeBlock = (index) => {
    setForm((f) => ({
      ...f,
      detailBlocks: f.detailBlocks.filter((_, i) => i !== index),
    }))
    setOpenBlocks((prev) => {
      const next = {}
      Object.entries(prev).forEach(([k, v]) => {
        const n = Number(k)
        if (n < index) next[n] = v
        else if (n > index) next[n - 1] = v
      })
      return next
    })
  }

  const toggleBlockOpen = (index) => {
    setOpenBlocks((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const patchBlock = (index, patch) => {
    setForm((f) => ({
      ...f,
      detailBlocks: f.detailBlocks.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }))
  }

  const patchImageRow = (blockIndex, imgIndex, patch) => {
    setForm((f) => ({
      ...f,
      detailBlocks: f.detailBlocks.map((b, i) => {
        if (i !== blockIndex) return b
        const items = (b.imageItems || []).map((img, j) => (j === imgIndex ? { ...img, ...patch } : img))
        return { ...b, imageItems: items }
      }),
    }))
  }

  const setTimelinePoints = (blockIndex, points) => {
    setForm((f) => ({
      ...f,
      detailBlocks: f.detailBlocks.map((b, i) => (i === blockIndex ? { ...b, timelinePoints: points } : b)),
    }))
  }

  const addImageRow = (blockIndex) => {
    setForm((f) => ({
      ...f,
      detailBlocks: f.detailBlocks.map((b, i) =>
        i === blockIndex ? { ...b, imageItems: [...(b.imageItems || []), { url: '', caption: '' }] } : b
      ),
    }))
  }

  const removeImageRow = (blockIndex, imgIndex) => {
    setForm((f) => ({
      ...f,
      detailBlocks: f.detailBlocks.map((b, i) => {
        if (i !== blockIndex) return b
        const next = (b.imageItems || []).filter((_, j) => j !== imgIndex)
        return { ...b, imageItems: next.length ? next : [{ url: '', caption: '' }] }
      }),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('נדרשים כותרת הדלת ותקציר')
      return
    }
    if (!form.detailPageContent.trim()) {
      toast.error('נדרש תוכן עמוד מלא — לכל דלת דף ציבורי משלו (הכתובת נקבעת אוטומטית)')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
        detailVideoUrl: form.detailVideoUrl.trim(),
        detailPageContent: form.detailPageContent,
        detailBlocks: form.detailBlocks,
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
          subtitle="ניתן להוסיף בלוקים: ציר זמן (נקודות), אודיו ותמונות — העלאה ל-Cloudinary או כתובת ישירה."
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
                    {row._id ? (
                      <p className="mt-1 break-all text-xs text-primary-700" dir="ltr">
                        דף ציבורי: /for-whom/{String(row._id)}
                      </p>
                    ) : null}
                    {row.detailVideoUrl ? (
                      <p className="mt-1 text-xs font-medium text-amber-900">מוגדר סרטון בעמוד</p>
                    ) : null}
                    {Array.isArray(row.detailBlocks) && row.detailBlocks.length > 0 ? (
                      <p className="mt-1 text-xs text-neutral-600">
                        {row.detailBlocks.length} בלוקי תוכן נוספים בעמוד
                      </p>
                    ) : null}
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
          maxWidthClass="max-w-4xl"
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
          <form id="for-whom-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
              <p className="mb-3 text-sm font-semibold text-neutral-800">פרטי כרטיס</p>
              <label className="admin-label">כותרת הדלת (באתר, מעל הדלת)</label>
              <input
                className="admin-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="admin-label">תקציר — תוכן מאחורי הדלת</label>
              <textarea
                className="admin-textarea"
                rows={8}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
              <p className="mb-3 text-sm font-semibold text-neutral-800">מדיה ותוכן עמוד</p>
              <label className="admin-label">קישור לסרטון בעמוד (אופציונלי)</label>
              <input
                className="admin-input"
                dir="ltr"
                type="url"
                value={form.detailVideoUrl}
                onChange={(e) => setForm({ ...form, detailVideoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=… או Vimeo / קישור ישיר ל־mp4"
              />
              <p className="mt-1 text-xs text-neutral-500">
                YouTube, Vimeo או קובץ וידאו ישיר (mp4, webm) — מוצג רחב וברור מתחת לכותרת בדף הציבורי.
              </p>
              <label className="admin-label">תוכן העמוד המלא (הדף הציבורי) — חובה</label>
              <textarea
                className="admin-textarea"
                rows={10}
                value={form.detailPageContent}
                onChange={(e) => setForm({ ...form, detailPageContent: e.target.value })}
                placeholder="הרחבה, הסברים — נפרד מהתקציר שמאחורי הדלת"
                required
              />
            </div>

            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 p-4">
              <p className="admin-label mb-2">בלוקים נוספים בעמוד (אופציונלי)</p>
              <p className="mb-3 text-xs text-neutral-600">
                מופיעים באתר אחרי «המשך לקריאה». ציר זמן = רשימת נקודות. אודיו ותמונות — העלאה ל-Cloudinary (או כתובת
                ישירה).
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button type="button" variant="soft" className="text-sm" onClick={() => addBlock('timeline')}>
                  + ציר זמן (נקודות)
                </Button>
                <Button type="button" variant="soft" className="text-sm" onClick={() => addBlock('audio')}>
                  + אודיו
                </Button>
                <Button type="button" variant="soft" className="text-sm" onClick={() => addBlock('images')}>
                  + תמונות
                </Button>
              </div>

              <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {form.detailBlocks.length === 0 ? (
                  <p className="text-sm text-neutral-500">טרם נוספו בלוקים. לחצו על אחד הכפתורים למעלה.</p>
                ) : (
                  form.detailBlocks.map((block, idx) => (
                    <div key={`block-${idx}`} className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBlockOpen(idx)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-primary-700"
                        >
                          <span>{openBlocks[idx] ? '▾' : '▸'}</span>
                          <span>{blockLabel(block.type)}</span>
                        </button>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="rounded-md border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50"
                            onClick={() => moveBlock(idx, -1)}
                            disabled={idx === 0}
                          >
                            למעלה
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50"
                            onClick={() => moveBlock(idx, 1)}
                            disabled={idx === form.detailBlocks.length - 1}
                          >
                            למטה
                          </button>
                          <button
                            type="button"
                            className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => removeBlock(idx)}
                          >
                            הסר בלוק
                          </button>
                        </div>
                      </div>

                      {openBlocks[idx] && block.type === 'timeline' ? (
                        <div className="space-y-2">
                          <p className="text-xs text-neutral-600">כל שדה = נקודה ברשימה בדף הלקוחות.</p>
                          {(block.timelinePoints || ['']).map((pt, pi) => (
                            <div key={pi} className="flex flex-wrap items-start gap-2">
                              <span className="mt-2 text-xs text-neutral-400">{pi + 1}.</span>
                              <input
                                className="admin-input min-w-[200px] flex-1"
                                value={pt}
                                placeholder={`נקודה ${pi + 1}`}
                                onChange={(e) => {
                                  const next = [...(block.timelinePoints || [''])]
                                  next[pi] = e.target.value
                                  setTimelinePoints(idx, next)
                                }}
                              />
                              <button
                                type="button"
                                className="mt-1 shrink-0 text-xs text-red-600 hover:underline"
                                onClick={() => {
                                  const cur = [...(block.timelinePoints || [''])]
                                  const next = cur.filter((_, i) => i !== pi)
                                  setTimelinePoints(idx, next.length ? next : [''])
                                }}
                              >
                                הסר
                              </button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="soft"
                            className="text-sm"
                            onClick={() => setTimelinePoints(idx, [...(block.timelinePoints || ['']), ''])}
                          >
                            + נקודה
                          </Button>
                        </div>
                      ) : null}

                      {openBlocks[idx] && block.type === 'audio' ? (
                        <div className="space-y-2">
                          <input
                            className="admin-input"
                            placeholder="כותרת להצגה (אופציונלי)"
                            value={block.audioTitle}
                            onChange={(e) => patchBlock(idx, { audioTitle: e.target.value })}
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              id={`forwhom-audio-${idx}`}
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                if (!file) return
                                try {
                                  const res = await forWhomUploadService.uploadAudio(file)
                                  const url = res?.data?.url
                                  if (url) {
                                    patchBlock(idx, { audioUrl: url })
                                    toast.success('קובץ האודיו הועלה')
                                  }
                                } catch (err) {
                                  toast.error(err.response?.data?.message || 'העלאה נכשלה')
                                }
                              }}
                            />
                            <label
                              htmlFor={`forwhom-audio-${idx}`}
                              className="cursor-pointer rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                            >
                              העלאת אודיו ל-Cloudinary
                            </label>
                            {block.audioUrl ? (
                              <span className="max-w-[min(100%,280px)] truncate text-xs text-green-800" dir="ltr" title={block.audioUrl}>
                                נטען
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-500">לא הועלה קובץ</span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500">אופציונלי: כתובת ישירה לקובץ (להשלמת ההעלאה)</p>
                          <input
                            className="admin-input"
                            dir="ltr"
                            type="text"
                            placeholder="כתובת URL מלאה (למשל מ-Cloudinary)"
                            value={block.audioUrl}
                            onChange={(e) => patchBlock(idx, { audioUrl: e.target.value })}
                          />
                        </div>
                      ) : null}

                      {openBlocks[idx] && block.type === 'images' ? (
                        <div className="space-y-3">
                          {(block.imageItems || []).map((img, j) => (
                            <div key={`img-${idx}-${j}`} className="rounded-md border border-neutral-100 p-2">
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    id={`forwhom-img-${idx}-${j}`}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0]
                                      e.target.value = ''
                                      if (!file) return
                                      try {
                                        const res = await forWhomUploadService.uploadImage(file)
                                        const url = res?.data?.url
                                        if (url) {
                                          patchImageRow(idx, j, { url })
                                          toast.success('התמונה הועלתה')
                                        }
                                      } catch (err) {
                                        toast.error(err.response?.data?.message || 'העלאה נכשלה')
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`forwhom-img-${idx}-${j}`}
                                    className="cursor-pointer rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                                  >
                                    העלאת תמונה ל-Cloudinary
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  className="text-xs text-red-600 hover:underline"
                                  onClick={() => removeImageRow(idx, j)}
                                >
                                  הסר תמונה
                                </button>
                              </div>
                              <input
                                className="admin-input mb-2"
                                dir="ltr"
                                type="text"
                                placeholder="או כתובת תמונה (URL)"
                                value={img.url}
                                onChange={(e) => patchImageRow(idx, j, { url: e.target.value })}
                              />
                              {img.url ? (
                                <p className="mb-2 truncate text-xs text-neutral-500" dir="ltr" title={img.url}>
                                  קובץ נטען: {img.url}
                                </p>
                              ) : null}
                              <input
                                className="admin-input"
                                placeholder="כיתוב (אופציונלי)"
                                value={img.caption}
                                onChange={(ev) => patchImageRow(idx, j, { caption: ev.target.value })}
                              />
                            </div>
                          ))}
                          <Button type="button" variant="soft" className="text-sm" onClick={() => addImageRow(idx)}>
                            + תמונה נוספת
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
              <p className="mb-3 text-sm font-semibold text-neutral-800">הגדרות פרסום</p>
              <label className="admin-label">סדר תצוגה (מספר, אופציונלי)</label>
              <input
                type="number"
                className="admin-input"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                placeholder="ריק = אחרון ברשימה"
              />
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                מוצג באתר הלקוחות
              </label>
            </div>
          </form>
        </AdminModalLayout>
      )}
    </>
  )
}

export default ForWhomAudiencePage
