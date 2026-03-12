# הוראות פריסה ל-Vercel

מדריך זה מסביר כיצד לפרוס את הפרונט-אנד והבק-אנד יחד ב-Vercel.

## מבנה הפרויקט

```
customer/
├── api/
│   ├── index.js          # Serverless function wrapper
│   └── package.json      # Dependencies עצמאיים ל-API
├── backend/              # Backend Express API
├── frontend/             # Frontend React/Vite app
├── vercel.json           # Vercel configuration
└── .gitignore           # Git ignore rules
```

## הגדרת משתני סביבה ב-Vercel

לפני הפריסה, יש להגדיר את משתני הסביבה הבאים ב-Vercel Dashboard:

### משתני סביבה ל-Backend (API):

1. **MONGODB_URI** - כתובת MongoDB שלך
   ```
   mongodb+srv://username:password@cluster.mongodb.net/healing-fulfillment
   ```

2. **JWT_SECRET** - מפתח סודי ל-JWT (חשוב מאוד!)
   ```
   your-super-secret-jwt-key-change-this-in-production
   ```

3. **CUSTOMER_FRONTEND_URL** - כתובת ה-Frontend ב-Vercel
   ```
   https://your-app.vercel.app
   ```
   **הערה:** לאחר הפריסה הראשונית, Vercel ייתן לך URL. עדכן את המשתנה הזה עם ה-URL האמיתי.

4. **NODE_ENV** - סביבת הפעלה
   ```
   production
   ```

### משתני סביבה ל-Frontend:

1. **VITE_API_URL** - כתובת ה-API (בדרך כלל `/api` ב-Vercel)
   ```
   /api
   ```
   **הערה:** ב-Vercel, ה-API זמין דרך `/api`, אז השתמש ב-`/api` ולא ב-URL מלא.

## שלבי הפריסה

### 1. התקנת Vercel CLI (אם עדיין לא מותקן)
```bash
npm i -g vercel
```

### 2. התחברות ל-Vercel
```bash
vercel login
```

### 3. פריסה ראשונית
```bash
vercel
```

במהלך הפריסה הראשונית:
- Vercel יבקש ממך להגדיר את הפרויקט
- בחר את התיקייה `customer`
- Vercel יזהה אוטומטית את ההגדרות מ-`vercel.json`

### 4. הגדרת משתני סביבה
לאחר הפריסה הראשונית, היכנס ל-Vercel Dashboard:
1. בחר את הפרויקט
2. לך ל-Settings > Environment Variables
3. הוסף את כל משתני הסביבה שצוינו למעלה
4. **חשוב:** עדכן את `CUSTOMER_FRONTEND_URL` עם ה-URL האמיתי של הפריסה

### 5. פריסה ל-Production
```bash
vercel --prod
```

## איך זה עובד?

1. **Frontend**: נבנה כ-Static Site ונשמר ב-`frontend/dist/`
2. **Backend**: רץ כ-Serverless Function דרך `/api/*`
3. **Routing**: כל בקשה ל-`/api/*` מועברת ל-serverless function
4. **Static Files**: כל בקשה אחרת מועברת ל-`index.html` (React Router)

## בדיקת תקינות הפריסה

לאחר הפריסה, בדוק:

1. **Health Check**: 
   ```
   https://your-app.vercel.app/api/health
   ```
   או
   ```
   https://your-app.vercel.app/api/api/health
   ```

2. **Frontend**: 
   ```
   https://your-app.vercel.app
   ```

3. **API Routes**: 
   ```
   https://your-app.vercel.app/api/auth/login (POST)
   ```

## פתרון בעיות

### בעיית CORS
אם אתה מקבל שגיאת CORS:
1. ודא ש-`CUSTOMER_FRONTEND_URL` מוגדר נכון ב-Vercel
2. ודא שה-URL כולל `https://` ולא `http://`
3. בדוק את ה-Logs ב-Vercel Dashboard

### בעיית חיבור ל-MongoDB
אם יש בעיות בחיבור ל-MongoDB:
1. ודא ש-`MONGODB_URI` מוגדר נכון
2. ודא ש-MongoDB Atlas מאפשר חיבורים מ-IP של Vercel (או הגדר `0.0.0.0/0` לכל ה-IPs)
3. בדוק את ה-Logs ב-Vercel Dashboard > Functions

### בעיית Build
אם יש בעיות ב-Build:
1. בדוק את ה-Logs ב-Vercel Dashboard > Deployments
2. ודא שכל ה-dependencies מותקנים נכון
3. ודא ש-`frontend/package.json` ו-`api/package.json` מוגדרים נכון

### Frontend לא מתחבר ל-API
אם ה-Frontend לא מתחבר ל-API:
1. ודא ש-`VITE_API_URL` מוגדר ל-`/api` (לא URL מלא)
2. בדוק את ה-Console בדפדפן לשגיאות
3. ודא שה-API routes עובדים דרך `/api/*`

## הערות חשובות

1. **JWT_SECRET**: חשוב מאוד לשנות את המפתח הסודי ב-Production!
2. **MongoDB**: ודא שיש לך חיבור תקין ל-MongoDB Atlas או שרת MongoDB אחר.
3. **CORS**: ה-CORS מוגדר אוטומטית לתמוך ב-Vercel URLs.
4. **Environment Variables**: משתני הסביבה מוגדרים ב-Vercel Dashboard ולא בקובצי `.env`.

## קישורים שימושיים

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions)

