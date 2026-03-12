# Healing Fulfillment Admin Panel

פאנל ניהול למערכת Healing Fulfillment

## התקנה מקומית

1. התקן את כל התלויות:
```bash
npm run install:all
```

2. הפעל את השרתים (backend + frontend):
```bash
npm run dev
```

או בנפרד:
```bash
# Backend (פורט 5001)
npm run dev:backend

# Frontend (פורט 3001)
npm run dev:frontend
```

## מבנה הפרויקט

```
admin/
├── backend/         # Backend Express server
│   ├── routes/      # API routes
│   ├── models/      # MongoDB models
│   └── server.js    # Express app
├── frontend/        # React frontend
│   ├── src/        # Source code
│   └── dist/       # Build output
```

## פיתוח

### Backend
- Express.js
- MongoDB עם Mongoose
- JWT Authentication
- Multer לניהול קבצים

### Frontend
- React
- Vite
- Tailwind CSS
- React Router

## תמיכה

לשאלות או בעיות, צור issue ב-GitHub.

