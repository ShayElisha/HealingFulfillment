# הוראות פריסה ל-Vercel

## מבנה הפרויקט

הפרויקט מוכן לפריסה ב-Vercel עם frontend ו-backend יחד:

- **Frontend**: React + Vite - נבנה כ-static site
- **Backend**: Express.js - רץ כ-Serverless Function ב-`/api/*`

## שלבי הפריסה

### 1. התקנת Vercel CLI

```bash
npm install -g vercel
```

### 2. התחברות ל-Vercel

```bash
vercel login
```

### 3. פריסה ראשונית

```bash
vercel
```

ענה על השאלות:
- Set up and deploy? → **Y**
- Which scope? → בחר את החשבון שלך
- Link to existing project? → **N**
- What's your project's name? → `healing-fulfillment-admin`
- In which directory is your code located? → **./** (Enter)

### 4. הגדרת משתני סביבה

ב-Vercel Dashboard → הפרויקט → Settings → Environment Variables:

**משתנים חובה:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healing-fulfillment?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
NODE_ENV=production
```

**משתנים אופציונליים:**
```
ADMIN_FRONTEND_URL=https://your-app.vercel.app
```

**חשוב**: ודא שהמשתנים מוגדרים ל-**Production**, **Preview**, ו-**Development**.

### 5. פריסה ל-Production

```bash
vercel --prod
```

## איך זה עובד

1. **Frontend**: Vercel בונה את ה-frontend מ-`frontend/` ומגיש אותו כ-static files
2. **Backend**: כל בקשה ל-`/api/*` מועברת ל-`/api/index.js` (Serverless Function)
3. **API Function**: ה-`api/index.js` מייבא את ה-Express app מ-`backend/server.js`

## מבנה הקבצים

```
admin/
├── api/
│   └── index.js          # Vercel Serverless Function entry point
├── backend/
│   ├── server.js         # Express app
│   ├── routes/           # API routes
│   └── models/           # MongoDB models
├── frontend/
│   ├── src/              # React source code
│   └── dist/             # Build output (generated)
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json
```

## פתרון בעיות

### MongoDB Connection Failed
- ודא שה-MONGODB_URI נכון
- ודא ש-MongoDB Atlas מאפשר חיבורים מ-0.0.0.0/0
- בדוק את ה-Network Access ב-MongoDB Atlas

### Build Failed
- ודא שה-`vite` מותקן ב-frontend (devDependencies)
- בדוק את ה-logs ב-Vercel Dashboard
- ודא שאין שגיאות syntax ב-code

### API לא עובד
- בדוק שה-`api/index.js` קיים
- בדוק שה-`vercel.json` מכיל את ה-rewrite rules
- בדוק את ה-logs ב-Vercel Dashboard → Functions

### CORS Errors
- ודא ש-ADMIN_FRONTEND_URL מוגדר נכון
- בדוק שה-CORS ב-server.js כולל את ה-URL של Vercel

## הערות חשובות

1. **קבצים מעולים**: Vercel Serverless Functions לא תומכות באחסון קבצים מקומיים. עבור קבצים מעולים, תצטרך להשתמש ב:
   - Vercel Blob Storage
   - AWS S3
   - Cloudinary
   - או שירות אחסון אחר

2. **MongoDB Connection**: Vercel Serverless Functions יוצרות connection חדש בכל request. זה יכול לגרום לבעיות עם MongoDB connection limits. שקול להשתמש ב-MongoDB Atlas או להגדיר connection pooling.

3. **Cold Starts**: ה-Serverless Functions עלולות לקחת כמה שניות להתחיל בפעם הראשונה (cold start). זה נורמלי.

4. **Logs**: אתה יכול לראות את ה-logs ב-Vercel Dashboard → Functions → Logs

## עדכונים עתידיים

לעדכן את הפרויקט לאחר שינויים:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel יבנה ויפרס אוטומטית אם יש לך GitHub integration.

או ידנית:
```bash
vercel --prod
```

