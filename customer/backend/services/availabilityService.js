import BookingTreatmentType from '../models/BookingTreatmentType.js'
import AvailabilityWorkingHours from '../models/AvailabilityWorkingHours.js'
import AvailabilityBlock from '../models/AvailabilityBlock.js'
import AvailabilityTimeOff from '../models/AvailabilityTimeOff.js'
import Booking from '../models/Booking.js'

/** 0 = ללא מטמון — עדכוני פגישות מהמנהל יופיעו מיד בזמינות (שני תהליכי Node לא חולקים Map) */
const AVAILABILITY_CACHE_TTL_MS = 0
const availabilityResultCache = new Map()

function cacheGet(key) {
  if (AVAILABILITY_CACHE_TTL_MS <= 0) return null
  const entry = availabilityResultCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    availabilityResultCache.delete(key)
    return null
  }
  return JSON.parse(entry.serialized)
}

function cacheSet(key, value) {
  if (AVAILABILITY_CACHE_TTL_MS <= 0) return
  try {
    availabilityResultCache.set(key, {
      serialized: JSON.stringify(value),
      expires: Date.now() + AVAILABILITY_CACHE_TTL_MS,
    })
  } catch {
    /* לא שומרים במטמון אם לא ניתן לסריאליזציה */
  }
}

function minutesFromMidnight(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function hhmmFromMinutes(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function resolveTreatmentKey(meetingType, isIntroMeeting) {
  if (isIntroMeeting === true || isIntroMeeting === 'true') return 'intro'
  if (meetingType === 'zoom') return 'zoom'
  return 'frontend'
}

export function parseLocalDateOnly(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(y, mo, d, 0, 0, 0, 0)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

export function formatYmd(localDate) {
  const y = localDate.getFullYear()
  const mo = String(localDate.getMonth() + 1).padStart(2, '0')
  const day = String(localDate.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function atLocalMidnightFromParts(y, mo, day) {
  return new Date(y, mo, day, 0, 0, 0, 0)
}

function rangesOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1
}

function mergeIntervals(intervals) {
  if (!intervals.length) return []
  const sorted = [...intervals].sort((x, y) => x[0] - y[0])
  const out = []
  let cs = sorted[0][0]
  let ce = sorted[0][1]
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i]
    if (s <= ce) ce = Math.max(ce, e)
    else {
      out.push([cs, ce])
      cs = s
      ce = e
    }
  }
  out.push([cs, ce])
  return out
}

async function ensureDefaults() {
  const tc = await BookingTreatmentType.countDocuments()
  if (tc === 0) {
    await BookingTreatmentType.insertMany([
      { key: 'intro', label: 'פגישת היכרות', durationMinutes: 60, slotStepMinutes: 30, order: 0 },
      { key: 'frontend', label: 'פגישה פרונטלית', durationMinutes: 60, slotStepMinutes: 30, order: 1 },
      { key: 'zoom', label: 'פגישת אונליין', durationMinutes: 60, slotStepMinutes: 30, order: 2 },
    ])
  }
  const wh = await AvailabilityWorkingHours.countDocuments()
  if (wh === 0) {
    const days = [0, 1, 2, 3, 4]
    await AvailabilityWorkingHours.insertMany(
      days.map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
        treatmentKey: null,
      }))
    )
  }
}

async function getWorkingIntervalsMinutes(dayOfWeek, treatmentKey) {
  const specific = await AvailabilityWorkingHours.find({
    dayOfWeek,
    treatmentKey,
  }).lean()
  const generic = await AvailabilityWorkingHours.find({
    dayOfWeek,
    $or: [{ treatmentKey: null }, { treatmentKey: { $exists: false } }],
  }).lean()

  const rules = specific.length > 0 ? specific : generic
  const intervals = []
  for (const r of rules) {
    const s = minutesFromMidnight(r.startTime)
    const e = minutesFromMidnight(r.endTime)
    if (e > s) intervals.push([s, e])
  }
  return mergeIntervals(intervals)
}

async function isDayFullyTimeOff(localDate) {
  const y = localDate.getFullYear()
  const mo = localDate.getMonth()
  const d = localDate.getDate()
  const start = atLocalMidnightFromParts(y, mo, d)
  const end = new Date(y, mo, d, 23, 59, 59, 999)
  const offs = await AvailabilityTimeOff.find().lean()
  for (const o of offs) {
    const os = new Date(o.startDate)
    os.setHours(0, 0, 0, 0)
    const oe = new Date(o.endDate)
    oe.setHours(23, 59, 59, 999)
    if (start <= oe && end >= os) return true
  }
  return false
}

