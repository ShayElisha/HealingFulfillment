import Card from './Card'

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

const answerOrDash = (value) => {
  if (value === undefined || value === null || value === '') return '-'
  return value
}

function RegulationsQuestionnaireTab({ regulationsQuestionnaire, showCard = true }) {
  const questionnaire = regulationsQuestionnaire || {}
  const answers = questionnaire.answers || {}

  // In DB sample `completed` & `accepted` live under `answers`
  const isCompleted = Boolean(answers.completed ?? questionnaire.completed)
  const isAccepted = Boolean(answers.accepted ?? questionnaire.accepted)

  const physicalActivityLabels = {
    yes: 'כן',
    sometimes: 'לפעמים',
    no: 'לא',
  }

  const mentalStabilityLabels = {
    managed_consciously:
      'אני מנהל במודע את עולמי הפנימי ומכוון את תשומת הלב בהתאם לבחירות שלי.',
    stable: 'אני יציב בנפשי.',
    automatic: 'אני מנוהל באופן אוטומטי בחוסר מודעות, היכולת לבחור במודע חלשה והאנרגיה מפוזרת.',
    not_stable: 'אני לא יציב בנפשי.',
  }

  const unresolvedTraumaLabels = {
    yes: 'לדברתי יש לי אירועים טראומטיים לא פתורים מהעבר',
    no: 'לדברתי אין לי אירועים טראומטיים לא פתורים מהעבר',
  }

  const triggersLabels = {
    daily: 'אני מזהה את הטריגרים (מתגי הפעלה) שלי כל יום',
    not_daily: 'אני לא מזהה את הטריגרים שלי כל יום',
    same: 'אני מזהה את הטריגרים אבל אני מגיב כל פעם באותו האופן',
  }

  const diagnosisLabels = {
    yes: 'כן',
    no: 'לא',
    past: 'בעבר',
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">שאלון ותקנון</h3>
          <p className="text-sm text-neutral-600">
            סטטוס: {isCompleted ? 'מולא ומאושר' : 'טרם מולא'}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
            isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {isCompleted ? 'הושלם' : 'בטיוטה'}
        </span>
      </div>

      <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <h4 className="text-sm font-semibold text-neutral-800 mb-2">תקנון</h4>
        <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-neutral-800 leading-relaxed">
          {REGULATIONS_TEXT}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">4. איכות שינה (1-5)</p>
            <p className="font-semibold">{answerOrDash(answers.sleepQuality)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">איכות תזונה (1-5)</p>
            <p className="font-semibold">{answerOrDash(answers.nutritionQuality)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">האם אתם עושים פעילות גופנית?</p>
            <p className="font-semibold">
              {answerOrDash(physicalActivityLabels[answers.physicalActivity])}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">5. מצב בריאות נפשית</p>
            <p className="font-semibold">
              {answerOrDash(mentalStabilityLabels[answers.mentalStability])}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">6. אירועים טראומטיים לא פתורים</p>
            <p className="font-semibold">
              {answerOrDash(unresolvedTraumaLabels[answers.unresolvedTrauma])}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">7. טריגרים (מתגי הפעלה)</p>
            <p className="font-semibold">
              {answerOrDash(triggersLabels[answers.triggers])}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">8. אבחנה במחלה פיזית</p>
            <p className="font-semibold">
              {answerOrDash(diagnosisLabels[answers.physicalDiagnosis])}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">9. אבחנה במחלה נפשית</p>
            <p className="font-semibold">
              {answerOrDash(diagnosisLabels[answers.mentalDiagnosis])}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">10. צריכת תרופות באופן קבוע</p>
            <p className="font-semibold">{answerOrDash(diagnosisLabels[answers.meds])}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">אישור קריאה ומילוי</p>
            <p className="font-semibold">{isAccepted ? 'כן' : 'לא'}</p>
          </div>
        </div>
      </div>
    </>
  )

  return showCard ? <Card>{content}</Card> : content
}

export default RegulationsQuestionnaireTab


