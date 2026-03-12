# Admin Service Backend

שירות Backend למנהל - Healing Fulfillment

## התקנה

```bash
npm install
```

## הרצה

```bash
# Development
npm run dev

# Production
npm start
```

## משתני סביבה

צור קובץ `.env`:

```env
PORT=5001
ADMIN_PORT=5001
ADMIN_FRONTEND_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/healing-fulfillment
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
FRONTEND_URL=http://localhost:3001
```

## Routes

- `/api/admin/*` - ניהול קטגוריות, מסלולים, רכישות
- `/api/customers/*` - ניהול לקוחות
- `/api/courses/*` - ניהול מסלולים
- `/api/categories/*` - ניהול קטגוריות
- `/api/purchases/*` - ניהול רכישות
- `/api/booking/*` - ניהול פגישות
- `/api/upload/*` - העלאת קבצים
- `/api/messages/*` - שליחת הודעות
- `/api/reviews/*` - ניהול ביקורות
- `/api/test-email/*` - בדיקת אימייל
- `/api/contact/*` - צפייה בפניות