async function hasFullDayBookingHold(localDate) {
  const y = localDate.getFullYear()
  const mo = localDate.getMonth()
  const d = localDate.getDate()
  const dateStart = atLocalMidnightFromParts(y, mo, d)
  const dateEnd = new Date(y, mo, d, 23, 59, 59, 999)
  const found = await Booking.findOne({
    preferredDate: { $gte: dateStart, $lte: dateEnd },
    status: { $in: ['pending', 'confirmed'] },
    $or: [{ preferredTime: { $exists: false } }, { preferredTime: null }, { preferredTime: '' }],
  })
    .select('_id')
    .lean()
  return Boolean(found)
}

async function getBlockIntervalsMinutes(ymdKey, dow, treatmentKey) {
  const blocks = await AvailabilityBlock.find({
    $or: [{ kind: 'once', onceDateKey: ymdKey }, { kind: 'weekly', dayOfWeek: dow }],
  }).lean()

  const out = []
  for (const b of blocks) {
    if (b.treatmentKey && b.treatmentKey !== treatmentKey) continue
    if (b.kind === 'once' && b.onceDateKey !== ymdKey) continue
    if (b.fullDay) {
      out.push([0, 24 * 60])
      continue
    }
    if (b.startTime && b.endTime) {
      const s = minutesFromMidnight(b.startTime)
      const e = minutesFromMidnight(b.endTime)
      if (e > s) out.push([s, e])
    }
  }
  return mergeIntervals(out)
}

async function getDurationMinutesByTreatmentKey() {
  const types = await BookingTreatmentType.find({}).select('key durationMinutes').lean()
  const map = {}
  for (const t of types) {
    if (!t?.key) continue
    const n = Number(t.durationMinutes)
    map[t.key] = Number.isFinite(n) && n > 0 ? n : 60
  }
  return map
}

/** חלונות תפוסים לפי משך האמת של כל פגישה (סוג פגישה), לא לפי הסוג שנבחר בתצוגה */
async function getBookedBusyIntervals(localDate) {
  const y = localDate.getFullYear()
  const mo = localDate.getMonth()
  const d = localDate.getDate()
  const dateStart = atLocalMidnightFromParts(y, mo, d)
  const dateEnd = new Date(y, mo, d, 23, 59, 59, 999)

  const durationByKey = await getDurationMinutesByTreatmentKey()
  const fallbackMinutes = 60

  const activeBookings = await Booking.find({
    preferredDate: { $gte: dateStart, $lte: dateEnd },
    status: { $in: ['pending', 'confirmed'] },
  })
    .select('preferredTime meetingType isIntroMeeting')
    .lean()

  const booked = []
  for (const bk of activeBookings) {
    const t = bk.preferredTime
    if (!t || typeof t !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.trim())) continue
    const start = minutesFromMidnight(t.trim())
    const key = resolveTreatmentKey(bk.meetingType, bk.isIntroMeeting)
    const dur = durationByKey[key] ?? fallbackMinutes
    booked.push([start, start + dur])
  }
  return mergeIntervals(booked)
}

function slotConflicts(slotStart, duration, busyIntervals) {
  const slotEnd = slotStart + duration
  for (const [b0, b1] of busyIntervals) {
    if (rangesOverlap(slotStart, slotEnd, b0, b1)) return true
  }
  return false
}

