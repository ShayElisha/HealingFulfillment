# 🚀 העלאה מהירה ל-Vercel

## שלב 1: התקנת Vercel CLI (אם עדיין לא מותקן)
```bash
npm i -g vercel
```

## שלב 2: התחברות ל-Vercel
```bash
vercel login
```

## שלב 3: העלאת Customer Frontend

```bash
cd customer/frontend
vercel
```

**במהלך ההעלאה:**
- בחר "Set up and deploy" (או "Link to existing project" אם כבר יש לך פרויקט)
- בחר את ה-account שלך
- בחר "Link to existing project" או צור חדש
- השאר את ההגדרות ברירת המחדל

## שלב 4: הוספת Environment Variables

לאחר ההעלאה, הוסף ב-Vercel Dashboard:
1. לך לפרויקט ב-Vercel
2. Settings → Environment Variables
3. הוסף:
   - `VITE_API_URL` = כתובת ה-backend שלך (לדוגמה: `https://your-backend.railway.app/api`)

## שלב 5: העלאת Admin Frontend (אותו תהליך)

```bash
cd admin/frontend
vercel
```

## ⚠️ חשוב: Backend

ה-backend צריך להיות על שרת אחר (לא Vercel):
- **Railway** (מומלץ): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

### העלאת Backend ל-Railway:

1. לך ל [railway.app](https://railway.app)
2. לחץ "New Project"
3. בחר "Deploy from GitHub repo"
4. בחר את ה-repository שלך
5. בחר את התיקייה `customer/backend`
6. הוסף Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` = 5000
   - וכל שאר ה-variables הנדרשים

7. קבל את ה-URL (לדוגמה: `https://your-app.railway.app`)
8. עדכן את `VITE_API_URL` ב-Vercel ל: `https://your-app.railway.app/api`

## ✅ בדיקות

לאחר ההעלאה:
1. בדוק שהאתר נטען: `https://your-project.vercel.app`
2. פתח את ה-Console בדפדפן (F12)
3. בדוק שאין שגיאות
4. נסה להתחבר/לבצע פעולות

## 🔧 פתרון בעיות

**אם יש שגיאות:**
1. בדוק את ה-Logs ב-Vercel Dashboard
2. ודא שה-Environment Variables מוגדרים נכון
3. ודא שה-backend רץ ונגיש
4. בדוק את ה-CORS ב-backend

**אם ה-API לא עובד:**
- ודא ש-`VITE_API_URL` מוגדר נכון
- בדוק שה-backend מאפשר CORS מה-frontend
- בדוק שה-backend רץ

