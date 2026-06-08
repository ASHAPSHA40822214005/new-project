# Codecraft Backend Setup

## Installation

### 1. Install Node.js dependencies
```bash
npm install
```

This installs:
- **express**: Web server framework
- **cors**: Enable cross-origin requests
- **sqlite3**: Database
- **bcrypt**: Secure password hashing
- **dotenv**: Environment configuration

### 2. Start the backend server
```bash
npm start
```

Or for development:
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the port specified in `.env`)

### 3. Database

The SQLite database will be created automatically at `./data/codecraft.db` when the server starts.

**Users table schema:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT,
  phone TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1 (555) 000-0000",
  "password": "securepassword"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": 1,
  "token": "abc123xyz789",
  "user": {
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST `/api/auth/login`
Log in with username or email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
Or:
```json
{
  "username": "johndoe",
  "password": "securepassword"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "abc123xyz789",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST `/api/auth/google`
Mock Google OAuth authentication (creates account if doesn't exist).

**Request:**
```json
{
  "email": "user@gmail.com"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "abc123xyz789",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "username": "user123456",
    "firstName": "user"
  }
}
```

#### GET `/api/user/profile`
Get current user profile (requires auth token).

**Headers:**
```
Authorization: Bearer abc123xyz789
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved"
}
```

#### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Frontend Integration

The frontend (`auth/auth.js`) makes API calls to this backend at `http://localhost:3001/api`.

Make sure:
1. Backend is running on port 3001
2. Frontend can access `localhost:3001` (CORS is enabled)
3. Tokens are stored in `localStorage` as `cf_token`
4. User info is stored in `localStorage` as `cf_user`

## Security Notes

⚠️ **Production Readiness:**
- Passwords are hashed with bcrypt (10 rounds)
- CORS is configured to allow all origins (update in production)
- Token validation is simplified (implement JWT in production)
- No HTTPS requirement (use in production)
- No rate limiting (add in production)
- No email verification (add in production)

## Troubleshooting

**Port already in use:**
- Change `PORT` in `.env` file

**Database locked error:**
- Ensure only one instance of the server is running

**CORS errors:**
- Check that backend is running on `http://localhost:3001`
- Frontend URLs must match CORS whitelist

**Password hash mismatch:**
- Check that bcrypt version matches (5.1.1+)
