# Customer Service Backend

שירות Backend ללקוחות - Healing Fulfillment

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
PORT=5000
CUSTOMER_PORT=5000
CUSTOMER_FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/healing-fulfillment
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
FRONTEND_URL=http://localhost:3000
```

## Routes

- `/api/auth/*` - אימות לקוחות
- `/api/booking/*` - ניהול פגישות
- `/api/contact/*` - פניות יצירת קשר
- `/api/reviews/*` - ביקורות לקוחות
- `/api/courses/*` - קריאת מסלולים
- `/api/categories/*` - קריאת קטגוריות
- `/api/purchases/*` - קריאת רכישות
- `/api/messages/*` - הודעות ללקוחות

