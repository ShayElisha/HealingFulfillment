import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import AdminPageShell from '../components/AdminPageShell'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import { availabilitySettingsService } from '../services/adminApi'
import toast from 'react-hot-toast'

const DOW = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function AvailabilityPage() {
  const [treatmentTypes, setTreatmentTypes] = useState([])
  const [workingHours, setWorkingHours] = useState([])
  const [blocks, setBlocks] = useState([])
  const [timeOffs, setTimeOffs] = useState([])
  const [loading, setLoading] = useState(true)

  const [whForm, setWhForm] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '18:00',
    treatmentKey: '',
  })

  const [blockForm, setBlockForm] = useState({
    kind: 'once',
    onceDateKey: todayYmd(),
    dayOfWeek: 0,
    fullDay: false,
    startTime: '12:00',
    endTime: '13:00',
    treatmentKey: '',
    note: '',
  })

  const [offForm, setOffForm] = useState({
    startDate: todayYmd(),
    endDate: todayYmd(),
    note: '',
  })

  const [previewDate, setPreviewDate] = useState(todayYmd())
  const [previewMeeting, setPreviewMeeting] = useState('frontend')
  const [previewIntro, setPreviewIntro] = useState('true')
  const [previewResult, setPreviewResult] = useState(null)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [tt, wh, bl, to] = await Promise.all([
        availabilitySettingsService.getTreatmentTypes(),
        availabilitySettingsService.getWorkingHours(),
        availabilitySettingsService.getBlocks(),
        availabilitySettingsService.getTimeOff(),
      ])
      setTreatmentTypes(tt?.data || [])
      setWorkingHours(wh?.data || [])
      setBlocks(bl?.data || [])
      setTimeOffs(to?.data || [])
    } catch (e) {
      console.error(e)
      toast.error('שגיאה בטעינת נתוני זמינות')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const saveTreatment = async (row) => {
    try {
      await availabilitySettingsService.updateTreatmentType(row._id, {
        label: row.label,
        durationMinutes: row.durationMinutes,
        slotStepMinutes: row.slotStepMinutes,
        order: row.order,
        active: row.active,
      })
      toast.success('עודכן')
      await loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'שגיאה בשמירה')
    }
  }

  const addWorkingHour = async (e) => {
    e.preventDefault()
    try {
      await availabilitySettingsService.addWorkingHours({
        dayOfWeek: Number(whForm.dayOfWeek),
        startTime: whForm.startTime,
        endTime: whForm.endTime,
        treatmentKey: whForm.treatmentKey || null,
      })
      toast.success('נוסף חלון שעות')
      setWhForm((f) => ({ ...f, startTime: '09:00', endTime: '18:00' }))
      await loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'שגיאה')
    }
  }

  const addBlock = async (e) => {
    e.preventDefault()
    try {
      await availabilitySettingsService.addBlock({
        kind: blockForm.kind,
        onceDateKey: blockForm.kind === 'once' ? blockForm.onceDateKey : undefined,
        dayOfWeek: blockForm.kind === 'weekly' ? Number(blockForm.dayOfWeek) : undefined,
        fullDay: blockForm.fullDay,
        startTime: blockForm.fullDay ? undefined : blockForm.startTime,
        endTime: blockForm.fullDay ? undefined : blockForm.endTime,
        treatmentKey: blockForm.treatmentKey || null,
        note: blockForm.note,
      })
      toast.success('נוספה חסימה')
      await loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'שגיאה')
    }
  }

  const addOff = async (e) => {
    e.preventDefault()
    try {
      await availabilitySettingsService.addTimeOff({
        startDate: offForm.startDate,
        endDate: offForm.endDate,
        note: offForm.note,
      })
      toast.success('נוספה חופשה')
      await loadAll()
    } catch (e) {
      toast.error(e.response?.data?.message || 'שגיאה')
    }
  }

  const runPreview = async () => {
    try {
      const res = await availabilitySettingsService.preview({
        date: previewDate,
        meetingType: previewMeeting,
        isIntroMeeting: previewIntro,
      })
      setPreviewResult(res?.data || null)
    } catch (e) {
      toast.error(e.response?.data?.message || 'שגיאה בתצוגה')
      setPreviewResult(null)
    }
  }

  return (
    <>
      <Navbar />
      <AdminPageShell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <PageHeader
            title="ניהול זמינות קביעת פגישות"
            subtitle="שעות עבודה, חסימות, חופשות ומשך לפי סוג פגישה — משפיע על טופס קביעת הפגישה באתר הלקוחות"
          />

          {loading ? (
            <p className="text-neutral-600">טוען…</p>
          ) : (
            <div className="space-y-8">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">סוגי פגישה (משך ורשת שעות)</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  מפתחות: <code className="text-xs bg-neutral-100 px-1 rounded">intro</code> — פגישת היכרות,{' '}
                  <code className="text-xs bg-neutral-100 px-1 rounded">frontend</code>,{' '}
                  <code className="text-xs bg-neutral-100 px-1 rounded">zoom</code>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-right">
                        <th className="py-2 px-2">תווית</th>
                        <th className="py-2 px-2">משך (דק׳)</th>
                        <th className="py-2 px-2">ריווח (דק׳)</th>
                        <th className="py-2 px-2">סדר</th>
                        <th className="py-2 px-2">פעיל</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatmentTypes.map((row) => (
                        <TreatmentTypeRow key={row._id} row={row} onSave={saveTreatment} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">שעות עבודה שבועיות</h2>
                <p className="text-sm text-neutral-600 mb-4">
                  יום בלי רשומות — סגור לקביעה. רשומה ללא סוג — לכל סוגי הפגישות. רשומה עם סוג — מחליפה את הכלל
                  הכללי לאותו יום.
                </p>
                <form onSubmit={addWorkingHour} className="flex flex-wrap gap-3 items-end mb-6">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">יום</label>
                    <select
                      value={whForm.dayOfWeek}
                      onChange={(e) => setWhForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    >
                      {DOW.map((label, i) => (
                        <option key={label} value={i}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">התחלה</label>
                    <input
                      type="time"
                      value={whForm.startTime}
                      onChange={(e) => setWhForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">סיום</label>
                    <input
                      type="time"
                      value={whForm.endTime}
                      onChange={(e) => setWhForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">סוג (ריק = כולם)</label>
                    <select
                      value={whForm.treatmentKey}
                      onChange={(e) => setWhForm((f) => ({ ...f, treatmentKey: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    >
                      <option value="">הכל</option>
                      {treatmentTypes.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label} ({t.key})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" variant="primary">
                    הוסף
                  </Button>
                </form>
                <ul className="space-y-2">
                  {workingHours.map((w) => (
                    <li
                      key={w._id}
                      className="flex flex-wrap items-center justify-between gap-2 border border-neutral-100 rounded-lg px-3 py-2"
                    >
                      <span>
                        {DOW[w.dayOfWeek]} · {w.startTime}–{w.endTime}
                        {w.treatmentKey ? ` · ${w.treatmentKey}` : ' · כל הסוגים'}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('למחוק?')) return
                          try {
                            await availabilitySettingsService.deleteWorkingHours(w._id)
                            toast.success('נמחק')
                            await loadAll()
                          } catch (e) {
                            toast.error('שגיאה')
                          }
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        מחק
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">חסימות</h2>
                <p className="text-sm text-neutral-600 mb-4">חד־פעמי לפי תאריך, או חוזר מדי שבוע ביום נתון.</p>
                <form onSubmit={addBlock} className="space-y-4 mb-6">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={blockForm.kind === 'once'}
                        onChange={() => setBlockForm((f) => ({ ...f, kind: 'once' }))}
                      />
                      חד־פעמי
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={blockForm.kind === 'weekly'}
                        onChange={() => setBlockForm((f) => ({ ...f, kind: 'weekly' }))}
                      />
                      שבועי
                    </label>
                  </div>
                  {blockForm.kind === 'once' ? (
                    <div>
                      <label className="block text-xs text-neutral-600 mb-1">תאריך</label>
                      <input
                        type="date"
                        value={blockForm.onceDateKey}
                        onChange={(e) => setBlockForm((f) => ({ ...f, onceDateKey: e.target.value }))}
                        className="rounded-lg border border-neutral-300 px-3 py-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-neutral-600 mb-1">יום בשבוע</label>
                      <select
                        value={blockForm.dayOfWeek}
                        onChange={(e) => setBlockForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                        className="rounded-lg border border-neutral-300 px-3 py-2"
                      >
                        {DOW.map((label, i) => (
                          <option key={label} value={i}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={blockForm.fullDay}
                      onChange={(e) => setBlockForm((f) => ({ ...f, fullDay: e.target.checked }))}
                    />
                    יום שלם
                  </label>
                  {!blockForm.fullDay && (
                    <div className="flex gap-3">
                      <input
                        type="time"
                        value={blockForm.startTime}
                        onChange={(e) => setBlockForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="rounded-lg border border-neutral-300 px-3 py-2"
                      />
                      <input
                        type="time"
                        value={blockForm.endTime}
                        onChange={(e) => setBlockForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="rounded-lg border border-neutral-300 px-3 py-2"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">סוג (ריק = כולם)</label>
                    <select
                      value={blockForm.treatmentKey}
                      onChange={(e) => setBlockForm((f) => ({ ...f, treatmentKey: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    >
                      <option value="">הכל</option>
                      {treatmentTypes.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="הערה (אופציונלי)"
                    value={blockForm.note}
                    onChange={(e) => setBlockForm((f) => ({ ...f, note: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                  <Button type="submit" variant="primary">
                    הוסף חסימה
                  </Button>
                </form>
                <ul className="space-y-2">
                  {blocks.map((b) => (
                    <li
                      key={b._id}
                      className="flex flex-wrap items-center justify-between gap-2 border border-neutral-100 rounded-lg px-3 py-2 text-sm"
                    >
                      <span>
                        {b.kind === 'once' ? `בתאריך ${b.onceDateKey}` : `כל ${DOW[b.dayOfWeek]}`}
                        {b.fullDay ? ' · יום שלם' : ` · ${b.startTime}–${b.endTime}`}
                        {b.treatmentKey ? ` · ${b.treatmentKey}` : ''}
                        {b.note ? ` — ${b.note}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('למחוק?')) return
                          try {
                            await availabilitySettingsService.deleteBlock(b._id)
                            toast.success('נמחק')
                            await loadAll()
                          } catch (e) {
                            toast.error('שגיאה')
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        מחק
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">חופשות (טווח תאריכים)</h2>
                <form onSubmit={addOff} className="flex flex-wrap gap-3 items-end mb-6">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">מ־</label>
                    <input
                      type="date"
                      value={offForm.startDate}
                      onChange={(e) => setOffForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">עד</label>
                    <input
                      type="date"
                      value={offForm.endDate}
                      onChange={(e) => setOffForm((f) => ({ ...f, endDate: e.target.value }))}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="הערה"
                    value={offForm.note}
                    onChange={(e) => setOffForm((f) => ({ ...f, note: e.target.value }))}
                    className="rounded-lg border border-neutral-300 px-3 py-2 flex-1 min-w-[12rem]"
                  />
                  <Button type="submit" variant="primary">
                    הוסף חופשה
                  </Button>
                </form>
                <ul className="space-y-2">
                  {timeOffs.map((o) => (
                    <li
                      key={o._id}
                      className="flex flex-wrap items-center justify-between gap-2 border border-neutral-100 rounded-lg px-3 py-2 text-sm"
                    >
                      <span>
                        {new Date(o.startDate).toLocaleDateString('he-IL')} –{' '}
                        {new Date(o.endDate).toLocaleDateString('he-IL')}
                        {o.note ? ` — ${o.note}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('למחוק?')) return
                          try {
                            await availabilitySettingsService.deleteTimeOff(o._id)
                            toast.success('נמחק')
                            await loadAll()
                          } catch (e) {
                            toast.error('שגיאה')
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        מחק
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">תצוגת בדיקה (כמו באתר)</h2>
                <div className="flex flex-wrap gap-3 items-end mb-4">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">תאריך</label>
                    <input
                      type="date"
                      value={previewDate}
                      onChange={(e) => setPreviewDate(e.target.value)}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">סוג פגישה</label>
                    <select
                      value={previewMeeting}
                      onChange={(e) => setPreviewMeeting(e.target.value)}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    >
                      <option value="frontend">פרונטלי</option>
                      <option value="zoom">זום</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">פגישת היכרות</label>
                    <select
                      value={previewIntro}
                      onChange={(e) => setPreviewIntro(e.target.value)}
                      className="rounded-lg border border-neutral-300 px-3 py-2"
                    >
                      <option value="true">כן</option>
                      <option value="false">לא</option>
                    </select>
                  </div>
                  <Button type="button" variant="soft" onClick={runPreview}>
                    חשב שעות זמינות
                  </Button>
                </div>
                {previewResult && (
                  <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-4 text-sm">
                    <p className="mb-2">
                      מפתח טיפול: <strong>{previewResult.treatmentKey}</strong> · יום תפוס לחלוטין:{' '}
                      <strong>{previewResult.isDateUnavailable ? 'כן' : 'לא'}</strong>
                    </p>
                    <p className="text-neutral-700">
                      שעות זמינות:{' '}
                      {(previewResult.availableTimes || []).length
                        ? previewResult.availableTimes.join(', ')
                        : 'אין'}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </AdminPageShell>
    </>
  )
}

function TreatmentTypeRow({ row, onSave }) {
  const [local, setLocal] = useState({
    label: row.label,
    durationMinutes: row.durationMinutes,
    slotStepMinutes: row.slotStepMinutes,
    order: row.order,
    active: row.active,
  })

  useEffect(() => {
    setLocal({
      label: row.label,
      durationMinutes: row.durationMinutes,
      slotStepMinutes: row.slotStepMinutes,
      order: row.order,
      active: row.active,
    })
  }, [row])

  return (
    <tr className="border-b border-neutral-100">
      <td className="py-2 px-2">
        <input
          value={local.label}
          onChange={(e) => setLocal((s) => ({ ...s, label: e.target.value }))}
          className="w-full max-w-[10rem] rounded border border-neutral-200 px-2 py-1 text-sm"
        />
        <div className="text-xs text-neutral-400 mt-0.5">{row.key}</div>
      </td>
      <td className="py-2 px-2">
        <input
          type="number"
          min={15}
          max={480}
          value={local.durationMinutes}
          onChange={(e) => setLocal((s) => ({ ...s, durationMinutes: Number(e.target.value) }))}
          className="w-20 rounded border border-neutral-200 px-2 py-1"
        />
      </td>
      <td className="py-2 px-2">
        <input
          type="number"
          min={5}
          max={120}
          value={local.slotStepMinutes}
          onChange={(e) => setLocal((s) => ({ ...s, slotStepMinutes: Number(e.target.value) }))}
          className="w-20 rounded border border-neutral-200 px-2 py-1"
        />
      </td>
      <td className="py-2 px-2">
        <input
          type="number"
          value={local.order}
          onChange={(e) => setLocal((s) => ({ ...s, order: Number(e.target.value) }))}
          className="w-16 rounded border border-neutral-200 px-2 py-1"
        />
      </td>
      <td className="py-2 px-2">
        <input
          type="checkbox"
          checked={local.active}
          onChange={(e) => setLocal((s) => ({ ...s, active: e.target.checked }))}
        />
      </td>
      <td className="py-2 px-2">
        <button
          type="button"
          onClick={() => onSave({ ...row, ...local })}
          className="text-sm text-primary-600 hover:underline"
        >
          שמור
        </button>
      </td>
    </tr>
  )
}

export default AvailabilityPage
