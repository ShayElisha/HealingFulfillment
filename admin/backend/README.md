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
# העלאות (וידאו, קבצי לקוח, «למי זה מתאים») — Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
FRONTEND_URL=http://localhost:3001
ADMIN_BACKEND_URL=http://localhost:5001
CARDCOM_TERMINAL_NUMBER=
CARDCOM_API_NAME=
CARDCOM_API_PASSWORD=
CARDCOM_USERNAME=
CARDCOM_WEBHOOK_SECRET=
# אופציונלי:
# CARDCOM_API_URL=https://secure.cardcom.solutions/Interface/LowProfile.aspx
# CARDCOM_USER_PASSWORD=
# CARDCOM_API_LEVEL=
```

## Routes

- `/api/admin/*` - ניהול קטגוריות, מסלולים, רכישות
- `/api/customers/*` - ניהול לקוחות
- `/api/courses/*` - ניהול מסלולים
- `/api/categories/*` - ניהול קטגוריות
- `/api/purchases/*` - ניהול רכישות
- `/api/booking/*` - ניהול פגישות
- `/api/upload/*` - העלאת קבצים ל-Cloudinary (וידאו קטגוריות, אודיו/תמונות «למי זה מתאים»)
- `/api/messages/*` - שליחת הודעות
- `/api/reviews/*` - ניהול ביקורות
- `/api/contact/*` - צפייה בפניות

