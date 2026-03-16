# הגדרת מערכת המיילים האוטומטיים

## בעיות נפוצות ופתרונות

### 1. משתני סביבה לא מוגדרים

המערכת דורשת את משתני הסביבה הבאים:

- `SMTP_HOST` - כתובת שרת SMTP (ברירת מחדל: `smtp.gmail.com`)
- `SMTP_PORT` - פורט שרת SMTP (ברירת מחדל: `587`)
- `SMTP_USER` - כתובת האימייל שלך
- `SMTP_PASSWORD` - סיסמת האימייל או App Password

### 2. הגדרת משתני סביבה ב-Vercel

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Environment Variables**
4. הוסף את המשתנים הבאים:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

5. לחץ על **Save**
6. **חשוב**: לאחר הוספת משתנים חדשים, צריך לעשות **Redeploy** לפרויקט

### 3. הגדרת Gmail App Password

אם אתה משתמש ב-Gmail, אתה צריך ליצור **App Password** במקום הסיסמה הרגילה:

1. היכנס ל-[Google Account](https://myaccount.google.com/)
2. לך ל-**Security** → **2-Step Verification** (חייב להיות מופעל)
3. גלול למטה ל-**App passwords**
4. בחר **Mail** ו-**Other (Custom name)**
5. הזן שם כמו "Healing Fulfillment Admin"
6. לחץ על **Generate**
7. העתק את הסיסמה שנוצרה (16 תווים)
8. השתמש בסיסמה הזו ב-`SMTP_PASSWORD`

### 4. בדיקת המיילים

לאחר הגדרת משתני הסביבה, תוכל לבדוק את המיילים:

**בדיקה דרך API:**
```
GET /api/test-email?email=your-email@example.com
```

**בדיקה דרך הדפדפן:**
```
https://your-domain.vercel.app/api/test-email?email=your-email@example.com
```

### 5. לוגים וניפוי שגיאות

המערכת מדפיסה לוגים מפורטים בקונסול. בדוק את הלוגים ב-Vercel:

1. לך ל-**Deployments** → בחר את ה-deployment האחרון
2. לחץ על **Functions** → בחר את הפונקציה
3. בדוק את ה-**Logs**

**לוגים חשובים:**
- `📧 SMTP_USER: ✅ Set` - משתנה מוגדר
- `📧 SMTP_PASSWORD: ✅ Set` - משתנה מוגדר
- `✅ SMTP server connection verified` - חיבור הצליח
- `✅ Email sent successfully!` - מייל נשלח בהצלחה

**שגיאות נפוצות:**
- `❌ SMTP credentials not configured` - משתני סביבה חסרים
- `❌ SMTP server verification failed` - בעיה בחיבור לשרת
- `Error: Invalid login` - שם משתמש או סיסמה שגויים
- `Error: Less secure app access` - צריך App Password ב-Gmail

### 6. מיילים אוטומטיים

המערכת שולחת מיילים אוטומטיים במקרים הבאים:

1. **אישור רכישה** - כשנוצרת רכישה חדשה (`sendPurchaseConfirmationEmail`)
2. **אישור פגישת היכרות** - כשנוצרת פגישת היכרות (`sendIntroMeetingConfirmationEmail`)
3. **אישור פגישה רגילה** - כשנוצרת פגישה רגילה (`sendRegularMeetingConfirmationEmail`)
4. **יצירת חשבון** - כשנוצר חשבון חדש ללקוח (`sendAccountCreationEmail`)
5. **שליחת הודעות** - כשמנהל שולח הודעה ללקוחות (`sendEmail`)

### 7. פתרון בעיות

**הבעיה: מיילים לא נשלחים**

1. בדוק שהמשתנים מוגדרים ב-Vercel
2. ודא שעשית Redeploy לאחר הוספת משתנים
3. בדוק את הלוגים ב-Vercel
4. נסה לשלוח מייל בדיקה דרך `/api/test-email`
5. ודא ש-2-Step Verification מופעל ב-Gmail
6. ודא שאתה משתמש ב-App Password ולא בסיסמה רגילה

**הבעיה: "SMTP verification failed"**

1. בדוק את `SMTP_HOST` ו-`SMTP_PORT`
2. ודא שהפורט נכון (587 ל-TLS, 465 ל-SSL)
3. בדוק שאין firewall חוסם את החיבור
4. נסה שרת SMTP אחר (למשל SendGrid, Mailgun)

**הבעיה: "Invalid login"**

1. ודא ש-`SMTP_USER` הוא כתובת האימייל המלאה
2. ודא ש-`SMTP_PASSWORD` הוא App Password (לא סיסמה רגילה)
3. ודא ש-2-Step Verification מופעל
4. נסה ליצור App Password חדש

### 8. שרתי SMTP חלופיים

אם Gmail לא עובד, תוכל להשתמש בשרתי SMTP אחרים:

**SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

**Outlook/Office 365:**
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### 9. בדיקת הגדרות

לאחר הגדרת כל המשתנים, בדוק:

1. ✅ משתני סביבה מוגדרים ב-Vercel
2. ✅ Redeploy בוצע
3. ✅ מייל בדיקה נשלח בהצלחה
4. ✅ לוגים מציגים "Email sent successfully"

אם הכל עובד, המיילים האוטומטיים יעבדו גם כן!

