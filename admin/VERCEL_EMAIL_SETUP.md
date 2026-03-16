# הגדרת מיילים ב-Vercel - מדריך מהיר

## הבעיה: "SMTP credentials missing"

אם אתה מקבל את השגיאה הזו, זה אומר שמשתני הסביבה לא מוגדרים ב-Vercel.

## פתרון מהיר (5 דקות)

### שלב 1: היכנס ל-Vercel Dashboard
1. לך ל-[https://vercel.com/dashboard](https://vercel.com/dashboard)
2. התחבר לחשבון שלך
3. בחר את הפרויקט: **HealingFulfillment** (או השם שלך)

### שלב 2: הוסף משתני סביבה
1. לחץ על **Settings** (הגדרות) בתפריט השמאלי
2. לחץ על **Environment Variables** (משתני סביבה)
3. הוסף את המשתנים הבאים אחד אחד:

#### משתנה 1: SMTP_HOST
- **Name**: `SMTP_HOST`
- **Value**: `smtp.gmail.com`
- **Environment**: בחר **Production**, **Preview**, ו-**Development** (כל שלושת האפשרויות)
- לחץ **Save**

#### משתנה 2: SMTP_PORT
- **Name**: `SMTP_PORT`
- **Value**: `587`
- **Environment**: בחר **Production**, **Preview**, ו-**Development**
- לחץ **Save**

#### משתנה 3: SMTP_USER
- **Name**: `SMTP_USER`
- **Value**: כתובת האימייל שלך (למשל: `your-email@gmail.com`)
- **Environment**: בחר **Production**, **Preview**, ו-**Development**
- לחץ **Save**

#### משתנה 4: SMTP_PASSWORD
- **Name**: `SMTP_PASSWORD`
- **Value**: App Password (ראה שלב 3 למטה)
- **Environment**: בחר **Production**, **Preview**, ו-**Development**
- לחץ **Save**

### שלב 3: צור Gmail App Password

אם אתה משתמש ב-Gmail, אתה **חייב** ליצור App Password (לא הסיסמה הרגילה):

1. לך ל-[Google Account](https://myaccount.google.com/)
2. לחץ על **Security** (אבטחה) בתפריט השמאלי
3. ודא ש-**2-Step Verification** (אימות דו-שלבי) **מופעל**
   - אם לא מופעל, הפעל אותו קודם
4. גלול למטה למצוא **App passwords** (סיסמאות אפליקציה)
5. לחץ על **App passwords**
6. בחר:
   - **App**: בחר **Mail**
   - **Device**: בחר **Other (Custom name)**
   - הזן: `Healing Fulfillment Admin`
7. לחץ **Generate** (יצירה)
8. **העתק את הסיסמה** שנוצרה (16 תווים, למשל: `abcd efgh ijkl mnop`)
9. **השתמש בסיסמה הזו** ב-`SMTP_PASSWORD` ב-Vercel (בלי רווחים)

### שלב 4: Redeploy
1. חזור ל-Vercel Dashboard
2. לך ל-**Deployments** (פריסות)
3. לחץ על **...** (שלוש נקודות) ליד ה-deployment האחרון
4. לחץ **Redeploy**
5. ודא שהמשתנים החדשים נבחרים
6. לחץ **Redeploy**

### שלב 5: בדיקה
1. לאחר ה-Redeploy, נסה לשלוח מייל בדיקה:
   ```
   https://healing-fulfillment-bxpu.vercel.app/api/test-email?email=your-email@example.com
   ```
2. אם זה עובד, תקבל:
   ```json
   {
     "message": "Email sent successfully!",
     "messageId": "...",
     "response": "..."
   }
   ```

## בדיקת משתני סביבה

לאחר ה-Redeploy, תוכל לבדוק את הלוגים:

1. לך ל-**Deployments** → בחר את ה-deployment האחרון
2. לחץ על **Functions** → בחר את הפונקציה
3. בדוק את ה-**Logs**

אתה אמור לראות:
```
📧 SMTP_USER: ✅ Set
📧 SMTP_PASSWORD: ✅ Set
✅ SMTP server connection verified
✅ Email sent successfully!
```

## פתרון בעיות

### "SMTP credentials missing"
- ✅ ודא שהוספת את כל 4 המשתנים
- ✅ ודא שבחרת את כל הסביבות (Production, Preview, Development)
- ✅ ודא שעשית Redeploy

### "Invalid login"
- ✅ ודא ש-`SMTP_USER` הוא כתובת האימייל המלאה
- ✅ ודא ש-`SMTP_PASSWORD` הוא App Password (לא סיסמה רגילה)
- ✅ ודא ש-2-Step Verification מופעל ב-Gmail

### "SMTP verification failed"
- ✅ בדוק את `SMTP_HOST` ו-`SMTP_PORT`
- ✅ ודא שהפורט נכון (587 ל-Gmail)
- ✅ נסה App Password חדש

## שרתי SMTP אחרים

אם Gmail לא עובד, תוכל להשתמש ב:

### SendGrid
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## סיכום

✅ הוסף 4 משתני סביבה ב-Vercel  
✅ צור Gmail App Password  
✅ Redeploy את הפרויקט  
✅ בדוק עם `/api/test-email`  

אם הכל עובד, המיילים האוטומטיים יעבדו גם כן!

