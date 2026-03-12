# פתרון בעיית 404 ב-Vercel

## הבעיה
מקבלים שגיאת 404: NOT_FOUND לאחר פריסה ב-Vercel.

## פתרון שלב אחר שלב

### שלב 1: מחק את הפרויקט הקודם ב-Vercel
1. היכנס ל-Vercel Dashboard: https://vercel.com/dashboard
2. לך לפרויקט שלך
3. לחץ על **Settings** → **General**
4. גלול למטה ולחץ על **Delete Project**
5. אשר את המחיקה

### שלב 2: צור פרויקט חדש עם הגדרות נכונות

#### דרך Vercel Dashboard:
1. לחץ על **Add New Project**
2. בחר את ה-repository שלך
3. **חשוב מאוד** - הגדר את ההגדרות הבאות:
   - **Framework Preset**: בחר **Vite** (או השאר **Other**)
   - **Root Directory**: לחץ על **Edit** ובחר **`frontend`**
   - **Build Command**: השאר ריק (Vercel יזהה אוטומטית)
   - **Output Directory**: השאר ריק (Vercel יזהה אוטומטית)
   - **Install Command**: השאר ריק

4. לחץ על **Deploy**

#### דרך Vercel CLI:
```bash
cd frontend
vercel
```

כשתשאל:
- **Set up and deploy?** → Y
- **Which scope?** → בחר את החשבון שלך
- **Link to existing project?** → N
- **What's your project's name?** → healing-fulfillment-customer
- **In which directory is your code located?** → ./
- **Want to override the settings?** → Y
  - **Build Command**: השאר ריק (Enter)
  - **Output Directory**: השאר ריק (Enter)
  - **Development Command**: השאר ריק (Enter)
  - **Install Command**: השאר ריק (Enter)

### שלב 3: ודא שהקבצים נכונים

הקובץ `vercel.json` צריך להיות בתיקיית `frontend` ולהכיל:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### שלב 4: בדוק את ה-Logs

אם עדיין יש בעיה:
1. לך ל-Deployment ב-Vercel Dashboard
2. לחץ על ה-deployment
3. בדוק את ה-**Build Logs**:
   - האם ה-build הצליח?
   - האם יש שגיאות?
   - האם הקבצים נוצרו ב-`dist`?

4. בדוק את ה-**Function Logs**:
   - האם יש שגיאות runtime?

### שלב 5: בדוק את ה-URL

ודא שאתה נכנס ל-URL הנכון:
- לא ל-`https://your-app.vercel.app/frontend`
- כן ל-`https://your-app.vercel.app`

### שלב 6: אם עדיין לא עובד - נסה זאת

אם עדיין יש 404, נסה להוסיף ל-`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## בדיקות נוספות

### בדוק שהבנייה עובדת מקומית:
```bash
cd frontend
npm run build
ls -la dist/
```

צריך לראות:
- `index.html`
- `assets/` folder עם הקבצים

### בדוק את ה-dist/index.html:
הקובץ צריך להכיל הפניות נכונות לקבצים:
```html
<script type="module" crossorigin src="/assets/index-XXXXX.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-XXXXX.css">
```

שים לב שהנתיבים מתחילים ב-`/assets/` ולא ב-`./assets/` או `assets/`.

## אם כל זה לא עוזר

שלח את ה-Build Logs מה-Vercel Dashboard ואני אעזור לך לפתור את הבעיה.

