# מבנה העץ של הפרויקט - Healing Fulfillment Admin

```
admin/
├── api/                          # Vercel Serverless Functions
│   ├── index.js                  # Serverless function entry point
│   └── package.json              # ES Module configuration
│
├── backend/                      # Express.js Backend
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   │
│   ├── models/                   # Mongoose Models
│   │   ├── Booking.js           # Booking model
│   │   ├── Category.js           # Category model
│   │   ├── Contact.js           # Contact model
│   │   ├── Course.js            # Course model
│   │   ├── Customer.js          # Customer model
│   │   ├── Message.js           # Message model
│   │   ├── Purchase.js          # Purchase model
│   │   └── Review.js            # Review model
│   │
│   ├── routes/                   # Express Routes
│   │   ├── admin.js             # Admin routes (categories, courses, purchases, bookings)
│   │   ├── booking.js           # Booking routes
│   │   ├── categories.js        # Public categories routes
│   │   ├── contact.js           # Contact form routes
│   │   ├── courses.js            # Public courses routes
│   │   ├── customers.js          # Customer management routes
│   │   ├── messages.js           # Message routes
│   │   ├── purchases.js          # Purchase routes
│   │   ├── reviews.js            # Review routes
│   │   ├── test-email.js        # Email testing route
│   │   └── upload.js             # File upload routes
│   │
│   ├── services/
│   │   └── emailService.js       # Email service (Nodemailer)
│   │
│   ├── validation/
│   │   ├── bookingValidation.js # Booking validation schemas
│   │   └── contactValidation.js  # Contact validation schemas
│   │
│   ├── uploads/                  # Uploaded files
│   │   ├── files/                # General files
│   │   ├── images/               # Images
│   │   └── videos/               # Videos
│   │
│   ├── server.js                 # Express app entry point
│   ├── package.json              # Backend dependencies
│   └── README.md                 # Backend documentation
│
├── frontend/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/           # React Components
│   │   │   ├── Button.jsx       # Button component
│   │   │   ├── Card.jsx         # Card component
│   │   │   ├── ErrorBoundary.jsx # Error boundary
│   │   │   ├── Navbar.jsx       # Navigation bar
│   │   │   └── Section.jsx      # Section component
│   │   │
│   │   ├── pages/                # Page Components
│   │   │   ├── AdminPage.jsx    # Main admin page
│   │   │   ├── BookingsPage.jsx # Bookings management
│   │   │   ├── ContactsPage.jsx  # Contacts management
│   │   │   ├── CustomerPage.jsx  # Single customer view
│   │   │   ├── CustomersPage.jsx # Customers list
│   │   │   ├── DashboardPage.jsx # Dashboard
│   │   │   ├── MessagesPage.jsx  # Messages management
│   │   │   └── ReviewsPage.jsx    # Reviews management
│   │   │
│   │   ├── services/             # API Services
│   │   │   ├── adminApi.js      # Admin API calls
│   │   │   ├── api.js           # Axios instance & config
│   │   │   └── customerApi.js   # Customer API calls
│   │   │
│   │   ├── utils/
│   │   │   └── confetti.js      # Confetti utility
│   │   │
│   │   ├── App.jsx              # Main App component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   │
│   ├── dist/                     # Build output (generated)
│   │   ├── assets/              # Compiled JS/CSS
│   │   └── index.html           # Production HTML
│   │
│   ├── index.html               # Development HTML
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── postcss.config.js        # PostCSS config
│   └── README.md                # Frontend documentation
│
├── .gitignore                    # Git ignore rules
├── .vercelignore                 # Vercel ignore rules
├── package.json                  # Root package.json
├── vercel.json                   # Vercel deployment config
│
└── Documentation/
    ├── API_REQUESTS.md           # API endpoints documentation
    ├── ENV_EXAMPLE.txt           # Environment variables example
    ├── ES_MODULE_AUDIT_REPORT.md # ES Module audit report
    ├── ES_MODULE_FIX_REPORT.md   # ES Module fix report
    ├── README.md                 # Main README
    └── README_VERCEL.md          # Vercel deployment guide
```

