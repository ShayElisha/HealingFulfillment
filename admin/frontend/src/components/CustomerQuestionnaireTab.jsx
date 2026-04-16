import Card from './Card'

const REGULATIONS_TEXT_SHORT = `
תקנון ושאלון
נא לקרוא את מה שסיכמנו ולמלא את השאלון כנדרש לפני פגישה ראשונה.
`

const answerOrDash = (value) => {
  if (value === undefined || value === null || value === '') return '-'
  return value
}

function CustomerQuestionnaireTab({ customer }) {
  const regulations = customer?.regulationsQuestionnaire || {}
  const answers = regulations.answers || {}

  // ב-db אצלנו התמיד/הושלם יכולים להופיע גם ב-answers וגם ב-regulations עצמו,
  // לכן בודקים בצורה גמישה.
  const isCompleted = Boolean(regulations.completed ?? answers.completed)
  const isAccepted = Boolean(answers.accepted ?? regulations.accepted)

  const physicalActivityLabels = {
    yes: 'כן',
    sometimes: 'לפעמים',
    no: 'לא',
  }

  const mentalStabilityLabels = {
    managed_consciously:
      'אני מנהל במודע את עולמי הפנימי ומכוון את תשומת הלב בהתאם לבחירות שלי.',
    stable: 'אני יציב בנפשי.',
    automatic:
      'אני מנוהל באופן אוטומטי בחוסר מודעות, היכולת לבחור במודע חלשה והאנרגיה מפוזרת.',
    not_stable: 'אני לא יציב בנפשי.',
  }

  const unresolvedTraumaLabels = {
    yes: 'לדעתי יש לי אירועים טראומטיים לא פתורים מהעבר',
    no: 'לדעתי אין לי אירועים טראומטיים לא פתורים מהעבר',
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

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">שאלון ותקנון</h3>
            <p className="text-sm text-neutral-600">
              סטטוס: {isCompleted ? 'מולא ומאושר' : 'טרם מולא'} {isAccepted ? '' : ''}
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
          <div className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
            {REGULATIONS_TEXT_SHORT}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">4. מה מצב הבריאות הגופנית שלכם - לדעתכם (שינה)</p>
              <p className="font-semibold">{answerOrDash(answers.sleepQuality)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">דרגו את איכות התזונה שלכם לדעתכם</p>
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
              <p className="text-sm text-neutral-600">5. מה מצב הבריאות הנפשית שלכם לדעתכם?</p>
              <p className="font-semibold">
                {answerOrDash(mentalStabilityLabels[answers.mentalStability])}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">6. מה הם השיעורים בעבר שלא למדנו ודחינו?</p>
              <p className="font-semibold">
                {answerOrDash(unresolvedTraumaLabels[answers.unresolvedTrauma])}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">7. מה הם הטריגרים שנוצרו עם הזמן?</p>
              <p className="font-semibold">{answerOrDash(triggersLabels[answers.triggers])}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">8. האם אתם מאובחנים במחלה פיזית?</p>
              <p className="font-semibold">{answerOrDash(diagnosisLabels[answers.physicalDiagnosis])}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">9. האם אתם מאובחנים במחלה נפשית?</p>
              <p className="font-semibold">{answerOrDash(diagnosisLabels[answers.mentalDiagnosis])}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">10. האם אתם צורכים תרופות באופן קבוע?</p>
              <p className="font-semibold">{answerOrDash(diagnosisLabels[answers.meds])}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">אישור שקראתי ומילאתי</p>
              <p className="font-semibold">{isAccepted ? 'כן' : 'לא'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CustomerQuestionnaireTab


