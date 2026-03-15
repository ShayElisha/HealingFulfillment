# רשימת בקשות API לשרת ב-Vercel

**Base URL:** `https://your-app.vercel.app`

---

## 🔍 Health Check

### GET /api/health
בדיקת תקינות השרת

```bash
curl https://your-app.vercel.app/api/health
```

**תגובה:**
```json
{
  "status": "ok",
  "service": "admin-service",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 👥 Customers (לקוחות)

### GET /api/admin/customers
קבלת כל הלקוחות

```bash
curl https://your-app.vercel.app/api/admin/customers
```

**תגובה:**
```json
{
  "message": "Customers retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "שם לקוח",
      "email": "email@example.com",
      "phone": "050-123-4567",
      "purchases": [...],
      "bookings": [...],
      "stats": {
        "totalSessions": 5,
        "confirmedSessions": 3,
        "completedCourses": 2,
        "totalSpent": 10000
      }
    }
  ]
}
```

### GET /api/admin/customers/:id
קבלת לקוח ספציפי

```bash
curl https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID
```

### POST /api/admin/customers/:id/files
העלאת קובץ ללקוח

```bash
curl -X POST https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID/files \
  -F "file=@/path/to/file.pdf" \
  -F "description=תיאור הקובץ"
```

### DELETE /api/admin/customers/:id/files/:fileId
מחיקת קובץ של לקוח

```bash
curl -X DELETE https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID/files/FILE_ID
```

### POST /api/admin/customers/:id/notes
הוספת הערה ללקוח

```bash
curl -X POST https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID/notes \
  -H "Content-Type: application/json" \
  -d '{"content": "תוכן ההערה"}'
```

### PUT /api/admin/customers/:id/sessions
עדכון מספר סשנים

```bash
curl -X PUT https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID/sessions \
  -H "Content-Type: application/json" \
  -d '{"completedSessions": 5}'
```

### POST /api/admin/customers/:id/create-account
יצירת חשבון ללקוח

```bash
curl -X POST https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID/create-account
```

**תגובה:**
```json
{
  "message": "חשבון נוצר בהצלחה",
  "data": {
    "customerId": "...",
    "email": "email@example.com",
    "initialPassword": "GENERATED_PASSWORD"
  }
}
```

### POST /api/admin/customers/:id/reset-password
איפוס סיסמה ללקוח

```bash
curl -X POST https://your-app.vercel.app/api/admin/customers/CUSTOMER_ID/reset-password
```

---

## 📚 Courses (קורסים)

### GET /api/courses
קבלת כל הקורסים הפעילים

```bash
curl https://your-app.vercel.app/api/courses
```

**תגובה:**
```json
{
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "...",
      "title": "שם הקורס",
      "description": "תיאור הקורס",
      "price": 1000,
      "videos": [...]
    }
  ]
}
```

### GET /api/courses/:id
קבלת קורס ספציפי

```bash
curl https://your-app.vercel.app/api/courses/COURSE_ID
```

---

## 🏷️ Categories (קטגוריות)

### GET /api/categories
קבלת כל הקטגוריות הפעילות

```bash
curl https://your-app.vercel.app/api/categories
```

**תגובה:**
```json
{
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "...",
      "name": "שם הקטגוריה",
      "description": "תיאור",
      "isActive": true,
      "order": 1
    }
  ]
}
```

### GET /api/categories/:id
קבלת קטגוריה ספציפית

```bash
curl https://your-app.vercel.app/api/categories/CATEGORY_ID
```

---

## 🛒 Purchases (רכישות)

### GET /api/purchases
קבלת כל הרכישות

```bash
curl https://your-app.vercel.app/api/purchases
```

### POST /api/purchases
יצירת רכישה חדשה

```bash
curl -X POST https://your-app.vercel.app/api/purchases \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "COURSE_ID",
    "customerName": "שם לקוח",
    "customerEmail": "email@example.com",
    "customerPhone": "050-123-4567",
    "paymentMethod": "credit_card",
    "notes": "הערות"
  }'
```

---

## 📅 Bookings (פגישות)

### POST /api/booking
יצירת פגישה חדשה

```bash
curl -X POST https://your-app.vercel.app/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "שם הלקוח",
    "email": "email@example.com",
    "phone": "050-123-4567",
    "preferredDate": "2024-01-15",
    "preferredTime": "10:00",
    "meetingType": "zoom",
    "isIntroMeeting": true,
    "message": "הודעה"
  }'
