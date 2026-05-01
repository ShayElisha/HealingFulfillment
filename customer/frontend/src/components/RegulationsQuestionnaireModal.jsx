import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import Button from './Button'
import { authService } from '../services/authApi'

const REGULATIONS_TEXT = `
שלום אהובים שמח שאתם כאן קוראים את מה שסיכמנו ועושים את הצעדים הראשונים בדרך שלכם לקחת אחריות על הסיבה שבאתם לחיים ועל איכות החיים שלכם ושל האהובים עליכם.
אני מבטיח לכם, התהליך הזה לא יהיה דומה לשום דבר שהכרתם
והתוצאות ידברו בעד עצמן.

אם הגעתם אלי לכאן סימן שהגיע הזמן שלכם להתעורר אל עצמכם
אז אני מבקש, תתמסרו, תיכנעו בפני השינוי שאתם מבקשים ותאפשרו אותו כי תכלס אין לכם ברירה, כי האפשרות השניה היא סבל ואני מניח שהוא הוביל אתכם לכאן  😅😅

-אז בואו נתחיל-

על מה נדבר במפגש

כל משבר, מחלה, מצב נפשי לא מאוזן, הם התוצאה של חוסר ברווחה.

מה היא רווחה ?

רווחה - מצב בו אנחנו מחוברים לייעוד שלנו ומגשימים את השאיפות שלנו בחיים בתחושה של אושר, אהבה ושחרור ולא מתוך פחד והישרדות.

רווחה היא נגזרת של בריאות, כולם אומרים הכי חשוב הבריאות, אז בואו נתחבר על ההסכמה

מה היא בעצם בריאות?

בריאות - היא מצב של רווחה מלאה, חברתית, גופנית, נפשית ורוחנית ולא רק העדר מחלה.

יוצא ש הבריאות והרווחה קשורות אחת בשניה, אני אומר לכם כאן מפורשות
יש קשר ישיר בין חוסר הגשמה בחיים, למשבר נפשי, לחולי פיזי.

אדם שיודע לחבר בין הייעוד לשליחות שלו,
יהיה יציב בנפשו ולא יהיה חולה.

בואו נבדיל רגע בין יעוד לשליחות

היעוד זהה לכולנו - להיות ביטוי של אהבה

השליחות היא - תחום העיסוק, האופן בו אנו בוחרים לבטא את האהבה שלנו.

בתהליך הליווי נפעל
בשני מישורים במקביל,
להשבת האיזון והחיבור בין הייעוד לשליחות:

1. מישור ההגשמה - אנו מזהים את החיבור בין הייעוד לשליחות שלנו  ואנו מיישמים אותו בכל תחומי החיים שלנו ללא פשרות בנחישות והתמדה, תוך התגברות על כל אתגר וקושי.

2. מישור הריפוי - בתהליכי ריפוי לא נתמקד בתסמינים אלא בשורש, נזהה את המקור לכל חולי פיזי או נפשי, נפעל להשיב את האיזון בין החומר והרוח, בין הגוף והנשמה כתוצאה הגוף מרפא את עצמו באופן טבעי. (אמיתי לגמרי)

סדר המפגשים ואופן תהליך הליווי:

מפגש ראשון - אבחון והכרות מעמיקה בנינו
1. נדבר על מי אנחנו - ללא הזהות שלנו אנו אבודים בעולם ואין לנו קרקע יציבה.
2. למה באנו לחיים - מה הן הסיבות שאנו מתעוררים כל בוקר כאן בגוף הפיזי ויוצאים ליום של פעילות והגשמה.
3. מה הם החוזים הנשמתיים שעליהם אנו חתומים בגוף הזה.

10. בתום המפגש אני אכין לנו תוכנית פעולה ייחודית לכם שתהווה את הבסיס למסע, במידה ועדיין לא סגרנו תשלום אני אשתף אתכם בעלות התהליך, והדרכים שניתן לשלם ולפרוס ונבחר ביחד עם להתחבר להמשך הדרך.

🌿🌿🌿תודה שקראתם ומילאתם את השאלון מתרגש להפגש 🌿🌿🌿
`

const INITIAL_FORM = {
  sleepQuality: undefined,
  nutritionQuality: undefined,
  physicalActivity: undefined,
  mentalStability: undefined,
  unresolvedTrauma: undefined,
  triggers: undefined,
  physicalDiagnosis: undefined,
  mentalDiagnosis: undefined,
  meds: undefined,
  accepted: false,
}

