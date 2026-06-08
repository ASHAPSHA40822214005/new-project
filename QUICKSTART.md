# 🚀 Codecraft Quick Start Guide

## What's New

✅ **Dedicated Signup Page** (`/auth/signup.html`)
- Separate from login with extended form fields
- Required fields: Email, Phone, First Name, Username, Password
- Optional fields: Last Name
- Google sign-up button below the form

✅ **Updated Login Page** (`/auth/login.html`)
- Clean login-only interface
- Link to new signup page
- Google sign-in button

✅ **Full-Stack Backend**
- Node.js/Express server on port 3001
- SQLite database for persistent user storage
- Bcrypt password hashing (production-ready)
- API endpoints for signup, login, and Google OAuth mock

✅ **Backend-Connected Frontend** (`/auth/auth.js`)
- Replaced localStorage-only auth with real API calls
- Makes HTTP requests to backend
- Stores tokens and user info in localStorage

## Quick Start (5 minutes)

### Step 1: Install Dependencies
Open terminal in project root and run:
```bash
npm install
```

This installs: express, cors, sqlite3, bcrypt, dotenv

⏱️ **Takes ~2-3 minutes on first run**

### Step 2: Start Backend Server
In the same terminal:
```bash
npm start
```

You should see:
```
Codecraft backend running on http://localhost:3001
Database: ./data/codecraft.db
Users table initialized
```

✅ **Backend is running!**

### Step 3: Test the Frontend
1. Open `index.html` in your browser (or run via VS Code Live Server)
2. Click "Sign up" button → opens `/auth/signup.html`
3. Fill in all required fields and click "Create account"
4. You should see green "✓ Account created! Redirecting..." message
5. Get redirected to homepage with "✓ Signed in as [username]" banner

### Step 4: Test Login
1. From homepage, click "Log in" → opens `/auth/login.html`
2. Enter your username (or email) and password
3. Click "Log in"
4. Redirected to homepage with signed-in banner

### Step 5: Test Google OAuth (Mock)
1. From either page, click "Sign in/up with Google"
2. Enter your email address in the prompt
3. First time: Creates new account
4. Second time: Logs you in to existing account

## File Structure

```
new-project/
├── index.html              # Homepage (updated with signup link)
├── styles.css              # Design system
├── auth/
│   ├── signup.html         # NEW: Dedicated signup page
│   ├── login.html          # UPDATED: Login-only page
│   └── auth.js             # UPDATED: Backend API integration
├── tracks/
│   ├── index.html          # Language tracks listing
│   └── [language]/         # Individual track pages
├── server.js               # NEW: Express backend
├── package.json            # NEW: Node.js dependencies
├── .env                    # NEW: Environment config
├── BACKEND_SETUP.md        # Detailed backend documentation
└── data/
    └── codecraft.db        # SQLite database (auto-created)
```

## Database

Users are stored in SQLite database with:
- Email (unique)
- Username (unique)
- First Name (required)
- Last Name (optional)
- Phone Number (required)
- Password (hashed with bcrypt)
- Created timestamp

**Location:** `./data/codecraft.db`
**Auto-created** on first backend run

## API Endpoints

### POST `/api/auth/signup`
Create account with email, username, firstName, lastName, phone, password

### POST `/api/auth/login`
Login with email OR username + password

### POST `/api/auth/google`
Mock Google OAuth (email-based)

### GET `/api/user/profile`
Get profile data (requires auth token)

### GET `/api/health`
Server status check

*See BACKEND_SETUP.md for detailed API documentation*

## Troubleshooting

### "Network error" on signup/login?
✅ Make sure backend is running: `npm start`
✅ Check backend is on http://localhost:3001

### "Port 3001 already in use"?
Change PORT in `.env` file to an unused port

### Database locked error?
Ensure only one server instance is running

### Passwords not working?
Make sure npm packages are installed: `npm install`

## Next Steps

After testing:
1. Add password reset functionality
2. Add email verification
3. Add profile update page
4. Implement real Google OAuth
5. Deploy to production (update API_URL in auth.js)

## Architecture

```
Frontend (HTML/CSS/JS)
        ↓
   fetch() → HTTP
        ↓
Express Server (3001)
        ↓
  Database (SQLite)
        ↓
   Users Table
```

**Frontend URL:** `file:///` or `http://localhost:5500` (Live Server)
**Backend URL:** `http://localhost:3001`
**CORS:** Enabled (allow all origins)

## Security Notes

✅ Passwords hashed with bcrypt (production-ready)
⚠️ CORS allows all origins (update for production)
⚠️ Tokens are simple strings (implement JWT for production)
⚠️ No HTTPS (use in production)
⚠️ No rate limiting (add for production)

## Keep Backend Running

While developing, keep terminal with `npm start` running in the background. Stop with `Ctrl+C` when done.

---

**Questions?** Check BACKEND_SETUP.md for detailed documentation.
