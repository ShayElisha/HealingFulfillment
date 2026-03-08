# Setup Guide - Healing Fulfillment

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud like MongoDB Atlas)
- npm or yarn

## Installation

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies
```bash
cd ../backend
npm install
```

### 4. Or Install All at Once
```bash
npm run install:all
```

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healing-fulfillment
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use: `mongodb://localhost:27017/healing-fulfillment`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `backend/.env`

## Running the Application

### Development Mode (Both Servers)

From root directory:
```bash
npm run dev
```

This runs:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

### Run Separately

**Frontend only:**
```bash
cd frontend
npm run dev
```

**Backend only:**
```bash
cd backend
npm run dev
```

## Production Build

### Build Frontend
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Run Backend in Production
```bash
cd backend
NODE_ENV=production npm start
```

## Project Structure

```
HealingFulfillment/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── layout/          # Layout components (Header, Footer)
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── assets/          # Images, fonts, etc.
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Node.js + Express backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── validation/          # Input validation
│   ├── server.js            # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Contact
- `POST /api/contact` - Submit contact form

### Booking
- `POST /api/booking` - Submit booking request

### Blog
- `GET /api/blog` - Get all published posts
- `GET /api/blog/:slug` - Get single post
- `POST /api/blog` - Create post (admin only)

### Health
- `GET /health` - Health check

## Troubleshooting

### Port Already in Use
Change ports in:
- `frontend/vite.config.js` (server.port)
- `backend/.env` (PORT)

### MongoDB Connection Error
- Check MongoDB is running
- Verify connection string in `.env`
- Check network/firewall settings

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env`
- Check CORS settings in `backend/server.js`

### Build Errors
- Clear `node_modules` and reinstall
- Check Node.js version (18+)
- Verify all environment variables are set

## Next Steps

1. **Customize Content**
   - Update therapist name/info
   - Add real phone number/email
   - Update WhatsApp number
   - Add real testimonials

2. **Add Blog Content**
   - Create blog posts via API
   - Or add directly to MongoDB

3. **Configure Production**
   - Set up production MongoDB
   - Configure environment variables
   - Set up domain/hosting
   - Enable HTTPS

4. **SEO Optimization**
   - Add Google Analytics
   - Submit sitemap
   - Set up Google Search Console

5. **Security**
   - Add authentication for admin routes
   - Set up rate limiting (already included)
   - Add input sanitization
   - Enable HTTPS

## Support

For issues or questions, check:
- `DESIGN_SYSTEM.md` - Design guidelines
- `SEO_STRATEGY.md` - SEO information
- `CONVERSION_STRATEGY.md` - Conversion tactics
- `MOBILE_FIRST.md` - Mobile design notes

