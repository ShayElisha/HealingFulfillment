# מדריך העלאה ל-Vercel

## מבנה הפרויקט
הפרויקט מחולק ל-4 חלקים:
1. **customer/frontend** - Frontend של הלקוח (React + Vite)
2. **customer/backend** - Backend של הלקוח (Express)
3. **admin/frontend** - Frontend של האדמין (React + Vite)
4. **admin/backend** - Backend של האדמין (Express)

## אפשרויות Deployment

### אפשרות 1: Frontend ב-Vercel, Backend ב-Railway/Render (מומלץ)

#### שלב 1: העלאת Customer Frontend ל-Vercel

1. **התחבר ל-Vercel:**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **נווט לתיקיית ה-frontend:**
   ```bash
   cd customer/frontend
   ```

3. **העלה את הפרויקט:**
   ```bash
   vercel
   ```
   
   או דרך האתר:
   - לך ל [vercel.com](https://vercel.com)
   - לחץ על "Add New Project"
   - חבר את ה-GitHub repository
   - בחר את התיקייה `customer/frontend`
   - הגדר:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

4. **הוסף Environment Variables:**
   - `VITE_API_URL` = כתובת ה-backend שלך (לדוגמה: `https://your-backend.railway.app/api`)

#### שלב 2: העלאת Admin Frontend ל-Vercel

1. **צור פרויקט חדש ב-Vercel:**
   - בחר את התיקייה `admin/frontend`
   - הגדר אותו כמו customer frontend

#### שלב 3: העלאת Backend ל-Railway או Render

**Railway:**
1. לך ל [railway.app](https://railway.app)
2. צור פרויקט חדש
3. חבר את ה-GitHub repository
4. בחר את התיקייה `customer/backend` או `admin/backend`
5. הוסף Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - וכו'

**Render:**
1. לך ל [render.com](https://render.com)
2. צור Web Service חדש
3. חבר את ה-GitHub repository
4. בחר את התיקייה `customer/backend`
5. הגדר:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

### אפשרות 2: הכל ב-Vercel (מורכב יותר)

Vercel תומך ב-Serverless Functions, אבל זה דורש שינוי של ה-backend.

#### שלב 1: המרת Backend ל-Serverless Functions

צריך ליצור תיקייה `api` ב-root של כל frontend ולהמיר את ה-routes ל-serverless functions.

**דוגמה ל-structure:**
```
customer/frontend/
  api/
    auth.js (serverless function)
    categories.js
    ...
```

## הגדרות חשובות

### 1. עדכן את vite.config.js

עבור production, עדכן את `VITE_API_URL`:

```javascript
// customer/frontend/vite.config.js
export default defineConfig({
  // ... existing config
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://your-backend-url.com/api')
  }
})
```

### 2. עדכן את api.js

```javascript
// customer/frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'https://your-backend-url.com/api')
```

### 3. CORS ב-Backend

ודא שה-backend מאפשר CORS מה-frontend:
```javascript
// customer/backend/server.js
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}))
```

## שלבים מהירים (מומלץ)

### 1. Frontend ב-Vercel:
```bash
# Customer Frontend
cd customer/frontend
vercel

# Admin Frontend  
cd admin/frontend
vercel
```

### 2. Backend ב-Railway:
- העלה כל backend בנפרד
- קבל את ה-URL
- עדכן את ה-Environment Variables ב-Vercel

### 3. עדכן את ה-API URLs:
- ב-Vercel, הוסף Environment Variables:
  - `VITE_API_URL` = כתובת ה-backend

## בדיקות

לאחר ההעלאה:
1. בדוק שהאתר נטען
2. בדוק שהבקשות ל-API עובדות
3. בדוק את ה-Console לדרrors
4. בדוק את ה-Network tab

## טיפים

- השתמש ב-Environment Variables לכל דבר רגיש
- ודא שה-build עובר בהצלחה לפני העלאה
- בדוק את ה-logs ב-Vercel אם יש בעיות
- עבור production, השתמש ב-custom domain