export async function computeAvailabilityForDate(dateStr, meetingType, isIntroMeeting) {
  await ensureDefaults()
  const localDate = parseLocalDateOnly(dateStr)
  if (!localDate) {
    return {
      error: 'Invalid date',
      date: dateStr,
      treatmentKey: resolveTreatmentKey(meetingType, isIntroMeeting),
      availableTimes: [],
      unavailableTimes: [],
      isDateUnavailable: true,
    }
  }

  const ymdKeyEarly = formatYmd(localDate)
  const cacheKey = `day:${ymdKeyEarly}:${meetingType}:${isIntroMeeting}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const treatmentKey = resolveTreatmentKey(meetingType, isIntroMeeting)
  const typeDoc = await BookingTreatmentType.findOne({ key: treatmentKey, active: true }).lean()
  const duration = typeDoc?.durationMinutes ?? 60
  const step = typeDoc?.slotStepMinutes ?? 30
  const ymdKey = formatYmd(localDate)
  const dow = localDate.getDay()

  if (await isDayFullyTimeOff(localDate)) {
    const out = {
      date: ymdKey,
      treatmentKey,
      availableTimes: [],
      unavailableTimes: [],
      isDateUnavailable: true,
    }
    cacheSet(cacheKey, out)
    return out
  }

  if (await hasFullDayBookingHold(localDate)) {
    const out = {
      date: ymdKey,
      treatmentKey,
      availableTimes: [],
      unavailableTimes: [],
      isDateUnavailable: true,
    }
    cacheSet(cacheKey, out)
    return out
  }

  let workIntervals = await getWorkingIntervalsMinutes(dow, treatmentKey)
  if (workIntervals.length === 0) {
    workIntervals = await getWorkingIntervalsMinutes(dow, null)
  }

  if (workIntervals.length === 0) {
    const out = {
      date: ymdKey,
      treatmentKey,
      availableTimes: [],
      unavailableTimes: [],
      isDateUnavailable: true,
    }
    cacheSet(cacheKey, out)
    return out
  }

  const blockIntervals = await getBlockIntervalsMinutes(ymdKey, dow, treatmentKey)
  const bookedIntervals = await getBookedBusyIntervals(localDate)
  const busy = mergeIntervals([...blockIntervals, ...bookedIntervals])

  const availableTimes = []
  const allSlotsInWork = []
  for (const [ws, we] of workIntervals) {
    for (let sm = ws; sm + duration <= we; sm += step) {
      const label = hhmmFromMinutes(sm)
      allSlotsInWork.push(label)
      if (!slotConflicts(sm, duration, busy)) {
        availableTimes.push(label)
      }
    }
  }

  const unavailableTimes = allSlotsInWork.filter((t) => !availableTimes.includes(t))
  const isDateUnavailable = availableTimes.length === 0

  const out = {
    date: ymdKey,
    treatmentKey,
    availableTimes,
    unavailableTimes,
    isDateUnavailable,
  }
  cacheSet(cacheKey, out)
  return out
}

export async function isPreferredTimeAllowed(dateStr, preferredTime, meetingType, isIntroMeeting) {
  if (!preferredTime || String(preferredTime).trim() === '') return true
  const result = await computeAvailabilityForDate(dateStr, meetingType, isIntroMeeting)
  if (result.error) return false
  return result.availableTimes.includes(String(preferredTime).trim())
}

const DOW_LABELS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/**
 * שעות לתצוגה ציבורית (למשל דף צור קשר) — רק רשומות "כללי" (ללא treatmentKey ספציפי),
 * כמו בניהול זמינות כשבוחרים "כל הסוגים".
 */
export async function getPublicWorkingHoursWeek() {
  await ensureDefaults()
  const weekHit = cacheGet('publicWorkingHoursWeek')
  if (weekHit) return weekHit

  const rows = await AvailabilityWorkingHours.find({
    $or: [{ treatmentKey: null }, { treatmentKey: { $exists: false } }, { treatmentKey: '' }],
  })
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean()

  const byDay = Array.from({ length: 7 }, () => [])
  for (const r of rows) {
    const d = r.dayOfWeek
    if (typeof d !== 'number' || d < 0 || d > 6) continue
    try {
      const s = minutesFromMidnight(r.startTime)
      const e = minutesFromMidnight(r.endTime)
      if (e > s) byDay[d].push([s, e])
    } catch {
      /* רשומה לא תקינה */
    }
  }

  const days = []
  for (let d = 0; d <= 6; d++) {
    const merged = mergeIntervals(byDay[d])
    const intervals = merged.map(([s, e]) => {
      const start = hhmmFromMinutes(s)
      const end = hhmmFromMinutes(e)
      return {
        start,
        end,
        display: `${start} – ${end}`,
      }
    })
    days.push({
      dayOfWeek: d,
      dayLabel: DOW_LABELS_HE[d],
      closed: intervals.length === 0,
      intervals,
    })
  }

  const out = { days }
  cacheSet('publicWorkingHoursWeek', out)
  return out
}
