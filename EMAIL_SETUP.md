# הגדרת מערכת הודעות אימייל אוטומטיות

## הגדרת SMTP

הוסף את המשתנים הבאים לקובץ `.env` שלך:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend URL (לשימוש בקישורים באימיילים)
FRONTEND_URL=http://localhost:3000
```

## הגדרת Gmail

אם אתה משתמש ב-Gmail:

1. **הפעל אימות דו-שלבי** בחשבון Google שלך
2. **צור סיסמת אפליקציה**:
   - לך ל-[Google Account Security](https://myaccount.google.com/apppasswords)
   - בחר "אפליקציה" → "דואר" → "התקן אחר"
   - העתק את הסיסמה שנוצרה
   - השתמש בסיסמה זו ב-`SMTP_PASSWORD`

## שירותי SMTP אחרים

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### שירות SMTP חיצוני (SendGrid, Mailgun, וכו')
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-api-key
```

## הודעות אימייל אוטומטיות

המערכת שולחת אימיילים אוטומטיים במקרים הבאים:

### 1. רכישה
- **מתי**: לאחר יצירת רכישה חדשה
- **תוכן**: אישור רכישה עם פרטי המסלול והתשלום

### 2. פגישת היכרות
- **מתי**: לאחר קביעת פגישת היכרות
- **תוכן**: אישור פגישה עם תאריך, שעה וסוג פגישה

### 3. פגישה רגילה
- **מתי**: לאחר קביעת פגישה רגילה (מהאתר או מהלקוח המחובר)
- **תוכן**: אישור פגישה עם פרטי הפגישה

### 4. יצירת חשבון
- **מתי**: כאשר המנהל יוצר חשבון ללקוח
- **תוכן**: פרטי התחברות עם סיסמה ראשונית

## בדיקת המערכת

אם ה-SMTP לא מוגדר, המערכת תדפיס הודעות ל-console במקום לשלוח אימיילים (במצב development).

## פתרון בעיות

### האימיילים לא נשלחים
1. בדוק שה-SMTP מוגדר נכון ב-`.env`
2. בדוק את ה-console logs לשגיאות
3. ודא שהסיסמה נכונה (ב-Gmail צריך סיסמת אפליקציה)

### שגיאת אימות
- ודא שהסיסמה נכונה
- ב-Gmail, ודא שהשתמשת בסיסמת אפליקציה ולא בסיסמה הרגילה

### האימיילים מגיעים ל-Spam
- ודא שה-`from` address תקין
- הוסף SPF ו-DKIM records ל-domain שלך (אם יש לך domain מותאם)

