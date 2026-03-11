# API Routes Documentation

## כל ה-Routes ב-Backend

### 1. Contact Routes (`/api/contact`)
- **POST** `/api/contact` - שליחת טופס יצירת קשר

### 2. Booking Routes (`/api/booking`)
- **POST** `/api/booking` - יצירת בקשה לפגישה

### 3. Blog Routes (`/api/blog`)
- **GET** `/api/blog` - קבלת כל הפוסטים שפורסמו
- **GET** `/api/blog/:slug` - קבלת פוסט בודד לפי slug
- **POST** `/api/blog` - יצירת פוסט חדש (admin only)

### 4. Courses Routes (`/api/courses`)
- **GET** `/api/courses` - קבלת כל הקורסים הפעילים
- **GET** `/api/courses/:id` - קבלת קורס בודד לפי ID

### 5. Categories Routes (`/api/categories`)
- **GET** `/api/categories` - קבלת כל הקטגוריות הפעילות
- **GET** `/api/categories/:id` - קבלת קטגוריה בודדת לפי ID

### 6. Purchases Routes (`/api/purchases`)
- **POST** `/api/purchases` - יצירת רכישה חדשה
- **GET** `/api/purchases` - קבלת כל הרכישות (admin)

### 7. Upload Routes (`/api/upload`)
- **POST** `/api/upload` - העלאת קובץ (לא נתמך ב-Vercel - צריך external storage)

### 8. Customers Routes (`/api/admin/customers`)
- **GET** `/api/admin/customers` - קבלת כל הלקוחות
- **GET** `/api/admin/customers/:id` - קבלת לקוח בודד
- **POST** `/api/admin/customers/:id/files` - העלאת קובץ ללקוח
- **DELETE** `/api/admin/customers/:id/files/:fileId` - מחיקת קובץ של לקוח
- **POST** `/api/admin/customers/:id/notes` - הוספת הערה ללקוח
- **PUT** `/api/admin/customers/:id/sessions` - עדכון מספר מפגשים
- **POST** `/api/admin/customers/:id/create-account` - יצירת חשבון ללקוח
- **POST** `/api/admin/customers/:id/reset-password` - איפוס סיסמה ללקוח

### 9. Auth Routes (`/api/auth`)
- **GET** `/api/auth/login` - מידע על endpoint התחברות (מחזיר 405)
- **POST** `/api/auth/login` - התחברות עם אימייל וסיסמה
- **POST** `/api/auth/change-password` - שינוי סיסמה (דורש אימות)
- **GET** `/api/auth/me` - קבלת פרטי המשתמש המחובר (דורש אימות)
- **POST** `/api/auth/booking` - יצירת פגישה למשתמש מחובר (דורש אימות)

### 10. Login Alias (`/api/login`)
- **GET** `/api/login` - alias ל-`/api/auth/login` (מחזיר 405)
- **POST** `/api/login` - alias ל-`/api/auth/login`

### 11. Admin Routes (`/api/admin`)

#### Categories
- **GET** `/api/admin/categories` - קבלת כל הקטגוריות
- **POST** `/api/admin/categories` - יצירת קטגוריה חדשה
- **PUT** `/api/admin/categories/:id` - עדכון קטגוריה
- **DELETE** `/api/admin/categories/:id` - מחיקת קטגוריה

#### Courses
- **GET** `/api/admin/courses` - קבלת כל הקורסים
- **GET** `/api/admin/courses/:id` - קבלת קורס בודד
- **POST** `/api/admin/courses` - יצירת קורס חדש
- **PUT** `/api/admin/courses/:id` - עדכון קורס
- **DELETE** `/api/admin/courses/:id` - מחיקת קורס

#### Purchases
- **GET** `/api/admin/purchases` - קבלת כל הרכישות
- **PUT** `/api/admin/purchases/:id/status` - עדכון סטטוס רכישה

#### Bookings
- **GET** `/api/admin/bookings` - קבלת כל הפגישות
- **PUT** `/api/admin/bookings/:id/status` - עדכון סטטוס פגישה
- **PUT** `/api/admin/bookings/:id/zoom-link` - עדכון קישור Zoom

### 12. Health Check
- **GET** `/health` - בדיקת תקינות השרת (לא דורש MongoDB)

## HTTP Methods נתמכים
- **GET** - קריאה
- **POST** - יצירה
- **PUT** - עדכון
- **DELETE** - מחיקה

## Vercel Configuration
כל ה-routes מטופלים דרך `api/[...path].js` - catch-all route שמנתב את כל הבקשות ל-Express app.

## Path Routing ב-Vercel
Vercel מעביר את ה-path דרך query parameter `...path`:
- `/api/contact` → `...path=contact`
- `/api/auth/login` → `...path=auth/login`
- `/api/admin/categories` → `...path=admin/categories`
- `/api/admin/customers/123/files` → `...path=admin/customers/123/files`

ה-path routing ב-`api/[...path].js` מטפל בכל המקרים האלה ומבטיח שה-path מגיע נכון ל-Express Router.

