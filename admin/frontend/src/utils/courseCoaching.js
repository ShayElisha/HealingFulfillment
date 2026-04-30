const DEFAULT_COACHING_MONTHS = 3

function monthsHebrew(n) {
  const x = Number(n)
  if (!Number.isFinite(x) || x < 1) return null
  return `${x} חודש${x === 1 ? '' : 'ים'}`
}

/** תאריכים ישנים בלבד (מסמכים לפני מעבר לחודשים) */
function formatCourseCoachingRangeHebrew(course) {
  const s = course?.coachingProcessStartAt
  const e = course?.coachingProcessEndAt
  if (!s && !e) return null
  const opts = { year: 'numeric', month: 'short', day: 'numeric' }
  const a = s ? new Date(s).toLocaleDateString('he-IL', opts) : ''
  const b = e ? new Date(e).toLocaleDateString('he-IL', opts) : ''
  if (a && b) return `${a} – ${b}`
  return a || b
}

export function formatCourseCoachingLine(course) {
  if (course?.coachingProcessMonths != null && Number(course.coachingProcessMonths) >= 1) {
    return monthsHebrew(course.coachingProcessMonths)
  }
  return formatCourseCoachingRangeHebrew(course)
}

export function effectiveCoachingMonthsForForm(course) {
  if (course?.coachingProcessMonths != null && Number(course.coachingProcessMonths) >= 1) {
    return Math.min(60, Number(course.coachingProcessMonths))
  }
  const s = course?.coachingProcessStartAt
  const e = course?.coachingProcessEndAt
  if (s && e) {
    const ms = new Date(e).getTime() - new Date(s).getTime()
    const approx = Math.round(ms / (30.44 * 24 * 60 * 60 * 1000))
    return Math.max(1, Math.min(60, approx || DEFAULT_COACHING_MONTHS))
  }
  return DEFAULT_COACHING_MONTHS
}

export function courseTimelineLabelForSelect(course) {
  const line = formatCourseCoachingLine(course)
  if (line) return `תהליך ליווי: ${line}`
  if (course?.sessionsCount) return `${course.sessionsCount} מפגשים (ישן)`
  return 'מסלול'
}
