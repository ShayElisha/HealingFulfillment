# הוראות פריסה ל-Vercel

## ✅ הפרויקט מוכן לפריסה!

כל הקבצים הנדרשים כבר מוגדרים:
- ✅ `vercel.json` - הגדרות פריסה
- ✅ `package.json` - עם engines ו-scripts נכונים
- ✅ `.nvmrc` - גרסת Node.js
- ✅ `.vercelignore` - קבצים להתעלם מהם

## שלב 1: פריסה דרך Vercel Dashboard

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. לחץ על **"Add New Project"**
3. בחר את ה-repository שלך (GitHub/GitLab/Bitbucket)
4. **הגדר את ההגדרות הבאות:**
   - **Framework Preset**: בחר **Vite** (או **Other**)
   - **Root Directory**: לחץ על **Edit** ובחר **`frontend`**
   - **Build Command**: השאר ריק (Vercel יקרא מ-`vercel.json`)
   - **Output Directory**: השאר ריק (Vercel יקרא מ-`vercel.json`)
   - **Install Command**: השאר ריק

5. לחץ על **Deploy**

## שלב 2: הגדרת משתני סביבה

לאחר הפריסה הראשונה, הוסף משתני סביבה:

1. לך ל-**Settings** → **Environment Variables**
2. הוסף את המשתנה הבא:

```
VITE_API_URL=https://your-backend-url.com/api
```

**חשוב:** החלף את `your-backend-url.com` בכתובת ה-URL של השרת ה-backend שלך.

3. לחץ על **Save**
4. בצע **Redeploy** כדי שהמשתנים ייכנסו לתוקף

## שלב 3: בדיקת הפריסה

לאחר הפריסה, בדוק:
- ✅ שהאתר נטען ב-URL שניתן על ידי Vercel
- ✅ שכל הדפים עובדים (/, /about, /treatments, וכו')
- ✅ שהבקשות ל-API עובדות (פתח את ה-Console בדפדפן)

## פריסה דרך CLI

אם אתה מעדיף להשתמש ב-CLI:

```bash
cd frontend
npm i -g vercel
vercel login
vercel
```

עקוב אחר ההוראות:
- **Set up and deploy?** → Y
- **Which scope?** → בחר את החשבון שלך
- **Link to existing project?** → N (לפרויקט חדש)
- **What's your project's name?** → healing-fulfillment-customer
- **In which directory is your code located?** → ./
- **Want to override the settings?** → N

## עדכונים עתידיים

לעדכון הפרויקט לאחר שינויים:
- דרך Dashboard: כל push ל-main branch יפרס אוטומטית
- דרך CLI: `vercel --prod`

## פתרון בעיות

### אם יש שגיאת 404:
- ודא שה-`vercel.json` קיים בתיקיית `frontend`
- בדוק שה-`outputDirectory` מוגדר ל-`dist`
- ודא שה-Root Directory ב-Vercel מוגדר ל-`frontend`

### אם ה-build נכשל:
- בדוק את ה-Build Logs ב-Vercel Dashboard
- ודא שכל ה-dependencies מותקנים
- בדוק שה-Node.js version היא 18 או יותר

### אם הבקשות ל-API נכשלות:
- ודא שה-`VITE_API_URL` מוגדר ב-Environment Variables
- בדוק שה-backend רץ ונגיש
- ודא שה-CORS מוגדר נכון ב-backend

## הערות חשובות

### לגבי ה-Backend:
הבאקאנד (Express + MongoDB) צריך להיות מועלה על שירות אחר:
- **Railway** (מומלץ) - https://railway.app
- **Render** - https://render.com
- **Heroku** - https://heroku.com

### משתני סביבה נדרשים ב-Backend:
- `MONGODB_URI` - כתובת MongoDB
- `JWT_SECRET` - מפתח סודי ל-JWT
- `CUSTOMER_FRONTEND_URL` - כתובת הפרונטאנד ב-Vercel
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - הגדרות אימייל

### CORS Configuration:
וודא שב-backend ה-CORS מוגדר לאפשר גישה מהדומיין של Vercel:
```javascript
origin: [
  'https://your-vercel-app.vercel.app',
  'https://your-custom-domain.com'
]
```

