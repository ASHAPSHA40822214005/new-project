const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
require('dotenv').config();
const path = require('path');

const EMAIL_OTP_EXPIRY_MINUTES = parseInt(process.env.EMAIL_OTP_EXPIRY_MINUTES, 10) || 10;
let nodemailer;
if (process.env.SMTP_HOST) {
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    console.warn('SMTP configured but nodemailer is not installed. OTP will be logged to the console instead.');
  }
}

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
      email TEXT UNIQUE,
      username TEXT UNIQUE NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT,
      phone TEXT,
      passwordHash TEXT NOT NULL,
      emailVerified INTEGER DEFAULT 0,
      phoneVerified INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table initialized');
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (!err && rows) {
          const columns = rows.map((col) => col.name);
          if (!columns.includes('phone')) {
            db.run('ALTER TABLE users ADD COLUMN phone TEXT', (alterErr) => {
              if (alterErr) console.error('Error adding phone column:', alterErr);
            });
          }
          if (!columns.includes('emailVerified')) {
            db.run('ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0', (alterErr) => {
              if (alterErr) console.error('Error adding emailVerified column:', alterErr);
            });
          }
          if (!columns.includes('phoneVerified')) {
            db.run('ALTER TABLE users ADD COLUMN phoneVerified INTEGER DEFAULT 0', (alterErr) => {
              if (alterErr) console.error('Error adding phoneVerified column:', alterErr);
            });
          }
        }
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact TEXT NOT NULL,
      contactType TEXT NOT NULL,
      code TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating otps table:', err);
    } else {
      console.log('OTP table initialized');
    }
  });
}

// Utility functions
function generateToken() {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}

function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}

function sendOtpContact(type, contact, code) {
  if (type === 'email') {
    if (nodemailer) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: contact,
        subject: 'Your Codecraft verification code',
        text: `Your verification code is ${code}. It expires in ${EMAIL_OTP_EXPIRY_MINUTES} minutes.`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Email send error:', err);
        } else {
          console.log('OTP email sent:', info.response);
        }
      });
    } else {
      console.log(`OTP email for ${contact}: ${code}`);
    }
  } else {
    console.log(`SMS OTP for ${contact}: ${code}`);
  }
}

function validateSignupInput(contactType, contact, username, firstName, password) {
  if (!contact) {
    return { valid: false, error: contactType === 'phone' ? 'Phone number is required' : 'Email is required' };
  }
  if (contactType === 'email') {
    if (!validateEmail(contact)) {
      return { valid: false, error: 'Invalid email format' };
    }
  } else {
    if (!validatePhone(contact)) {
      return { valid: false, error: 'Invalid phone number' };
    }
  }

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!username || !usernameRegex.test(username)) {
    return { valid: false, error: 'Username must be 3-20 characters (letters, numbers, underscores only)' };
  }

  if (!firstName || firstName.trim() === '') {
    return { valid: false, error: 'First name is required' };
  }

  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  return { valid: true };
}

// API Routes

// POST /api/auth/send-otp - Send OTP to email or phone for verification
app.post('/api/auth/send-otp', (req, res) => {
  console.log('/api/auth/send-otp body:', req.body);
  const { type, contact } = req.body;
  if (!type || !contact || (type !== 'email' && type !== 'phone')) {
    return res.status(400).json({ success: false, error: 'Invalid contact type or value' });
  }

  if (type === 'email' && !validateEmail(contact)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }
  if (type === 'phone' && !validatePhone(contact)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  db.run(
    `INSERT INTO otps (contact, contactType, code, expiresAt) VALUES (?, ?, ?, ?)`,
    [contact, type, code, expiresAt],
    function(err) {
      if (err) {
        console.error('OTP insert error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
      }

      sendOtpContact(type, contact, code);
      res.json({ success: true, message: 'OTP sent' });
    }
  );
});

// POST /api/auth/verify-otp - Verify OTP code for email or phone
app.post('/api/auth/verify-otp', (req, res) => {
  const { type, contact, code } = req.body;
  if (!type || !contact || !code || (type !== 'email' && type !== 'phone') || !/^[0-9]{6}$/.test(code)) {
    return res.status(400).json({ success: false, error: 'Invalid contact or OTP code' });
  }

  if (type === 'email' && !validateEmail(contact)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }
  if (type === 'phone' && !validatePhone(contact)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }

  const now = new Date().toISOString();
  db.get(
    `SELECT * FROM otps WHERE contact = ? AND contactType = ? AND code = ? AND expiresAt > ? ORDER BY createdAt DESC LIMIT 1`,
    [contact, type, code, now],
    (err, row) => {
      if (err) {
        console.error('OTP query error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
      }

      if (!row) {
        return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
      }

      db.run(`UPDATE otps SET verified = 1 WHERE id = ?`, [row.id], function(updateErr) {
        if (updateErr) {
          console.error('OTP update error:', updateErr);
          return res.status(500).json({ success: false, error: 'Server error' });
        }

        res.json({ success: true, message: 'Contact verified' });
      });
    }
  );
});

// POST /api/auth/signup - Create new account
app.post('/api/auth/signup', async (req, res) => {
  const { contactType, contact, username, firstName, lastName, password } = req.body;

  const validation = validateSignupInput(contactType, contact, username, firstName, password);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  try {
    db.get(
      `SELECT id FROM otps WHERE contact = ? AND contactType = ? AND verified = 1 ORDER BY createdAt DESC LIMIT 1`,
      [contact, contactType],
      async (otpErr, otpRow) => {
        if (otpErr) {
          console.error('OTP validation query error:', otpErr);
          return res.status(500).json({ success: false, error: 'Server error' });
        }

        if (!otpRow) {
          return res.status(400).json({ success: false, error: 'Please verify your email or phone with OTP before signing up' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userEmail = contactType === 'email' ? contact : '';
        const userPhone = contactType === 'phone' ? contact : 'Not provided';

        db.run(
          `INSERT INTO users (email, username, firstName, lastName, phone, passwordHash, emailVerified) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userEmail, username, firstName, lastName || '', userPhone, passwordHash, contactType === 'email' ? 1 : 0],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                if (err.message.includes('username')) {
                  return res.status(400).json({ success: false, error: 'Username already taken' });
                }
                if (err.message.includes('email')) {
                  return res.status(400).json({ success: false, error: 'This email is already registered' });
                }
                if (err.message.includes('phone')) {
                  return res.status(400).json({ success: false, error: 'This phone number is already registered' });
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
              user: { email: userEmail, phone: userPhone, username, firstName, lastName }
            });
          }
        );
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
