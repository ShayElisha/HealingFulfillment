# Healing Fulfillment - Therapist Website

Production-ready website for a therapist specializing in anxiety, trauma, emotional release, and self-fulfillment.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express (Microservices Architecture)
- **Database**: MongoDB
- **Language**: Hebrew (RTL)

## Architecture

הפרויקט מחולק למיקרו-סרוויסים עצמאיים:

- **Customer Service** - שירות ללקוחות (Port 5000)
- **Admin Service** - שירות למנהל (Port 5001)

כל שירות הוא עצמאי לחלוטין עם הקבצים שלו (models, middleware, services, validation).

## Setup

כל שירות הוא פרויקט נפרד לחלוטין עם `package.json` ו-`node_modules` משלו.

### התקנה

```bash
# התקנת כל השירותים (מהשורש)
npm run install:all

# או התקנה נפרדת לכל שירות:
cd customer/frontend && npm install
cd customer/backend && npm install
cd admin/frontend && npm install
cd admin/backend && npm install
```

### הרצה

```bash
# הרצת כל השירותים (מהשורש)
npm run dev:all

# או הרצה נפרדת לכל שירות:
cd customer/frontend && npm run dev
cd customer/backend && npm run dev
cd admin/frontend && npm run dev
cd admin/backend && npm run dev

# או מהשורש:
npm run dev:customer    # Customer service (frontend + backend)
npm run dev:admin      # Admin service (frontend + backend)
```

### Build

```bash
# Build כל השירותים
npm run build:all

# או Build נפרד:
cd customer/frontend && npm run build
cd admin/frontend && npm run build
```

## Environment Variables

Create `.env` files in each backend directory:

### customer/backend/.env:
```
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

### admin/backend/.env:
```
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

## Project Structure

```
├── customer/              # Customer Service
│   ├── frontend/          # Customer frontend (port 3000)
│   └── backend/           # Customer backend API (port 5000)
│       ├── models/        # Mongoose models
│       ├── middleware/    # Express middleware
│       ├── services/      # Services (email, etc.)
│       ├── validation/    # Joi validation schemas
│       └── routes/        # API routes
│
├── admin/                 # Admin Service
│   ├── frontend/          # Admin frontend (port 3001)
│   └── backend/           # Admin backend API (port 5001)
│       ├── models/        # Mongoose models
│       ├── middleware/    # Express middleware
│       ├── services/      # Services (email, etc.)
│       ├── validation/    # Joi validation schemas
│       └── routes/        # API routes
```

## Services

### Customer Service
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Routes: `/api/auth/*`, `/api/booking/*`, `/api/contact/*`, `/api/reviews/*`, etc.

### Admin Service
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:5001`
- Routes: `/api/admin/*`, `/api/customers/*`, `/api/upload/*`, etc.
