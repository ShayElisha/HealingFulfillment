# Healing Fulfillment Admin Panel

פאנל ניהול למערכת Healing Fulfillment

## התקנה מקומית

1. התקן את כל התלויות:
```bash
npm run install:all
```

2. הפעל את השרתים (backend + frontend):
```bash
npm run dev
```

או בנפרד:
```bash
# Backend (פורט 5001)
npm run dev:backend

# Frontend (פורט 3001)
npm run dev:frontend
```

## פריסה ל-Vercel

### דרישות מוקדמות

1. חשבון Vercel (חינם)
2. MongoDB Atlas או MongoDB אחר (מומלץ MongoDB Atlas)
3. משתני סביבה מוגדרים

### שלבי הפריסה

1. **התחבר ל-Vercel:**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **העלה את הפרויקט:**
   ```bash
   vercel
   ```

3. **הגדר משתני סביבה ב-Vercel Dashboard:**
   - עבור ל-Vercel Dashboard → הפרויקט שלך → Settings → Environment Variables
   - הוסף את המשתנים הבאים:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     ADMIN_FRONTEND_URL=https://your-app.vercel.app
     NODE_ENV=production
     ```

4. **העלה שוב עם משתני הסביבה:**
   ```bash
   vercel --prod
   ```

### משתני סביבה נדרשים

| משתנה | תיאור | דוגמה |
|--------|-------|-------|
| `MONGODB_URI` | חיבור ל-MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | מפתח להצפנת JWT | מחרוזת אקראית ארוכה |
| `ADMIN_FRONTEND_URL` | כתובת ה-frontend ב-production | `https://your-app.vercel.app` |
| `NODE_ENV` | סביבת הפעלה | `production` |

### הערות חשובות

1. **קבצים מעולים**: Vercel Serverless Functions לא תומכות באחסון קבצים מקומיים. עבור קבצים מעולים, השתמש ב:
   - Vercel Blob Storage
   - AWS S3
   - Cloudinary
   - או שירות אחסון אחר

2. **MongoDB Connection**: ודא שה-MongoDB URI כולל את כתובת ה-IP של Vercel או מוגדר ל-`0.0.0.0/0` ב-MongoDB Atlas.

3. **CORS**: ה-CORS מוגדר אוטומטית לעבוד עם ה-URL של Vercel.

## מבנה הפרויקט

```
admin/
├── api/              # Vercel Serverless Functions
│   └── index.js     # Entry point for API routes
├── backend/         # Backend Express server
│   ├── routes/      # API routes
│   ├── models/      # MongoDB models
│   └── server.js    # Express app
├── frontend/        # React frontend
│   ├── src/        # Source code
│   └── dist/       # Build output
└── vercel.json     # Vercel configuration
```

## פיתוח

### Backend
- Express.js
- MongoDB עם Mongoose
- JWT Authentication
- Multer לניהול קבצים

### Frontend
- React
- Vite
- Tailwind CSS
- React Router

## תמיכה

לשאלות או בעיות, צור issue ב-GitHub.