```

**תגובה:**
```json
{
  "message": "Booking created successfully",
  "data": {
    "_id": "...",
    "name": "שם הלקוח",
    "preferredDate": "2024-01-15T00:00:00.000Z",
    "status": "pending"
  }
}
```

---

## ⭐ Reviews (ביקורות)

### GET /api/reviews
קבלת כל הביקורות המאושרות (ציבורי)

```bash
curl https://your-app.vercel.app/api/reviews
```

**תגובה:**
```json
{
  "message": "Reviews retrieved successfully",
  "data": [
    {
      "_id": "...",
      "customerName": "שם הלקוח",
      "rating": 5,
      "content": "תוכן הביקורת",
      "status": "approved",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### GET /api/reviews/stats
קבלת סטטיסטיקות ביקורות

```bash
curl https://your-app.vercel.app/api/reviews/stats
```

**תגובה:**
```json
{
  "message": "Review statistics retrieved successfully",
  "data": {
    "total": 50,
    "averageRating": 4.5,
    "ratingDistribution": {
      "5": 30,
      "4": 15,
      "3": 5
    }
  }
}
```

### POST /api/reviews
יצירת ביקורת חדשה (דורש authentication)

```bash
curl -X POST https://your-app.vercel.app/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "rating": 5,
    "content": "תוכן הביקורת"
  }'
```

### GET /api/reviews/my-review
קבלת הביקורת שלי (דורש authentication)

```bash
curl https://your-app.vercel.app/api/reviews/my-review \
  -H "Authorization: Bearer JWT_TOKEN"
```

### GET /api/reviews/admin/all
קבלת כל הביקורות (admin)

```bash
curl https://your-app.vercel.app/api/reviews/admin/all
```

### PUT /api/reviews/admin/:id/status
עדכון סטטוס ביקורת (admin)

```bash
curl -X PUT https://your-app.vercel.app/api/reviews/admin/REVIEW_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

---

## 📧 Contact (פניות)

### GET /api/contact
קבלת כל הפניות (admin)

```bash
curl https://your-app.vercel.app/api/contact
```

### POST /api/contact
יצירת פנייה חדשה

```bash
curl -X POST https://your-app.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "שם",
    "email": "email@example.com",
    "phone": "050-123-4567",
    "message": "תוכן הפנייה"
  }'
```

---

## 💬 Messages (הודעות)

### GET /api/messages
קבלת כל ההודעות (admin)

```bash
curl https://your-app.vercel.app/api/messages
```

### POST /api/messages
שליחת הודעה

```bash
curl -X POST https://your-app.vercel.app/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "נושא ההודעה",
    "content": "תוכן ההודעה",
    "recipients": ["CUSTOMER_ID_1", "CUSTOMER_ID_2"],
    "channels": ["email", "sms"]
  }'
```

### GET /api/messages/:id
קבלת הודעה ספציפית

```bash
curl https://your-app.vercel.app/api/messages/MESSAGE_ID
```

### GET /api/messages/customer/:customerId
קבלת הודעות של לקוח ספציפי

```bash
curl https://your-app.vercel.app/api/messages/customer/CUSTOMER_ID
```

---

## 🎯 Admin Routes

### Categories Management

#### GET /api/admin/categories
קבלת כל הקטגוריות (admin)

```bash
curl https://your-app.vercel.app/api/admin/categories
```

#### POST /api/admin/categories
יצירת קטגוריה חדשה

```bash
curl -X POST https://your-app.vercel.app/api/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "שם הקטגוריה",
    "description": "תיאור",
    "isActive": true,
    "order": 1
  }'
```

#### PUT /api/admin/categories/:id
עדכון קטגוריה

```bash
curl -X PUT https://your-app.vercel.app/api/admin/categories/CATEGORY_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "שם מעודכן",
    "isActive": true
  }'
```

#### DELETE /api/admin/categories/:id
מחיקת קטגוריה

```bash
curl -X DELETE https://your-app.vercel.app/api/admin/categories/CATEGORY_ID
```

### Courses Management

#### GET /api/admin/courses
קבלת כל הקורסים (admin)

```bash
curl https://your-app.vercel.app/api/admin/courses
```

#### GET /api/admin/courses/:id
קבלת קורס ספציפי (admin)

```bash
curl https://your-app.vercel.app/api/admin/courses/COURSE_ID
```

#### POST /api/admin/courses
יצירת קורס חדש

```bash
curl -X POST https://your-app.vercel.app/api/admin/courses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "שם הקורס",
    "description": "תיאור",
    "price": 1000,
    "category": "CATEGORY_ID",
    "isActive": true
  }'
