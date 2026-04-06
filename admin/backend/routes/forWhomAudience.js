import express from 'express'
import ForWhomProfile from '../models/ForWhomProfile.js'

const router = express.Router()

function sortProfiles(list) {
  return [...list].sort((a, b) => {
    const ao = Number(a.order) || 0
    const bo = Number(b.order) || 0
    if (ao !== bo) return ao - bo
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return db - da
  })
}

const SAMPLE_PROFILES = [
  {
    title: 'מנהלים ושכירים בכירים — שחיקה (Burnout)',
    description:
      'נתונים: בני 35–52, הכנסה של כ־25,000–45,000 ₪ ברוטו. הכאב: «הכלוב המצופה בזהב» — יש כסף ומעמד, אבל המוח בסטרס כרוני, עם פגיעה בבריאות וביחסים בבית. מוכנות לשינוי: גבוהה מאוד — הרגשה שזה «עכשיו או התקף לב».',
  },
  {
    title: 'הורים לצעירים (22–32) — «תקועים» בבית',
    description:
      'נתונים: הורים בני 50–65, מעמד בינוני–גבוה. הכאב: דאגה קיומית לעתיד הילד, עייפות מלכלכל אותו, ותחושת כישלון בהורות. מוכנות לשינוי: גבוהה — מוכנים לשלם כדי «לקנות» לילד עצמאות.',
  },
  {
    title: 'יזמים ובעלי עסקים — תקרת זכוכית',
    description:
      'נתונים: עסקים קטנים–בינוניים, מחזור שנתי בערך 1–5 מיליון ₪. הכאב: העסק מנהל אותם; תקיעות במצב תפעולי־הישרדותי, בלי צמיחה ובלי מקום למשפחה. מוכנות לשינוי: גבוהה — רואים בליווי השקעה עסקית עם ROI ברור.',
  },
  {
    title: 'זוגות במשבר אמצע הדרך — לפני פירוק',
    description:
      'נתונים: נשואים 10–20 שנה, הורים לילדים. הכאב: חוסר תקשורת, בדידות בתוך הקשר, ותחושה ש«זה לא יכול להמשיך ככה» — לצד פחד מגירושין. מוכנות לשינוי: גבוהה מאוד — האלטרנטיבה יקרה וכואבת בהרבה.',
  },
  {
    title: 'כוחות ביטחון ומילואים — מעבר לאזרחות',
    description:
      'נתונים: יוצאי קבע ארוך או מילואים ממושכים, כולל אחרי אירועי 2023–2025. הכאב: קושי במציאת זהות חדשה, דריכות יתר (מוח הישרדותי) וחוסר סנכרון עם השקט האזרחי. מוכנות לשינוי: גבוהה — חיפוש אחר משמעות וריבונות מחדש.',
  },
  {
    title: 'נשים בקריירה שנייה — פוסט־אימהות',
    description:
      'נתונים: נשים בנות 40+, אחרי שהילדים גדלו קצת. הכאב: תחושת החמצה, רצון למימוש עצמי ושליחות, אבל פחד מחוסר יציבות או מ«מה יגידו». מוכנות לשינוי: בינונית–גבוהה — צורך רגשי עז בשינוי.',
  },
  {
    title: 'רווקים ורווקות — חיפוש זוגיות מתמשך',
    description:
      'נתונים: בני 30–45, מצליחים מקצועית, בערים הגדולות. הכאב: «למה כולם מצליחים ואני לא?» — דפוסים חוזרים של חרדת נטישה או הימנעות (חיווט שמקשה על קשר). מוכנות לשינוי: גבוהה — תסכול מצטבר מאפליקציות ומבדידות.',
  },
  {
    title: 'צעירים High Potentials — איבוד כיוון (Lost 20s)',
    description:
      'נתונים: בני 22–28, אינטליגנציה גבוהה, ללא תואר או מקצוע יציב. הכאב: FOMO, חוסר יכולת להתחייב למסלול אחד, והרגשה שהחיים עוברים לידם. מוכנות לשינוי: גבוהה — רצון «להתניע» מהצד של המטופל.',
  },
]

// GET /for-whom-audience — כולל פריטים לא פעילים (למנהל)
router.get('/for-whom-audience', async (req, res, next) => {
  try {
    const rows = sortProfiles(await ForWhomProfile.find().lean())
    res.json({
      message: 'נשלף בהצלחה',
      data: rows,
    })
  } catch (error) {
    next(error)
  }
})

// POST /for-whom-audience/seed — רק אם אין עדיין פריטים
router.post('/for-whom-audience/seed', async (req, res, next) => {
  try {
    const count = await ForWhomProfile.countDocuments()
    if (count > 0) {
      return res.status(409).json({
        message: 'כבר קיימים פרופילים. מחקו אותם קודם או הוסיפו ידנית.',
      })
    }
    const docs = SAMPLE_PROFILES.map((p, i) => ({
      ...p,
      order: i,
      isActive: true,
    }))
    await ForWhomProfile.insertMany(docs)
    const rows = sortProfiles(await ForWhomProfile.find().lean())
    res.status(201).json({
      message: 'נוצרו כרטיסי דוגמה',
      data: rows,
    })
  } catch (error) {
    next(error)
  }
})

// POST /for-whom-audience
router.post('/for-whom-audience', async (req, res, next) => {
  try {
    const { title, description, order, isActive } = req.body
    if (!title || !description) {
      return res.status(400).json({ message: 'נדרשים כותרת ותיאור' })
    }
    const maxOrder = await ForWhomProfile.findOne().sort({ order: -1 }).select('order').lean()
    const nextOrder =
      order != null && Number.isFinite(Number(order))
        ? Number(order)
        : (Number(maxOrder?.order) || 0) + 1

    const doc = await ForWhomProfile.create({
      title: String(title).trim(),
      description: String(description).trim(),
      order: nextOrder,
      isActive: isActive !== false,
    })
    res.status(201).json({
      message: 'נוצר בהצלחה',
      data: doc,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'שגיאת ולידציה',
        errors: Object.values(error.errors).map((e) => e.message),
      })
    }
    next(error)
  }
})

// PUT /for-whom-audience/:id
router.put('/for-whom-audience/:id', async (req, res, next) => {
  try {
    const { title, description, order, isActive } = req.body
    const update = {}
    if (title != null) update.title = String(title).trim()
    if (description != null) update.description = String(description).trim()
    if (order != null && Number.isFinite(Number(order))) update.order = Number(order)
    if (typeof isActive === 'boolean') update.isActive = isActive

    const doc = await ForWhomProfile.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    })
    if (!doc) {
      return res.status(404).json({ message: 'לא נמצא' })
    }
    res.json({
      message: 'עודכן בהצלחה',
      data: doc,
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'שגיאת ולידציה',
        errors: Object.values(error.errors).map((e) => e.message),
      })
    }
    next(error)
  }
})

// DELETE /for-whom-audience/:id
router.delete('/for-whom-audience/:id', async (req, res, next) => {
  try {
    const doc = await ForWhomProfile.findByIdAndDelete(req.params.id)
    if (!doc) {
      return res.status(404).json({ message: 'לא נמצא' })
    }
    res.json({ message: 'נמחק בהצלחה' })
  } catch (error) {
    next(error)
  }
})

export default router
