# הוראות פריסה ל-Vercel

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

4. **NODE_ENV** - סביבת הפעלה
   ```
   production
   ```

### משתני סביבה ל-Frontend:

1. **VITE_API_URL** - כתובת ה-API (בדרך כלל `/api` ב-Vercel)
   ```
   /api
   ```

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

### 4. הגדרת משתני סביבה
לאחר הפריסה הראשונית, היכנס ל-Vercel Dashboard:
1. בחר את הפרויקט
2. לך ל-Settings > Environment Variables
3. הוסף את כל משתני הסביבה שצוינו למעלה

### 5. פריסה ל-Production
```bash
vercel --prod
```

## מבנה הפרויקט

```
customer/
├── api/
│   └── index.js          # Serverless function wrapper
├── backend/              # Backend Express API
├── frontend/             # Frontend React/Vite app
├── vercel.json           # Vercel configuration
└── .gitignore           # Git ignore rules
```

## בדיקת תקינות הפריסה

לאחר הפריסה, בדוק:

1. **Health Check**: `https://your-app.vercel.app/api/health`
2. **Frontend**: `https://your-app.vercel.app`
3. **API Routes**: `https://your-app.vercel.app/api/auth/login` (POST)

## פתרון בעיות

### בעיית CORS
אם אתה מקבל שגיאת CORS, ודא ש-`CUSTOMER_FRONTEND_URL` מוגדר נכון ב-Vercel.

### בעיית חיבור ל-MongoDB
ודא ש-`MONGODB_URI` מוגדר נכון וכולל את כל הפרמטרים הנדרשים.

### בעיית Build
אם יש בעיות ב-Build, בדוק את ה-Logs ב-Vercel Dashboard > Deployments.

## הערות חשובות

1. **JWT_SECRET**: חשוב מאוד לשנות את המפתח הסודי ב-Production!
2. **MongoDB**: ודא שיש לך חיבור תקין ל-MongoDB Atlas או שרת MongoDB אחר.
3. **CORS**: ה-CORS מוגדר אוטומטית לתמוך ב-Vercel URLs.

## קישורים שימושיים

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

