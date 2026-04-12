import express from 'express'
import TriggerJournalEntry, { PART_OF_DAY_VALUES } from '../models/TriggerJournalEntry.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

function parseEntryDateYmd(ymd) {
  if (!ymd || typeof ymd !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo || dt.getUTCDate() !== d) return null
  return dt
}

function startEndUtcRange(fromYmd, toYmd) {
  const from = parseEntryDateYmd(fromYmd)
  const to = parseEntryDateYmd(toYmd)
  if (!from || !to) return null
  const end = new Date(to)
  end.setUTCDate(end.getUTCDate() + 1)
  return { from, toExclusive: end }
}

// GET /api/auth/trigger-journal?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 60))
    const { from, to } = req.query
    const filter = { customer: req.customerId }

    if (from && to && typeof from === 'string' && typeof to === 'string') {
      const range = startEndUtcRange(from, to)
      if (!range) {
        return res.status(400).json({ message: 'פורמט תאריכים לא תקין (נדרש YYYY-MM-DD)' })
      }
      filter.entryDate = { $gte: range.from, $lt: range.toExclusive }
    }

    const entries = await TriggerJournalEntry.find(filter)
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(limit)
      .lean()

    res.json({
      message: 'נשלף',
      data: entries,
    })
  } catch (e) {
    next(e)
  }
})

// POST /api/auth/trigger-journal
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      entryDate: entryDateRaw,
      partOfDay,
      triggerDescription,
      contextOrBody,
      intensity,
      feelingsNotes,
      copingOrWhatHelped,
      notes,
    } = req.body || {}

    const entryDate = parseEntryDateYmd(
      typeof entryDateRaw === 'string' ? entryDateRaw : ''
    )
    if (!entryDate) {
      return res.status(400).json({ message: 'חסר או לא תקין תאריך (YYYY-MM-DD)' })
    }
    if (!partOfDay || !PART_OF_DAY_VALUES.includes(partOfDay)) {
      return res.status(400).json({ message: 'חסר או לא תקין חלק ביום' })
    }
    if (!triggerDescription || String(triggerDescription).trim().length < 1) {
      return res.status(400).json({ message: 'נא לתאר את התריגר או מה שקרה' })
    }

    let intensityVal = null
    if (intensity != null && intensity !== '') {
      const n = Number(intensity)
      if (!Number.isFinite(n) || n < 1 || n > 10) {
        return res.status(400).json({ message: 'עוצמה חייבת להיות בין 1 ל־10' })
      }
      intensityVal = n
    }

    const doc = await TriggerJournalEntry.create({
      customer: req.customerId,
      entryDate,
      partOfDay,
      triggerDescription: String(triggerDescription).trim(),
      contextOrBody: contextOrBody != null ? String(contextOrBody).trim() : '',
      intensity: intensityVal,
      feelingsNotes: feelingsNotes != null ? String(feelingsNotes).trim() : '',
      copingOrWhatHelped: copingOrWhatHelped != null ? String(copingOrWhatHelped).trim() : '',
      notes: notes != null ? String(notes).trim() : '',
    })

    res.status(201).json({
      message: 'התיעוד נשמר',
      data: doc.toObject(),
    })
  } catch (e) {
    next(e)
  }
})

// PUT /api/auth/trigger-journal/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await TriggerJournalEntry.findOne({
      _id: req.params.id,
      customer: req.customerId,
    })
    if (!entry) {
      return res.status(404).json({ message: 'רשומה לא נמצאה' })
    }

    const {
      entryDate: entryDateRaw,
      partOfDay,
      triggerDescription,
      contextOrBody,
      intensity,
      feelingsNotes,
      copingOrWhatHelped,
      notes,
    } = req.body || {}

    if (entryDateRaw != null) {
      const d = parseEntryDateYmd(String(entryDateRaw))
      if (!d) return res.status(400).json({ message: 'תאריך לא תקין' })
      entry.entryDate = d
    }
    if (partOfDay != null) {
      if (!PART_OF_DAY_VALUES.includes(partOfDay)) {
        return res.status(400).json({ message: 'חלק ביום לא תקין' })
      }
      entry.partOfDay = partOfDay
    }
    if (triggerDescription != null) {
      const t = String(triggerDescription).trim()
      if (!t) return res.status(400).json({ message: 'תיאור התריגר לא יכול להיות ריק' })
      entry.triggerDescription = t
    }
    if (contextOrBody !== undefined) entry.contextOrBody = String(contextOrBody || '').trim()
    if (feelingsNotes !== undefined) entry.feelingsNotes = String(feelingsNotes || '').trim()
    if (copingOrWhatHelped !== undefined) entry.copingOrWhatHelped = String(copingOrWhatHelped || '').trim()
    if (notes !== undefined) entry.notes = String(notes || '').trim()

    if (intensity !== undefined) {
      if (intensity === null || intensity === '') {
        entry.intensity = null
      } else {
        const n = Number(intensity)
        if (!Number.isFinite(n) || n < 1 || n > 10) {
          return res.status(400).json({ message: 'עוצמה חייבת להיות בין 1 ל־10' })
        }
        entry.intensity = n
      }
    }

    await entry.save()
    res.json({ message: 'עודכן', data: entry.toObject() })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/auth/trigger-journal/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const r = await TriggerJournalEntry.deleteOne({
      _id: req.params.id,
      customer: req.customerId,
    })
    if (r.deletedCount === 0) {
      return res.status(404).json({ message: 'רשומה לא נמצאה' })
    }
    res.json({ message: 'נמחק' })
  } catch (e) {
    next(e)
  }
})

export default router