## 📁 תיאור תיקיות

### `/api`
- **תפקיד:** Vercel Serverless Functions
- **קבצים:**
  - `index.js` - Serverless function handler שמפנה requests ל-Express app
  - `package.json` - מגדיר את התיקייה כ-ES Module

### `/backend`
- **תפקיד:** Express.js Backend API
- **תיקיות:**
  - `middleware/` - Express middleware (auth, validation)
  - `models/` - Mongoose models (MongoDB schemas)
  - `routes/` - API route handlers
  - `services/` - Business logic services (email, etc.)
  - `validation/` - Input validation schemas
  - `uploads/` - Uploaded files storage
- **קבצים:**
  - `server.js` - Express app entry point

### `/frontend`
- **תפקיד:** React + Vite Frontend
- **תיקיות:**
  - `src/components/` - Reusable React components
  - `src/pages/` - Page components (routes)
  - `src/services/` - API service functions
  - `src/utils/` - Utility functions
  - `dist/` - Build output (generated by Vite)
- **קבצים:**
  - `src/App.jsx` - Main App component with routing
  - `src/main.jsx` - React entry point
  - `vite.config.js` - Vite build configuration
  - `tailwind.config.js` - Tailwind CSS configuration

## 🔗 Route Mapping

### Backend Routes (`/backend/routes/`)
| Route File | Mount Path | Handles |
|------------|------------|---------|
| `admin.js` | `/api/admin` | Admin operations (categories, courses, purchases, bookings) |
| `customers.js` | `/api` | Customer management (`/admin/customers/*`) |
| `courses.js` | `/api/courses` | Public courses |
| `categories.js` | `/api/categories` | Public categories |
| `purchases.js` | `/api/purchases` | Purchase operations |
| `booking.js` | `/api/booking` | Booking creation |
| `upload.js` | `/api/upload` | File uploads |
| `messages.js` | `/api/messages` | Message operations |
| `reviews.js` | `/api/reviews` | Review operations |
| `contact.js` | `/api/contact` | Contact form |
| `test-email.js` | `/api/test-email` | Email testing |

### Frontend Routes (`/frontend/src/pages/`)
| Page Component | Route Path | Description |
|----------------|------------|-------------|
| `AdminPage.jsx` | `/` | Main admin dashboard |
| `DashboardPage.jsx` | `/dashboard` | Statistics dashboard |
| `CustomersPage.jsx` | `/customers` | Customers list |
| `CustomerPage.jsx` | `/customer/:id` | Single customer view |
| `BookingsPage.jsx` | `/bookings` | Bookings management |
| `ContactsPage.jsx` | `/contacts` | Contacts management |
| `MessagesPage.jsx` | `/messages` | Messages management |
| `ReviewsPage.jsx` | `/reviews` | Reviews management |

## 📦 Dependencies

### Backend (`/backend/package.json`)
- **Runtime:** Express, Mongoose, JWT, Nodemailer
- **Security:** Helmet, CORS, bcrypt
- **Validation:** Joi
- **File Upload:** Multer

### Frontend (`/frontend/package.json`)
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **UI:** React Hot Toast, Canvas Confetti

## 🚀 Deployment

### Vercel Configuration (`/vercel.json`)
- **Build Command:** Installs dependencies and builds frontend
- **Output Directory:** `frontend/dist`
- **Rewrites:**
  - `/api/*` → `/api/index.js` (Serverless function)
  - `/*` → `/index.html` (SPA routing)

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration
- `ADMIN_FRONTEND_URL` - Frontend URL for CORS
- `FRONTEND_URL` - Frontend URL for email links

---

**עודכן:** $(date)  
**גרסה:** 1.0.0