```

#### PUT /api/admin/courses/:id
עדכון קורס

```bash
curl -X PUT https://your-app.vercel.app/api/admin/courses/COURSE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "שם מעודכן",
    "price": 1200
  }'
```

#### DELETE /api/admin/courses/:id
מחיקת קורס

```bash
curl -X DELETE https://your-app.vercel.app/api/admin/courses/COURSE_ID
```

### Purchases Management

#### GET /api/admin/purchases
קבלת כל הרכישות (admin)

```bash
curl https://your-app.vercel.app/api/admin/purchases
```

#### PUT /api/admin/purchases/:id/status
עדכון סטטוס רכישה

```bash
curl -X PUT https://your-app.vercel.app/api/admin/purchases/PURCHASE_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Bookings Management

#### GET /api/admin/bookings
קבלת כל הפגישות (admin)

```bash
curl https://your-app.vercel.app/api/admin/bookings
```

#### PUT /api/admin/bookings/:id/status
עדכון סטטוס פגישה

```bash
curl -X PUT https://your-app.vercel.app/api/admin/bookings/BOOKING_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

#### PUT /api/admin/bookings/:id/session-summary
עדכון סיכום פגישה

```bash
curl -X PUT https://your-app.vercel.app/api/admin/bookings/BOOKING_ID/session-summary \
  -H "Content-Type: application/json" \
  -d '{"sessionSummary": "סיכום הפגישה"}'
```

#### PUT /api/admin/bookings/:id/zoom-link
עדכון קישור זום

```bash
curl -X PUT https://your-app.vercel.app/api/admin/bookings/BOOKING_ID/zoom-link \
  -H "Content-Type: application/json" \
  -d '{"zoomLink": "https://zoom.us/j/123456789"}'
```

---

## 📤 Upload (העלאת קבצים)

### POST /api/upload
העלאת קובץ כללי

```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -F "file=@/path/to/file.pdf" \
  -F "type=pdf"
```

**תגובה:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "url": "/uploads/files/file-1234567890.pdf",
    "filename": "file.pdf",
    "size": 1024000
  }
}
```

---

## 🧪 Test Email

### GET /api/test-email
בדיקת שליחת אימייל

```bash
curl "https://your-app.vercel.app/api/test-email?email=your@email.com"
```

**תגובה:**
```json
{
  "message": "Email sent successfully!",
  "messageId": "...",
  "response": "250 Message accepted"
}
```

---

## 🔐 Authentication

### Headers נדרשים

לבקשות שדורשות authentication, הוסף header:

```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### קבלת JWT Token

לאחר יצירת חשבון ללקוח (`/api/admin/customers/:id/create-account`), הלקוח יכול להתחבר ולקבל token דרך ה-frontend.

---

## 📝 הערות חשובות

### Base URL
החלף `your-app.vercel.app` בכתובת האמיתית של האתר ב-Vercel.

### Content-Type
לבקשות POST/PUT, הוסף:
```bash
-H "Content-Type: application/json"
```

### File Uploads
להעלאת קבצים, השתמש ב-`multipart/form-data`:
```bash
-F "file=@/path/to/file.pdf"
```

### Error Responses
כל שגיאה תחזיר:
```json
{
  "message": "Error message",
  "error": "Detailed error (in development mode)"
}
```

### Rate Limiting
- כל ה-API: 200 בקשות ל-15 דקות
- Admin routes: 500 בקשות ל-15 דקות

---

## 🧪 דוגמאות בדיקה עם curl

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### קבלת לקוחות
```bash
curl https://your-app.vercel.app/api/admin/customers
```

### יצירת פגישה
```bash
curl -X POST https://your-app.vercel.app/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "יוסי כהן",
    "email": "yossi@example.com",
    "phone": "050-123-4567",
    "preferredDate": "2024-01-15",
    "preferredTime": "10:00",
    "meetingType": "zoom",
    "isIntroMeeting": true
  }'
```

### בדיקת אימייל
```bash
curl "https://your-app.vercel.app/api/test-email?email=test@example.com"
```

---

**עודכן:** $(date)  
**גרסה:** 1.0.0

