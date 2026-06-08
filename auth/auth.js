const API_URL = 'http://localhost:3001/api';

// Load token from localStorage
function getToken() {
  return localStorage.getItem('cf_token');
}

function setToken(token) {
  localStorage.setItem('cf_token', token);
}

function clearToken() {
  localStorage.removeItem('cf_token');
}

function setUser(user) {
  localStorage.setItem('cf_user', JSON.stringify(user));
}

function getUser() {
  const user = localStorage.getItem('cf_user');
  return user ? JSON.parse(user) : null;
}

// Display message
function showMessage(elementId, message, isError = true) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.color = isError ? '#b22222' : '#228B22';
    el.style.display = 'block';
  }
}

// Check if already logged in on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  const user = getUser();
  
  if (token && user) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      background: #228B22;
      color: white;
      padding: 12px;
      text-align: center;
      font-weight: 700;
      margin-bottom: 12px;
    `;
    banner.textContent = `✓ Signed in as ${user.username}`;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // Handle signup form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  // Handle signup clear button
  const signupClear = document.getElementById('signup-clear');
  if (signupClear) {
    signupClear.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.reset();
    });
  }

  // Handle login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Handle Google signin
  const googleSignin = document.getElementById('google-signin');
  if (googleSignin) {
    googleSignin.addEventListener('click', handleGoogleSignin);
  }

  // Handle Google signup
  const googleSignup = document.getElementById('google-signup');
  if (googleSignup) {
    googleSignup.addEventListener('click', handleGoogleSignup);
  }
});

// Handle signup
async function handleSignup(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('first-name')?.value;
  const lastName = document.getElementById('last-name')?.value;
  const email = document.getElementById('email')?.value;
  const phone = document.getElementById('phone')?.value;
  const username = document.getElementById('username')?.value;
  const password = document.getElementById('password')?.value;

  // Validation
  if (!firstName || !email || !phone || !username || !password) {
    showMessage('signup-msg', 'All required fields must be filled', true);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        username,
        password
      })
    });

    const data = await response.json();

    if (data.success) {
      showMessage('signup-msg', '✓ Account created! Redirecting...', false);
      setToken(data.token);
      setUser(data.user);
      setTimeout(() => window.location.href = '../index.html', 1500);
    } else {
      showMessage('signup-msg', data.error || 'Signup failed', true);
    }
  } catch (err) {
    console.error('Signup error:', err);
    showMessage('signup-msg', 'Network error. Make sure backend is running on http://localhost:3001', true);
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();

  const usernameOrEmail = document.getElementById('login-username')?.value;
  const password = document.getElementById('login-password')?.value;

  if (!usernameOrEmail || !password) {
    showMessage('login-msg', 'Username/email and password required', true);
    return;
  }

  try {
    // Determine if it's email or username
    const isEmail = usernameOrEmail.includes('@');
    const body = isEmail
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.success) {
      showMessage('login-msg', '✓ Login successful! Redirecting...', false);
      setToken(data.token);
      setUser(data.user);
      setTimeout(() => window.location.href = '../index.html', 1500);
    } else {
      showMessage('login-msg', data.error || 'Login failed', true);
    }
  } catch (err) {
    console.error('Login error:', err);
    showMessage('login-msg', 'Network error. Make sure backend is running on http://localhost:3001', true);
  }
}

// Handle Google signin
async function handleGoogleSignin(e) {
  e.preventDefault();
  
  const email = prompt('Enter your Google email:');
  if (!email) return;

  await handleGoogleAuth(email, 'login-msg');
}

// Handle Google signup
async function handleGoogleSignup(e) {
  e.preventDefault();
  
  const email = prompt('Enter your Google email:');
  if (!email) return;

  await handleGoogleAuth(email, 'signup-msg');
}

// Handle Google auth
async function handleGoogleAuth(email, messageElementId) {
  try {
    const response = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      showMessage(messageElementId, '✓ Redirecting...', false);
      setToken(data.token);
      setUser(data.user);
      setTimeout(() => window.location.href = '../index.html', 1500);
    } else {
      showMessage(messageElementId, data.error || 'Google auth failed', true);
    }
  } catch (err) {
    console.error('Google auth error:', err);
    showMessage(messageElementId, 'Network error. Make sure backend is running on http://localhost:3001', true);
  }
}
