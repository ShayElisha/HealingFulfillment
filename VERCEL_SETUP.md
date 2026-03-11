# הגדרת Vercel - Healing Fulfillment

## תיקונים שבוצעו

### 1. יצירת Serverless Function עם Catch-All Route
נוצר קובץ `/api/[...path].js` שמטפל בכל הבקשות ל-`/api/*`. זה מאפשר ל-Vercel לנתב נכון את כל הבקשות ל-backend.

### 2. עדכון vercel.json
הוסר rewrite rule מיותר שהיה גורם לבעיות ניתוב. Vercel מנתב אוטומטית `/api/*` ל-`/api/[...path].js`.

### 3. שיפור טיפול בנתיבים ב-server.js
התווסף middleware שמזהה אוטומטית אם הקוד רץ ב-Vercel ומתקן את הנתיבים בהתאם.

## משתני סביבה שצריך להגדיר ב-Vercel

1. היכנס ל-Vercel Dashboard
2. בחר את הפרויקט
3. לך ל-Settings > Environment Variables
4. הוסף את המשתנים הבאים:

### משתנים חובה:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healing-fulfillment
```
(החלף עם ה-connection string שלך מ-MongoDB Atlas)

### משתנים מומלצים:
```
JWT_SECRET=your-secret-key-here-minimum-32-characters
NODE_ENV=production
VERCEL=1
```

### משתנים אופציונליים:
```
FRONTEND_URL=https://your-domain.vercel.app
```

## בדיקה לאחר Deployment

1. בדוק שהאתר נטען: `https://your-domain.vercel.app`
2. בדוק health check: `https://your-domain.vercel.app/api/health`
3. נסה לשלוח טופס יצירת קשר או הזמנת פגישה
4. בדוק את ה-logs ב-Vercel Dashboard > Functions > Logs

## פתרון בעיות

### אם עדיין יש שגיאות חיבור:

1. **בדוק את ה-logs ב-Vercel:**
   - לך ל-Vercel Dashboard > Your Project > Functions
   - לחץ על `/api/[...path]` ובדוק את ה-logs

2. **ודא שמשתני הסביבה מוגדרים:**
   - בדוק ב-Settings > Environment Variables
   - ודא ש-MONGODB_URI מוגדר נכון

3. **בדוק את ה-MongoDB Connection:**
   - ודא שה-IP של Vercel מורשה ב-MongoDB Atlas
   - ב-MongoDB Atlas: Network Access > Add IP Address > Allow Access from Anywhere (0.0.0.0/0)

4. **בדוק את ה-Console בדפדפן:**
   - פתח Developer Tools (F12)
   - לך ל-Tab Network
   - נסה לשלוח בקשה ובדוק מה השגיאה

## מבנה הקבצים

```
HealingFulfillment/
├── api/
│   ├── [...path].js      # Catch-all route for /api/*
│   └── index.js          # Handler for /api route
├── backend/
│   └── server.js         # Express app
├── frontend/
│   └── dist/             # Built frontend (deployed)
└── vercel.json           # Vercel configuration
```

## הערות חשובות

- ה-serverless function מוגבל ל-30 שניות (מוגדר ב-vercel.json)
- קבצים סטטיים (uploads) לא יעבדו ב-Vercel - צריך להשתמש ב-external storage כמו AWS S3 או Cloudinary
- MongoDB connection נשמר בין בקשות (connection pooling)

