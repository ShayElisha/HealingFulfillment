# הוראות פריסה ל-Vercel

## פריסת הפרונטאנד ל-Vercel

### שלב 1: התקנת Vercel CLI (אם עדיין לא מותקן)
```bash
npm i -g vercel
```

### שלב 2: התחברות ל-Vercel
```bash
vercel login
```

### שלב 3: פריסה מהתיקייה frontend
```bash
cd frontend
vercel
```

עקוב אחר ההוראות:
- **Set up and deploy?** → Y
- **Which scope?** → בחר את החשבון שלך
- **Link to existing project?** → N (לפרויקט חדש)
- **What's your project's name?** → healing-fulfillment-customer (או שם אחר)
- **In which directory is your code located?** → ./
- **Want to override the settings?** → N

### שלב 4: הגדרת משתני סביבה ב-Vercel Dashboard

לאחר הפריסה הראשונה, היכנס ל-Vercel Dashboard והגדר את המשתנים הבאים:

1. לך ל-**Settings** → **Environment Variables**
2. הוסף את המשתנים הבאים:

```
VITE_API_URL=https://your-backend-url.com/api
```

**חשוב:** החלף את `your-backend-url.com` בכתובת ה-URL של השרת ה-backend שלך.

### שלב 5: פריסה מחדש
לאחר הגדרת משתני הסביבה, בצע פריסה מחדש:
```bash
vercel --prod
```

## הערות חשובות

### לגבי ה-Backend:
הבאקאנד (Express + MongoDB) **לא יכול** להיות מועלה ישירות ל-Vercel כפי שהוא כיום, כי:
- Vercel מתאים ל-serverless functions, לא ל-Express apps עם connections מתמידים
- MongoDB connection צריך להיות פעיל כל הזמן

**אפשרויות לפריסת הבאקאנד:**
1. **Railway** (מומלץ) - https://railway.app
2. **Render** - https://render.com
3. **Heroku** - https://heroku.com
4. **DigitalOcean App Platform** - https://www.digitalocean.com/products/app-platform

### משתני סביבה נדרשים ב-Backend:
כשתפרוס את הבאקאנד, תצטרך להגדיר:
- `MONGODB_URI` - כתובת MongoDB (MongoDB Atlas מומלץ)
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

## בדיקת הפריסה

לאחר הפריסה, בדוק:
1. שהאתר נטען ב-URL שניתן על ידי Vercel
2. שהבקשות ל-API עובדות (פתח את ה-Console בדפדפן)
3. שכל הדפים נטענים כראוי

## עדכונים עתידיים

לעדכון הפרויקט לאחר שינויים:
```bash
cd frontend
vercel --prod
```

או השתמש ב-Git integration של Vercel - כל push ל-main branch יפרס אוטומטית.