function calculateCompleteness(form) {
  const required = [
    form.sleepQuality,
    form.nutritionQuality,
    form.physicalActivity,
    form.mentalStability,
    form.unresolvedTrauma,
    form.triggers,
    form.physicalDiagnosis,
    form.mentalDiagnosis,
    form.meds
  ]
  return required.every((v) => v !== undefined && v !== null && v !== '') && form.accepted
}

/** בחירה בלי input[type=radio] — נמנע באגי דפדפן/מודאל עם קבוצות name */
function SelectChip({ selected, onSelect, children, className = '' }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-xl border p-3 text-center transition-colors ${selected ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'} ${className}`}
    >
      {children}
    </button>
  )
}

function SelectRow({ selected, onSelect, children, className = '' }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-start transition-colors ${selected ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 text-neutral-700 hover:border-primary-300 hover:bg-neutral-50'} ${className}`}
    >
      <span className="text-sm font-medium sm:text-base">{children}</span>
    </button>
  )
}

function RegulationsQuestionnaireModal({ isOpen, onClose, customerId: _customerId, onCompleted }) {
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM }))
  const prevIsOpenRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setForm({ ...INITIAL_FORM })
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [isOpen])

  const handleClose = () => {
    onClose?.()
  }

  const isComplete = calculateCompleteness(form)

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!isComplete) {
      toast.error('נא להשלים את כל השאלות ולהאשר לפני המשך.')
      return
    }

    ;(async () => {
      try {
        await authService.submitRegulationsQuestionnaire({ answers: form })
        onCompleted?.(form)
        onClose?.()
        toast.success('התקנון והשאלון מולאו בהצלחה')
      } catch (error) {
        console.error('Error saving regulations questionnaire:', error)
        toast.error(error.response?.data?.message || 'שגיאה בשמירת השאלון. נסה שוב.')
      }
    })()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    isOpen ? (
      <div
        className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10 sm:px-4 sm:py-16"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) handleClose()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="regulations-modal-title"
          className="relative mb-8 w-full max-w-4xl shrink-0 rounded-2xl bg-white shadow-2xl"
          style={{ maxHeight: '90vh' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-5 text-white sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="regulations-modal-title" className="mb-1 font-serif text-xl font-bold sm:text-2xl">
                  אבחון ראשוני
                </h2>
                <p className="text-sm text-primary-100">נא לקרוא ולמלא לפני קביעת פגישה ראשונה</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="סגור"
              >
                ✕
              </button>
            </div>
          </div>

          {/* גלילה בגובה מחושב — בלי flex-1/min-h-0 (מקור נפוץ לבאג ב־WebKit בתוך מודאל) */}
          <div
            className="overflow-y-auto overscroll-contain px-5 py-5 sm:p-6 [scrollbar-gutter:stable]"
            style={{
              maxHeight: 'calc(90vh - 13.5rem)',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="space-y-6">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm leading-relaxed text-neutral-800 sm:text-base whitespace-pre-wrap">
                  {REGULATIONS_TEXT}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-sleep">
                  4. מה מצב הבריאות הגופנית שלכם - לדעתכם (שינה)
                </p>
                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="q-sleep">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectChip
                      key={n}
                      selected={form.sleepQuality === n}
                      onSelect={() => setForm((f) => ({ ...f, sleepQuality: n }))}
                      className="font-semibold"
                    >
                      {n}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-nutrition">
                  דרגו את איכות התזונה שלכם לדעתכם
                </p>
                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="q-nutrition">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectChip
                      key={n}
                      selected={form.nutritionQuality === n}
                      onSelect={() => setForm((f) => ({ ...f, nutritionQuality: n }))}
                      className="font-semibold"
                    >
                      {n}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-activity">
                  האם אתם עושים פעילות גופנית?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="q-activity">
                  {[
                    { value: 'yes', label: 'כן' },
                    { value: 'sometimes', label: 'לפעמים' },
                    { value: 'no', label: 'לא' },
                  ].map((opt) => (
                    <SelectChip
                      key={opt.value}
                      selected={form.physicalActivity === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, physicalActivity: opt.value }))}
                      className="font-medium"
                    >
                      {opt.label}
                    </SelectChip>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                  הערה: תנועה מיטיבה היא לא רק חדר כושר, תנועה מטיבה יכולה להיות גם חמש עד עשר דקות טאי צ'י, מתיחות, ריקוד, קפיצות וכדומה אבל אין מצב שאין תנועה.
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-mental">
                  5. מה מצב הבריאות הנפשית שלכם לדעתכם?
                </p>
                <div className="space-y-2" role="radiogroup" aria-labelledby="q-mental">
                  {[
                    { value: 'managed_consciously', label: 'אני מנהל במודע את עולמי הפנימי ומכוון את תשומת הלב בהתאם לבחירות שלי.' },
                    { value: 'stable', label: 'אני יציב בנפשי.' },
                    { value: 'automatic', label: 'אני מנוהל באופן אוטומטי בחוסר מודעות, היכולת לבחור במודע חלשה והאנרגיה מפוזרת.' },
                    { value: 'not_stable', label: 'אני לא יציב בנפשי.' },
                  ].map((opt) => (
                    <SelectRow
                      key={opt.value}
                      selected={form.mentalStability === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, mentalStability: opt.value }))}
                    >
                      {opt.label}
                    </SelectRow>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-trauma">
                  6. מה הם השיעורים בעבר שלא למדנו ודחינו?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="q-trauma">
                  {[
                    { value: 'yes', label: 'לדעתי יש לי אירועים טראומטיים לא פתורים מהעבר' },
                    { value: 'no', label: 'לדעתי אין לי אירועים טראומטיים לא פתורים מהעבר' },
                  ].map((opt) => (
                    <SelectRow
                      key={opt.value}
                      selected={form.unresolvedTrauma === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, unresolvedTrauma: opt.value }))}
                    >
                      {opt.label}
                    </SelectRow>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-triggers">
                  7. מה הם הטריגרים (מתגי הפעלה) שנוצרו עם הזמן?
                </p>
                <div className="space-y-2" role="radiogroup" aria-labelledby="q-triggers">
                  {[
                    { value: 'daily', label: 'אני מזהה את הטריגרים (מתגי הפעלה) שלי כל יום' },
                    { value: 'not_daily', label: 'אני לא מזהה את הטריגרים שלי כל יום' },
                    { value: 'same', label: 'אני מזהה את הטריגרים אבל אני מגיב כל פעם באותו האופן' },
                  ].map((opt) => (
                    <SelectRow
                      key={opt.value}
                      selected={form.triggers === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, triggers: opt.value }))}
                    >
                      {opt.label}
                    </SelectRow>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-physical-dx">
                  8. האם אתם מאובחנים במחלה פיזית?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="q-physical-dx">
                  {[
                    { value: 'yes', label: 'כן' },
                    { value: 'no', label: 'לא' },
                    { value: 'past', label: 'בעבר' },
                  ].map((opt) => (
                    <SelectChip
                      key={opt.value}
                      selected={form.physicalDiagnosis === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, physicalDiagnosis: opt.value }))}
                      className="font-medium"
                    >
                      {opt.label}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-mental-dx">
                  9. האם אתם מאובחנים במחלה נפשית?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="q-mental-dx">
                  {[
                    { value: 'yes', label: 'כן' },
                    { value: 'no', label: 'לא' },
                    { value: 'past', label: 'בעבר' },
                  ].map((opt) => (
                    <SelectChip
                      key={opt.value}
                      selected={form.mentalDiagnosis === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, mentalDiagnosis: opt.value }))}
                      className="font-medium"
                    >
                      {opt.label}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-neutral-900" id="q-meds">
                  10. האם אתם צורכים תרופות באופן קבוע?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="q-meds">
                  {[
                    { value: 'yes', label: 'כן' },
                    { value: 'no', label: 'לא' },
                    { value: 'past', label: 'בעבר' },
                  ].map((opt) => (
                    <SelectChip
                      key={opt.value}
                      selected={form.meds === opt.value}
                      onSelect={() => setForm((f) => ({ ...f, meds: opt.value }))}
                      className="font-medium"
                    >
                      {opt.label}
                    </SelectChip>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <input
                  id="regulations-modal-accepted"
                  type="checkbox"
                  checked={form.accepted}
                  onChange={(e) => setForm((f) => ({ ...f, accepted: e.target.checked }))}
                  className="mt-1"
                />
                <label htmlFor="regulations-modal-accepted" className="text-sm leading-relaxed text-neutral-700">
                  אני מאשר/ת שקראתי ומילאתי את השאלון כנדרש לפני קביעת פגישה ראשונה.
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50 p-4 sm:p-6">
            <div className="flex gap-4">
              <Button type="button" variant="soft" onClick={handleClose} className="flex-1">
                סגירה
              </Button>
              <Button type="button" variant="primary" onClick={handleSubmit} className="flex-1" disabled={!isComplete}>
                המשך לקביעת פגישה
              </Button>
            </div>
          </div>
        </div>
      </div>
    ) : null,
    document.body
  )
}

export default RegulationsQuestionnaireModal
