# 🔧 פתרון בעיית 404 ב-Vercel

## הבעיה
אם אתה מקבל שגיאת 404, זה אומר שה-Root Directory או ה-Output Directory לא מוגדרים נכון ב-Vercel Dashboard.

## ✅ פתרון שלב אחר שלב

### שלב 1: מחק את הפרויקט הקודם
1. לך ל-Vercel Dashboard
2. Settings → General → Delete Project

### שלב 2: צור פרויקט חדש עם הגדרות נכונות

#### דרך Vercel Dashboard:

1. **Add New Project**
2. בחר את ה-repository שלך
3. **חשוב מאוד - הגדר את ההגדרות הבאות:**

   **Root Directory:**
   - לחץ על **"Edit"** ליד Root Directory
   - בחר **`frontend`** (לא שורש ה-repo!)
   - לחץ **Continue**

   **Framework Preset:**
   - בחר **Vite** (או **Other**)

   **Build and Output Settings:**
   - **Build Command**: השאר ריק (Vercel יזהה אוטומטית)
   - **Output Directory**: השאר ריק (Vercel יזהה אוטומטית)
   - **Install Command**: השאר ריק

4. לחץ **Deploy**

### שלב 3: אם עדיין יש 404

אם עדיין יש 404 אחרי הפריסה, נסה:

#### אפשרות A: Root Directory = `frontend`
אם ה-Root Directory מוגדר ל-`frontend`:
- Output Directory צריך להיות: **`dist`** (לא `frontend/dist`!)

#### אפשרות B: Root Directory = שורש ה-repo
אם ה-Root Directory הוא שורש ה-repo:
- Output Directory צריך להיות: **`frontend/dist`**

### שלב 4: בדוק את ה-Logs

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
- ✅ `https://your-app.vercel.app`
- ❌ לא `https://your-app.vercel.app/frontend`

## 🔍 בדיקות נוספות

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
הקובץ צריך להכיל הפניות נכונות:
```html
<script type="module" crossorigin src="/assets/index-XXXXX.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-XXXXX.css">
```

שים לב שהנתיבים מתחילים ב-`/assets/` ולא ב-`./assets/` או `assets/`.

## 📝 הגדרות מומלצות ב-Vercel Dashboard

לאחר יצירת הפרויקט, לך ל-**Settings** → **General** וודא:

- ✅ **Root Directory**: `frontend`
- ✅ **Framework Preset**: Vite
- ✅ **Build Command**: (ריק - Vercel יזהה אוטומטית)
- ✅ **Output Directory**: (ריק - Vercel יזהה אוטומטית)

## 🚨 אם כל זה לא עוזר

1. שלח את ה-Build Logs מה-Vercel Dashboard
2. שלח את ה-Function Logs
3. בדוק מה ה-Root Directory וה-Output Directory שמוגדרים ב-Vercel Dashboard

## ✅ הגדרות נכונות - סיכום

```
Root Directory: frontend
Framework: Vite
Build Command: (empty - auto-detect)
Output Directory: (empty - auto-detect)
Install Command: (empty)
```

או אם Root Directory הוא שורש ה-repo:
```
Root Directory: ./
Framework: Vite
Build Command: cd frontend && npm run build
Output Directory: frontend/dist
```

