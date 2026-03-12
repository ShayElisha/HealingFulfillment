# הוראות פריסה ל-Vercel

## שלב 1: הכנה

1. ודא שיש לך חשבון Vercel (חינם)
2. ודא שיש לך MongoDB Atlas או MongoDB אחר
3. ודא שהקוד שלך ב-GitHub/GitLab/Bitbucket

## שלב 2: התקנת Vercel CLI

```bash
npm install -g vercel
```

## שלב 3: התחברות ל-Vercel

```bash
vercel login
```

## שלב 4: פריסה ראשונית

1. נווט לתיקיית הפרויקט:
```bash
cd /path/to/admin
```

2. הפעל:
```bash
vercel
```

3. ענה על השאלות:
   - Set up and deploy? → **Y**
   - Which scope? → בחר את החשבון שלך
   - Link to existing project? → **N**
   - What's your project's name? → `healing-fulfillment-admin` (או שם אחר)
   - In which directory is your code located? → **./** (Enter)
   - Want to override the settings? → **N**

## שלב 5: הגדרת משתני סביבה

1. עבור ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. עבור ל-**Settings** → **Environment Variables**
4. הוסף את המשתנים הבאים:

### משתנים חובה:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healing-fulfillment?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
NODE_ENV=production
```

### משתנים אופציונליים:

```
ADMIN_FRONTEND_URL=https://your-app.vercel.app
```

**חשוב**: לאחר הוספת המשתנים, ודא שהם מוגדרים ל-**Production**, **Preview**, ו-**Development**.

## שלב 6: פריסה ל-Production

```bash
vercel --prod
```

או דרך ה-Dashboard:
1. עבור ל-**Deployments**
2. לחץ על ה-deployment האחרון
3. לחץ על **...** → **Promote to Production**

## שלב 7: בדיקה

1. פתח את ה-URL שקיבלת מ-Vercel
2. בדוק שהאפליקציה עובדת
3. בדוק את ה-API endpoints

## פתרון בעיות

### בעיה: MongoDB connection failed
**פתרון**: 
- ודא שה-MONGODB_URI נכון
- ודא ש-MongoDB Atlas מאפשר חיבורים מ-0.0.0.0/0 (או מה-IP של Vercel)
- בדוק את ה-Network Access ב-MongoDB Atlas

### בעיה: CORS errors
**פתרון**:
- ודא ש-ADMIN_FRONTEND_URL מוגדר נכון
- ודא שה-CORS ב-server.js כולל את ה-URL של Vercel

### בעיה: Build failed
**פתרון**:
- בדוק את ה-logs ב-Vercel Dashboard
- ודא ש-node_modules לא ב-.gitignore (או ש-Vercel יכול להתקין אותם)
- ודא שה-package.json נכון

### בעיה: API לא עובד
**פתרון**:
- בדוק שה-api/index.js קיים
- בדוק שה-vercel.json נכון
- בדוק את ה-logs ב-Vercel Dashboard → Functions

## הערות חשובות

1. **קבצים מעולים**: Vercel Serverless Functions לא תומכות באחסון קבצים מקומיים. עבור קבצים מעולים, תצטרך להשתמש ב:
   - Vercel Blob Storage
   - AWS S3
   - Cloudinary
   - או שירות אחסון אחר

2. **MongoDB Connection Pooling**: Vercel Serverless Functions יוצרות connection חדש בכל request. זה יכול לגרום לבעיות עם MongoDB connection limits. שקול להשתמש ב-MongoDB Atlas או להגדיר connection pooling.

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

