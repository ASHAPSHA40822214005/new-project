const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || './data/codecraft.db';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log(`Connected to SQLite database at ${DB_PATH}`);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT,
      phone TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table initialized');
    }
  });
}

// Utility functions
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function validateSignupInput(email, username, firstName, password) {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Username validation: 3-20 chars, letters/numbers/underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!username || !usernameRegex.test(username)) {
    return { valid: false, error: 'Username must be 3-20 characters (letters, numbers, underscores only)' };
  }

  // First name validation
  if (!firstName || firstName.trim() === '') {
    return { valid: false, error: 'First name is required' };
  }

  // Password validation: minimum 8 characters
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  return { valid: true };
}


// API Routes

// POST /api/auth/signup - Create new account
app.post('/api/auth/signup', async (req, res) => {
  const { email, username, firstName, lastName, password } = req.body;

  // Validation
  const validation = validateSignupInput(email, username, firstName, password);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into database
    db.run(
      `INSERT INTO users (email, username, firstName, lastName, passwordHash)
       VALUES (?, ?, ?, ?, ?)`,
      [email, username, firstName, lastName || '', passwordHash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            if (err.message.includes('email')) {
              return res.status(400).json({ success: false, error: 'This email is already registered' });
            } else if (err.message.includes('username')) {
              return res.status(400).json({ success: false, error: 'Username already taken' });
            }
          }
          console.error('Insert error:', err);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

        const token = generateToken();
        res.json({
          success: true,
          message: 'Account created successfully',
          userId: this.lastID,
          token,
          user: { email, username, firstName, lastName }
        });
      }
    );
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/login - Log in existing user
app.post('/api/auth/login', async (req, res) => {
  const { email, username, password } = req.body;

  if (!password) {
    return res.status(400).json({ success: false, error: 'Password required' });
  }
  if (!email && !username) {
    return res.status(400).json({ success: false, error: 'Email or username required' });
  }

  const query = email ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE username = ?';
  const queryParam = email || username;

  db.get(query, [queryParam], async (err, user) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    try {
      // Compare password hash
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = generateToken();
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });
});

// POST /api/auth/google - Mock Google OAuth
app.post('/api/auth/google', async (req, res) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  // Check if user exists
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).json({ success: false, error: 'Server error' });
    }

    if (user) {
      // User exists, log them in
      const token = generateToken();
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName
        }
      });
    }

    // Create new user from Google auth
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 5);
    const firstName = email.split('@')[0];
    
    try {
      const passwordHash = await bcrypt.hash(Math.random().toString(), 10);

      db.run(
        `INSERT INTO users (email, username, firstName, lastName, phone, passwordHash)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, username, firstName, '', 'Not provided', passwordHash],
        function(err) {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ success: false, error: 'Server error' });
          }

          const token = generateToken();
          res.json({
            success: true,
            message: 'Account created successfully',
            userId: this.lastID,
            token,
            user: { email, username, firstName }
          });
        }
      );
    } catch (err) {
      console.error('Google auth error:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });
});

// GET /api/user/profile - Get user profile (requires token)
app.get('/api/user/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  // For demo purposes, token is valid if it exists
  // In production, you'd verify the token signature
  res.json({ success: true, message: 'Profile retrieved' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Codecraft backend running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err);
    }
    console.log('Database closed');
    process.exit(0);
  });
});
