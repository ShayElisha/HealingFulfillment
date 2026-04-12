import express from 'express'
import BookingTreatmentType from '../models/BookingTreatmentType.js'
import AvailabilityWorkingHours from '../models/AvailabilityWorkingHours.js'
import AvailabilityBlock from '../models/AvailabilityBlock.js'
import AvailabilityTimeOff from '../models/AvailabilityTimeOff.js'
import { computeAvailabilityForDate } from '../services/availabilityService.js'

const router = express.Router()

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const YMD = /^\d{4}-\d{2}-\d{2}$/

// --- סוגי טיפול (משך + רשת) ---
router.get('/availability/treatment-types', async (req, res, next) => {
  try {
    const list = await BookingTreatmentType.find().sort({ order: 1, key: 1 }).lean()
    res.json({ data: list })
  } catch (e) {
    next(e)
  }
})

router.put('/availability/treatment-types/:id', async (req, res, next) => {
  try {
    const { label, durationMinutes, slotStepMinutes, order, active } = req.body
    const doc = await BookingTreatmentType.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'לא נמצא' })
    if (label != null) doc.label = String(label).trim()
    if (durationMinutes != null) {
      const n = Number(durationMinutes)
      if (!Number.isFinite(n) || n < 15 || n > 480) {
        return res.status(400).json({ message: 'durationMinutes בין 15 ל-480' })
      }
      doc.durationMinutes = n
    }
    if (slotStepMinutes != null) {
      const n = Number(slotStepMinutes)
      if (!Number.isFinite(n) || n < 5 || n > 120) {
        return res.status(400).json({ message: 'slotStepMinutes בין 5 ל-120' })
      }
      doc.slotStepMinutes = n
    }
    if (order != null) doc.order = Number(order) || 0
    if (active != null) doc.active = Boolean(active)
    await doc.save()
    res.json({ data: doc })
  } catch (e) {
    next(e)
  }
})

// --- שעות עבודה שבועיות ---
router.get('/availability/working-hours', async (req, res, next) => {
  try {
    const list = await AvailabilityWorkingHours.find().sort({ dayOfWeek: 1, startTime: 1 }).lean()
    res.json({ data: list })
  } catch (e) {
    next(e)
  }
})

router.post('/availability/working-hours', async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime, treatmentKey } = req.body
    const d = Number(dayOfWeek)
    if (!Number.isInteger(d) || d < 0 || d > 6) {
      return res.status(400).json({ message: 'dayOfWeek חייב 0–6' })
    }
    if (!HHMM.test(String(startTime || '')) || !HHMM.test(String(endTime || ''))) {
      return res.status(400).json({ message: 'שעות בפורמט HH:mm' })
    }
    const doc = await AvailabilityWorkingHours.create({
      dayOfWeek: d,
      startTime: String(startTime).trim(),
      endTime: String(endTime).trim(),
      treatmentKey: treatmentKey ? String(treatmentKey).trim().toLowerCase() : null,
    })
    res.status(201).json({ data: doc })
  } catch (e) {
    next(e)
  }
})

router.delete('/availability/working-hours/:id', async (req, res, next) => {
  try {
    const r = await AvailabilityWorkingHours.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ message: 'לא נמצא' })
    res.json({ message: 'נמחק' })
  } catch (e) {
    next(e)
  }
})

// --- חסימות ---
router.get('/availability/blocks', async (req, res, next) => {
  try {
    const list = await AvailabilityBlock.find().sort({ createdAt: -1 }).lean()
    res.json({ data: list })
  } catch (e) {
    next(e)
  }
})

router.post('/availability/blocks', async (req, res, next) => {
  try {
    const { kind, onceDateKey, dayOfWeek, fullDay, startTime, endTime, treatmentKey, note } = req.body
    const k = kind === 'weekly' ? 'weekly' : 'once'
    if (k === 'once') {
      if (!onceDateKey || !YMD.test(String(onceDateKey).trim())) {
        return res.status(400).json({ message: 'חסימה חד־פעמית דורשת onceDateKey בפורמט YYYY-MM-DD' })
      }
    } else {
      const d = Number(dayOfWeek)
      if (!Number.isInteger(d) || d < 0 || d > 6) {
        return res.status(400).json({ message: 'חסימה שבועית דורשת dayOfWeek 0–6' })
      }
    }
    const fd = Boolean(fullDay)
    if (!fd) {
      if (!startTime || !endTime || !HHMM.test(String(startTime)) || !HHMM.test(String(endTime))) {
        return res.status(400).json({ message: 'מלא יום או startTime/endTime תקינים' })
      }
    }
    const doc = await AvailabilityBlock.create({
      kind: k,
      onceDateKey: k === 'once' ? String(onceDateKey).trim() : null,
      dayOfWeek: k === 'weekly' ? Number(dayOfWeek) : null,
      fullDay: fd,
      startTime: fd ? null : String(startTime).trim(),
      endTime: fd ? null : String(endTime).trim(),
      treatmentKey: treatmentKey ? String(treatmentKey).trim().toLowerCase() : null,
      note: note ? String(note).trim().slice(0, 200) : '',
    })
    res.status(201).json({ data: doc })
  } catch (e) {
    next(e)
  }
})

router.delete('/availability/blocks/:id', async (req, res, next) => {
  try {
    const r = await AvailabilityBlock.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ message: 'לא נמצא' })
    res.json({ message: 'נמחק' })
  } catch (e) {
    next(e)
  }
})

// --- חופשות ---
router.get('/availability/time-off', async (req, res, next) => {
  try {
    const list = await AvailabilityTimeOff.find().sort({ startDate: -1 }).lean()
    res.json({ data: list })
  } catch (e) {
    next(e)
  }
})

router.post('/availability/time-off', async (req, res, next) => {
  try {
    const { startDate, endDate, note } = req.body
    const s = new Date(startDate)
    const e = new Date(endDate)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return res.status(400).json({ message: 'תאריכים לא תקינים' })
    }
    s.setHours(0, 0, 0, 0)
    e.setHours(23, 59, 59, 999)
    if (s > e) return res.status(400).json({ message: 'תאריך התחלה אחרי סיום' })
    const doc = await AvailabilityTimeOff.create({
      startDate: s,
      endDate: e,
      note: note ? String(note).trim().slice(0, 200) : '',
    })
    res.status(201).json({ data: doc })
  } catch (e) {
    next(e)
  }
})

router.delete('/availability/time-off/:id', async (req, res, next) => {
  try {
    const r = await AvailabilityTimeOff.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ message: 'לא נמצא' })
    res.json({ message: 'נמחק' })
  } catch (e) {
    next(e)
  }
})

// תצוגת בדיקה: אילו שעות ייפתחו ללקוח
router.get('/availability/preview', async (req, res, next) => {
  try {
    const { date, meetingType, isIntroMeeting } = req.query
    if (!date) return res.status(400).json({ message: 'חסר date' })
    const mt = meetingType === 'zoom' ? 'zoom' : 'frontend'
    const intro =
      isIntroMeeting === true ||
      isIntroMeeting === 'true' ||
      isIntroMeeting === '1'
    const computed = await computeAvailabilityForDate(String(date), mt, intro)
    res.json({ data: computed })
  } catch (e) {
    next(e)
  }
})

export default router
