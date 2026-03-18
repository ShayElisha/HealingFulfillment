import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

function RegulationsQuestionnaireModal({ isOpen, onClose, customerId, onCompleted }) {
  const [form, setForm] = useState({
    sleepQuality: undefined, // 1-5
    nutritionQuality: undefined, // 1-5
    physicalActivity: undefined, // yes/no/sometimes
    mentalStability: undefined, // 4 options
    unresolvedTrauma: undefined, // yes/no
    triggers: undefined, // 3 options
    physicalDiagnosis: undefined, // yes/no/past
    mentalDiagnosis: undefined, // yes/no/past
    meds: undefined, // yes/no/past
    accepted: false,
  })

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  // Reset form when opening
  useEffect(() => {
    if (!isOpen) return
    setForm({
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
    })
  }, [isOpen])

  const handleClose = () => {
    onClose?.()
  }

  const isComplete = calculateCompleteness(form)

  const handleSubmit = (e) => {
    // Called from a button click (no <form>), but keep compatibility
    if (e && e.preventDefault) e.preventDefault()
    if (!isComplete) {
      toast.error('נא להשלים את כל השאלות ולהאשר לפני המשך.')
      return
    }

    ;(async () => {
      try {
        // Save questionnaire answers in DB (authenticated route)
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="fixed top-20 left-0 right-0 bottom-0 z-[101] flex items-start justify-center p-4 overflow-y-auto"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold mb-1">תקנון ושאלון</h2>
                    <p className="text-primary-100 text-sm">נא לקרוא ולמלא לפני קביעת פגישה ראשונה</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-white/80 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="סגור"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <div className="space-y-6">
                  <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
                    <div className="text-sm sm:text-base text-neutral-800 whitespace-pre-wrap leading-relaxed">
                      {REGULATIONS_TEXT}
                    </div>
                  </div>

                  {/* Q1 - sleep */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      4. מה מצב הבריאות הגופנית שלכם - לדעתכם (שינה)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className={`cursor-pointer p-3 rounded-xl border transition-colors text-center ${form.sleepQuality === n ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}>
                          <input
                            type="radio"
                            name="sleepQuality"
                            value={n}
                            checked={form.sleepQuality === n}
                            onChange={() => setForm({ ...form, sleepQuality: n })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-semibold">{n}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q2 - nutrition */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      דרגו את איכות התזונה שלכם לדעתכם
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className={`cursor-pointer p-3 rounded-xl border transition-colors text-center ${form.nutritionQuality === n ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}>
                          <input
                            type="radio"
                            name="nutritionQuality"
                            value={n}
                            checked={form.nutritionQuality === n}
                            onChange={() => setForm({ ...form, nutritionQuality: n })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-semibold">{n}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q3 - physical activity */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      האם אתם עושים פעילות גופנית?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'yes', label: 'כן' },
                        { value: 'sometimes', label: 'לפעמים' },
                        { value: 'no', label: 'לא' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer p-3 rounded-xl border transition-colors text-center ${form.physicalActivity === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="physicalActivity"
                            value={opt.value}
                            checked={form.physicalActivity === opt.value}
                            onChange={() => setForm({ ...form, physicalActivity: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                      הערה: תנועה מיטיבה היא לא רק חדר כושר, תנועה מטיבה יכולה להיות גם חמש עד עשר דקות טאי צ'י, מתיחות, ריקוד, קפיצות וכדומה אבל אין מצב שאין תנועה.
                    </p>
                  </div>

                  {/* Q5 - mental stability */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      5. מה מצב הבריאות הנפשית שלכם לדעתכם?
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'managed_consciously', label: 'אני מנהל במודע את עולמי הפנימי ומכוון את תשומת הלב בהתאם לבחירות שלי.' },
                        { value: 'stable', label: 'אני יציב בנפשי.' },
                        { value: 'automatic', label: 'אני מנוהל באופן אוטומטי בחוסר מודעות, היכולת לבחור במודע חלשה והאנרגיה מפוזרת.' },
                        { value: 'not_stable', label: 'אני לא יציב בנפשי.' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer block w-full p-4 rounded-xl border transition-colors ${form.mentalStability === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="mentalStability"
                            value={opt.value}
                            checked={form.mentalStability === opt.value}
                            onChange={() => setForm({ ...form, mentalStability: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium text-sm sm:text-base">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q6 - unresolved trauma */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      6. מה הם השיעורים בעבר שלא למדנו ודחינו?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { value: 'yes', label: 'לדברתי יש לי אירועים טראומטיים לא פתורים מהעבר' },
                        { value: 'no', label: 'לדברתי אין לי אירועים טראומטיים לא פתורים מהעבר' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer p-4 rounded-xl border transition-colors ${form.unresolvedTrauma === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="unresolvedTrauma"
                            value={opt.value}
                            checked={form.unresolvedTrauma === opt.value}
                            onChange={() => setForm({ ...form, unresolvedTrauma: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium text-sm sm:text-base">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q7 - triggers */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      7. מה הם הטריגרים (מתגי הפעלה) שנוצרו עם הזמן?
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'daily', label: 'אני מזהה את הטריגרים (מתגי הפעלה) שלי כל יום' },
                        { value: 'not_daily', label: 'אני לא מזהה את הטריגרים שלי כל יום' },
                        { value: 'same', label: 'אני מזהה את הטריגרים אבל אני מגיב כל פעם באותו האופן' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer block w-full p-4 rounded-xl border transition-colors ${form.triggers === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="triggers"
                            value={opt.value}
                            checked={form.triggers === opt.value}
                            onChange={() => setForm({ ...form, triggers: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium text-sm sm:text-base">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q8 - physical diagnosis */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      8. האם אתם מאובחנים במחלה פיזית?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'yes', label: 'כן' },
                        { value: 'no', label: 'לא' },
                        { value: 'past', label: 'בעבר' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer p-3 rounded-xl border transition-colors text-center ${form.physicalDiagnosis === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="physicalDiagnosis"
                            value={opt.value}
                            checked={form.physicalDiagnosis === opt.value}
                            onChange={() => setForm({ ...form, physicalDiagnosis: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q9 - mental diagnosis */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      9. האם אתם מאובחנים במחלה נפשית?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'yes', label: 'כן' },
                        { value: 'no', label: 'לא' },
                        { value: 'past', label: 'בעבר' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer p-3 rounded-xl border transition-colors text-center ${form.mentalDiagnosis === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="mentalDiagnosis"
                            value={opt.value}
                            checked={form.mentalDiagnosis === opt.value}
                            onChange={() => setForm({ ...form, mentalDiagnosis: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q10 - meds */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-3">
                      10. האם אתם צורכים תרופות באופן קבוע?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'yes', label: 'כן' },
                        { value: 'no', label: 'לא' },
                        { value: 'past', label: 'בעבר' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`cursor-pointer p-3 rounded-xl border transition-colors text-center ${form.meds === opt.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 text-neutral-700'}`}
                        >
                          <input
                            type="radio"
                            name="meds"
                            value={opt.value}
                            checked={form.meds === opt.value}
                            onChange={() => setForm({ ...form, meds: opt.value })}
                            className="sr-only"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                          />
                          <span className="font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                    <input
                      id="accepted"
                      type="checkbox"
                      checked={form.accepted}
                      onChange={(e) => setForm({ ...form, accepted: e.target.checked })}
                      className="mt-1"
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                    />
                    <label htmlFor="accepted" className="text-sm text-neutral-700 leading-relaxed">
                      אני מאשר/ת שקראתי ומילאתי את השאלון כנדרש לפני קביעת פגישה ראשונה.
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 p-4 sm:p-6 bg-neutral-50">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="soft"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    סגירה
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={!isComplete}
                  >
                    המשך לקביעת פגישה
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default RegulationsQuestionnaireModal


