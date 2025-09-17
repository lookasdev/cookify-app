# Auth App

A minimal authentication application with FastAPI backend and React frontend.

## Features

- **Backend**: FastAPI + MongoDB Atlas + Motor (async) + JWT authentication
- **Frontend**: React + Vite + TypeScript with bottom navigation
- **Authentication**: Email/password registration and login with JWT tokens
- **Security**: Password hashing with bcrypt, JWT with HS256 algorithm
- **UI**: Mobile-first design with responsive bottom navigation

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

4. Update `.env` with your MongoDB Atlas URI and other settings:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB=auth_app
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_MIN=30
   CORS_ORIGIN=http://localhost:5173
   ```

5. Run the backend:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

4. Update `.env` with your backend URL:
   ```
   VITE_API_URL=http://localhost:8000
   ```

5. Run the frontend:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `GET /health` - Health check
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile (requires Bearer token)

## Project Structure

```
├── backend/
│   ├── main.py          # FastAPI application
│   ├── models.py        # Pydantic models
│   ├── auth.py          # Authentication utilities
│   ├── database.py      # MongoDB connection
│   ├── requirements.txt # Python dependencies
│   └── env.example      # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProfileCard.tsx
│   │   ├── App.tsx      # Main app component
│   │   ├── App.css      # Styles
│   │   ├── api.ts       # API client
│   │   └── main.tsx     # Entry point
│   ├── package.json
│   └── env.example
└── README.md
```

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 30 minutes (configurable)
- CORS is configured for the frontend origin
- MongoDB has a unique index on email field

## TODOs

- [ ] Implement refresh tokens for better security
- [ ] Consider using httpOnly cookies instead of localStorage
- [ ] Add password strength validation
- [ ] Add email verification
- [ ] Add password reset functionality
