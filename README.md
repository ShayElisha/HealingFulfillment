# Healing Fulfillment - Therapist Website

Production-ready website for a therapist specializing in anxiety, trauma, emotional release, and self-fulfillment.

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Language**: Hebrew (RTL)

## Setup

```bash
# Install all dependencies
npm run install:all

# Start development servers (frontend + backend)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories.

### Backend `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healing-fulfillment
NODE_ENV=development
```

### Frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## Project Structure

```
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
└── README.md
```

