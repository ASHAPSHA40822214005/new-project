# Codecraft - Online Learning Platform

An Exercism-like learning platform for practicing coding across multiple programming languages.

## 🎯 Features

- **Language Tracks**: Browse 6+ programming languages (Python, JavaScript, Java, C++, C, PHP)
- **User Accounts**: Sign up, login, and Google OAuth integration
- **Extended Profiles**: Capture email, phone, first name, last name
- **Secure Authentication**: Bcrypt password hashing, token-based auth
- **Persistent Storage**: SQLite database for user data
- **Responsive Design**: Mobile-friendly interface with modern styling

## 🚀 Quick Start

See **[QUICKSTART.md](./QUICKSTART.md)** for step-by-step setup (5 minutes).

### TL;DR
```bash
# Install dependencies
npm install

# Start backend server
npm start

# Open in browser
# Windows: start index.html
# Mac: open index.html
# Linux: xdg-open index.html
```

Backend runs on `http://localhost:3001`

## 📁 Project Structure

```
codecraft/
├── index.html              # Homepage
├── styles.css              # Design system & component styles
├── router.js               # Client-side routing
├── auth/                   # Authentication system
│   ├── login.html          # Login page
│   ├── signup.html         # Signup page with extended profile
│   └── auth.js             # Backend API integration
├── tracks/                 # Language tracks
│   ├── index.html          # All tracks listing
│   ├── python/
│   ├── javascript/
│   ├── java/
│   ├── cpp/
│   ├── c/
│   └── php/
├── server.js               # Express.js backend
├── package.json            # Node.js dependencies
├── .env                    # Environment configuration
├── data/                   # Database directory
│   └── codecraft.db        # SQLite database
├── QUICKSTART.md           # Getting started guide
└── BACKEND_SETUP.md        # Detailed backend documentation
```

## 🔑 Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Homepage | `/index.html` | Landing page with track preview |
| Tracks | `/tracks/index.html` | Browse all language tracks |
| Login | `/auth/login.html` | User login |
| Signup | `/auth/signup.html` | Create new account |
| Python | `/tracks/python/index.html` | Python track details |

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Responsive grid layouts
- Design tokens (colors, spacing, typography)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Auth**: Bcrypt (password hashing)
- **CORS**: Enabled for frontend

### Dependencies
```json
{
  "express": "^4.18.2",
  "sqlite3": "^5.1.6",
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

## 📚 Authentication Flow

### Signup
1. User fills form: Email, Phone, First Name, Last Name (opt), Username, Password
2. Frontend sends POST to `/api/auth/signup`
3. Backend hashes password with bcrypt
4. Creates user in SQLite database
5. Returns auth token
6. Frontend stores token in localStorage
7. User redirected to homepage

### Login
1. User enters Username/Email + Password
2. Frontend sends POST to `/api/auth/login`
3. Backend looks up user, compares password hash
4. Returns auth token on success
5. Frontend stores token and redirects

### Google OAuth (Mock)
1. User clicks "Sign in with Google"
2. Browser prompt for email
3. Backend checks if email exists
4. If new: Creates account with generated username
5. If exists: Logs in user
6. Returns token and redirects

## 🔒 Security

✅ **Passwords**: Hashed with bcrypt (10 rounds)
✅ **Database**: Unique constraints on email and username
✅ **CORS**: Configured to accept frontend requests
⚠️ **Tokens**: Simple strings (upgrade to JWT for production)
⚠️ **HTTPS**: Not enforced in development
⚠️ **Rate Limiting**: Not implemented

## 📝 API Endpoints

### POST `/api/auth/signup`
Create new account

**Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1 (555) 000-0000",
  "password": "securepass123"
}
```

### POST `/api/auth/login`
Login with credentials

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

### POST `/api/auth/google`
Mock Google OAuth

**Body:**
```json
{
  "email": "user@gmail.com"
}
```

### GET `/api/user/profile`
Get user profile (requires token)

**Headers:**
```
Authorization: Bearer <token>
```

### GET `/api/health`
Server status

See **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** for complete API documentation.

## 🎨 Design System

### Colors
- **Primary**: #2357d8 (Blue)
- **Accent**: #ff7a59 (Orange)
- **Background**: #fafbfd
- **Surface**: #ffffff
- **Muted**: #5f7183 (Gray)

### Components
- Language badges (hexagon shaped)
- Track cards with exercise counts
- Forms with validation
- Responsive grids (2-col, 3-col, 5-col)
- Topbar with navigation

## 🧪 Testing

### Manual Testing
1. Sign up with new email
2. Login with credentials
3. Try Google sign-in mock
4. Click track cards to navigate
5. Check localStorage for tokens

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{...}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## 🚢 Deployment

### Frontend
Deploy HTML/CSS/JS to static hosting:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

### Backend
Deploy Node.js app to:
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean

**Before deploying:**
1. Update `API_URL` in `auth/auth.js` to production backend URL
2. Change CORS origin from `*` to specific domain
3. Implement JWT tokens
4. Add email verification
5. Use environment variables for database path
6. Set up HTTPS/SSL

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Detailed backend documentation
- **[API Reference](./BACKEND_SETUP.md#api-endpoints)** - Complete API specs

## 🐛 Troubleshooting

**"Network error" on auth pages?**
- Backend not running. Run `npm start` first

**"Port 3001 already in use"?**
- Change PORT in `.env` to unused port

**Database locked?**
- Only one server instance can run at a time

**Token not working?**
- Clear localStorage and login again
- Check browser console for error messages

## 📝 Future Enhancements

- [ ] Real Google OAuth integration
- [ ] Email verification on signup
- [ ] Password reset flow
- [ ] User profile editing
- [ ] Exercise solutions tracking
- [ ] Progress dashboard
- [ ] Mentoring system
- [ ] Community forum
- [ ] Code snippet sharing

## 📄 License

MIT

---

**Ready to get started?** → See [QUICKSTART.md](./QUICKSTART.md)
