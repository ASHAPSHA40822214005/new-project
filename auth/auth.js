const API_URL = 'http://localhost:3001/api';

// Validation regexes and rules
const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: {
    minLength: 8,
    hasUppercase: /[A-Z]/,
    hasLowercase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[!@#$%^&*]/
  }
};

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

function hideMessage(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.style.display = 'none';
  }
}

let contactVerified = false;
let currentOtpContact = '';
let currentContactType = 'email';

function getSelectedContactType() {
  const emailRadio = document.getElementById('contact-method-email');
  return emailRadio?.checked ? 'email' : 'phone';
}

function getContactValue() {
  const type = getSelectedContactType();
  return type === 'phone'
    ? `${document.getElementById('phone-code')?.value || ''}${document.getElementById('phone-number')?.value || ''}`.trim()
    : document.getElementById('email')?.value.trim();
}

function setContactVerificationState(isVerified) {
  contactVerified = isVerified;
  const contactValid = document.getElementById('contact-valid');
  const otpSuccess = document.getElementById('otp-success');
  if (contactValid) {
    contactValid.style.display = isVerified ? 'block' : 'none';
  }
  if (otpSuccess) {
    otpSuccess.style.display = isVerified ? 'block' : 'none';
  }
}

function setOtpPanelVisible(show) {
  const otpActions = document.getElementById('otp-actions');
  const otpPanel = document.getElementById('otp-panel');
  if (otpActions) otpActions.style.display = show ? 'flex' : 'none';
  if (!show && otpPanel) otpPanel.style.display = 'none';
}

function resetOtpState() {
  currentOtpContact = '';
  currentContactType = getSelectedContactType();
  setContactVerificationState(false);
  hideMessage('contact-error');
  hideMessage('otp-error');
  hideMessage('otp-success');
  hideMessage('otp-sent-msg');
  const otpPanel = document.getElementById('otp-panel');
  if (otpPanel) otpPanel.style.display = 'none';
}

function setInputValidationState(input, valid) {
  if (!input) return;
  if (valid) {
    input.classList.add('valid-input');
  } else {
    input.classList.remove('valid-input');
  }
}

function validatePhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}

function validateContact(contact, type) {
  if (!contact) {
    return { valid: false, error: type === 'phone' ? 'Phone number is required' : 'Email is required' };
  }
  if (type === 'email') {
    return validateEmail(contact);
  }
  if (!validatePhoneNumber(contact)) {
    return { valid: false, error: 'Enter a valid phone number' };
  }
  return { valid: true };
}

// Generate username suggestions from email
function generateUsernameSuggestions(email) {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const suggestions = [];
  
  // Suggestion 1: base name only
  if (base.length >= 3 && base.length <= 20) {
    suggestions.push(base);
  }
  
  // Suggestion 2: base + random 2 digits
  suggestions.push(base.slice(0, 15) + Math.floor(Math.random() * 99).toString().padStart(2, '0'));
  
  // Suggestion 3: base + underscore + random
  if (base.length <= 15) {
    suggestions.push(base + '_' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'));
  }
  
  // Suggestion 4: base + short random string
  const randomStr = Math.random().toString(36).substring(2, 6);
  suggestions.push((base + randomStr).slice(0, 20));
  
  // Suggestion 5: base + another variation
  suggestions.push(base.slice(0, 10) + Math.floor(Math.random() * 9).toString() + '_dev');
  
  // Filter valid suggestions and remove duplicates
  return [...new Set(
    suggestions.filter(s => 
      s.length >= 3 && 
      s.length <= 20 && 
      /^[a-zA-Z0-9_]+$/.test(s)
    )
  )].slice(0, 4); // Return max 4 suggestions
}

// Display username suggestions
function showUsernameSuggestions(suggestions) {
  const container = document.getElementById('username-suggestions');
  const grid = document.getElementById('suggestions-grid');
  
  if (suggestions.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  grid.innerHTML = suggestions.map(s => 
    `<button type="button" class="suggestion-btn" style="padding:6px 10px;background:#fff;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;" onclick="selectUsername('${s}')">
      ${s}
    </button>`
  ).join('');
  
  container.style.display = 'block';
}

function selectUsername(username) {
  const input = document.getElementById('username');
  input.value = username;
  input.focus();
  
  // Validate immediately
  const result = validateUsername(username);
  if (!result.valid) {
    showMessage('username-error', result.error, true);
    hideMessage('username-valid');
  } else {
    hideMessage('username-error');
    showMessage('username-valid', '✓ Username available', false);
  }
}

function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  if (!VALIDATION.email.test(email)) {
    return { valid: false, error: 'Invalid email format (e.g., user@example.com)' };
  }
  return { valid: true };
}

function validateUsername(username) {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }
  if (!VALIDATION.username.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

function getPasswordCriteria(password) {
  const length = password.length >= VALIDATION.password.minLength;
  const lower = VALIDATION.password.hasLowercase.test(password);
  const upper = VALIDATION.password.hasUppercase.test(password);
  const number = VALIDATION.password.hasNumber.test(password);
  const special = VALIDATION.password.hasSpecial.test(password);
  return {
    length,
    lower,
    upper,
    number,
    special,
    allValid: length && lower && upper && number && special
  };
}

function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required', strength: 0 };
  }
  
  let strength = 0;
  let errors = [];
  
  const criteria = getPasswordCriteria(password);
  
  if (!criteria.length) {
    errors.push(`at least ${VALIDATION.password.minLength} characters`);
  } else {
    strength += 20;
  }
  
  if (!criteria.upper) {
    errors.push('one uppercase letter');
  } else {
    strength += 20;
  }
  
  if (!criteria.lower) {
    errors.push('one lowercase letter');
  } else {
    strength += 20;
  }
  
  if (!criteria.number) {
    errors.push('one number');
  } else {
    strength += 20;
  }
  
  if (!criteria.special) {
    errors.push('one special character');
  } else {
    strength += 20;
  }
  
  if (errors.length > 0) {
    const errorText = errors.join(', ');
    return { valid: false, error: `Add: ${errorText}`, strength };
  }
  
  return { valid: true, strength: 100 };
}

function validateFirstName(firstName) {
  if (!firstName || firstName.trim() === '') {
    return { valid: false, error: 'First name is required' };
  }
  return { valid: true };
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

  // Setup signup form validation
  setupSignupValidation();

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
      hideMessage('signup-msg');
      hideMessage('email-error');
      hideMessage('username-error');
      hideMessage('username-valid');
      hideMessage('password-error');
      hideMessage('password-strength');
      hideMessage('first-name-error');
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

// Setup real-time validation for signup form
function setupSignupValidation() {
  const emailInput = document.getElementById('email');
  const phoneNumberInput = document.getElementById('phone-number');
  const phoneCodeSelect = document.getElementById('phone-code');
  const contactEmailRow = document.getElementById('contact-email-row');
  const contactPhoneRow = document.getElementById('contact-phone-row');
  const contactMethodEmail = document.getElementById('contact-method-email');
  const contactMethodPhone = document.getElementById('contact-method-phone');

  function updateContactMode() {
    const type = getSelectedContactType();
    currentContactType = type;
    if (type === 'email') {
      contactEmailRow.style.display = 'block';
      contactPhoneRow.style.display = 'none';
    } else {
      contactEmailRow.style.display = 'none';
      contactPhoneRow.style.display = 'block';
    }
    resetOtpState();
    hideMessage('contact-error');
    if (type === 'email') {
      setInputValidationState(emailInput, false);
    } else {
      setInputValidationState(phoneNumberInput, false);
    }
  }

  if (contactMethodEmail) contactMethodEmail.addEventListener('change', updateContactMode);
  if (contactMethodPhone) contactMethodPhone.addEventListener('change', updateContactMode);

  const contactInput = () => getSelectedContactType() === 'email' ? emailInput : phoneNumberInput;

  const validateContactInput = () => {
    const type = getSelectedContactType();
    const value = getContactValue();
    const result = validateContact(value, type);
    const contactErrorId = 'contact-error';
    if (!result.valid) {
      showMessage(contactErrorId, result.error, true);
      if (type === 'email') {
        setInputValidationState(emailInput, false);
      } else {
        setInputValidationState(phoneNumberInput, false);
      }
      setOtpPanelVisible(false);
      resetOtpState();
      return false;
    }
    hideMessage(contactErrorId);
    setInputValidationState(contactInput(), true);
    setOtpPanelVisible(true);
    return true;
  };

  if (emailInput) {
    emailInput.addEventListener('input', validateContactInput);
    emailInput.addEventListener('blur', validateContactInput);
  }
  if (phoneNumberInput) {
    phoneNumberInput.addEventListener('input', validateContactInput);
    phoneNumberInput.addEventListener('blur', validateContactInput);
    phoneCodeSelect?.addEventListener('change', validateContactInput);
  }

  // Username validation

  // Username validation
  const usernameInput = document.getElementById('username');
  if (usernameInput) {
    usernameInput.addEventListener('input', () => {
      const result = validateUsername(usernameInput.value);
      if (!result.valid) {
        showMessage('username-error', result.error, true);
        hideMessage('username-valid');
        setInputValidationState(usernameInput, false);
      } else {
        hideMessage('username-error');
        showMessage('username-valid', '✓ Username available', false);
        setInputValidationState(usernameInput, true);
      }
    });
    usernameInput.addEventListener('blur', () => {
      if (!usernameInput.value.trim()) {
        hideMessage('username-error');
        hideMessage('username-valid');
      }
    });
  }

  const editUsernameButton = document.getElementById('edit-username');
  if (editUsernameButton) {
    editUsernameButton.addEventListener('click', () => {
      const usernameInput = document.getElementById('username');
      if (usernameInput) {
        usernameInput.focus();
      }
    });
  }

  const sendOtpButton = document.getElementById('send-otp');
  const verifyOtpButton = document.getElementById('verify-otp');
  const otpCodeInput = document.getElementById('otp-code');
  const otpSentMsg = document.getElementById('otp-sent-msg');
  const contactError = 'contact-error';

  if (sendOtpButton && otpCodeInput) {
    sendOtpButton.addEventListener('click', async () => {
      const type = getSelectedContactType();
      const contact = getContactValue();
      const result = validateContact(contact, type);
      if (!contact || !result.valid) {
        showMessage(contactError, result.error, true);
        return;
      }
      hideMessage(contactError);
      hideMessage('otp-error');
      hideMessage('otp-success');
      if (otpSentMsg) {
        otpSentMsg.style.display = 'none';
      }

      try {
        const response = await fetch(`${API_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, contact })
        });
        const data = await response.json();
        if (data.success) {
          currentOtpContact = contact;
          currentContactType = type;
          if (otpSentMsg) {
            otpSentMsg.textContent = type === 'phone' ? 'OTP sent to your phone' : 'OTP sent to your email';
            otpSentMsg.style.display = 'inline-flex';
          }
          const otpPanel = document.getElementById('otp-panel');
          if (otpPanel) otpPanel.style.display = 'block';
        } else {
          showMessage('otp-error', data.error || 'Unable to send OTP', true);
        }
      } catch (err) {
        console.error('Send OTP error:', err);
        showMessage('otp-error', 'Network error sending OTP', true);
      }
    });
  }

  if (verifyOtpButton) {
    verifyOtpButton.addEventListener('click', async () => {
      const type = getSelectedContactType();
      const contact = getContactValue();
      const code = otpCodeInput?.value.trim();
      if (!contact || !code) {
        showMessage('otp-error', 'Enter the OTP code to verify', true);
        return;
      }
      hideMessage('otp-error');

      try {
        const response = await fetch(`${API_URL}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, contact, code })
        });
        const data = await response.json();
        if (data.success) {
          setContactVerificationState(true);
          showMessage('otp-success', '✓ OTP verified', false);
          if (otpSentMsg) otpSentMsg.style.display = 'none';
        } else {
          showMessage('otp-error', data.error || 'OTP verification failed', true);
          setContactVerificationState(false);
        }
      } catch (err) {
        console.error('Verify OTP error:', err);
        showMessage('otp-error', 'Network error verifying OTP', true);
        setContactVerificationState(false);
      }
    });
  }

  // Password strength indicator
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const result = validatePassword(passwordInput.value);
      const strengthEl = document.getElementById('password-strength');
      const strengthBar = document.getElementById('password-strength-bar');
      const strengthText = document.getElementById('password-strength-text');
      const criteria = getPasswordCriteria(passwordInput.value);
      const criteriaContainer = document.getElementById('password-criteria');
      const lengthItem = document.getElementById('password-criteria-length');
      const lowerItem = document.getElementById('password-criteria-lower');
      const upperItem = document.getElementById('password-criteria-upper');
      const numberItem = document.getElementById('password-criteria-number');
      const specialItem = document.getElementById('password-criteria-special');
      const verified = document.getElementById('password-verified');
      
      if (passwordInput.value) {
        criteriaContainer.style.display = 'block';
        strengthEl.style.display = 'block';
        strengthBar.style.width = result.strength + '%';
        setInputValidationState(passwordInput, criteria.allValid);
        
        // Update criteria icons
        lengthItem.firstElementChild.textContent = criteria.length ? '✓' : '✕';
        lengthItem.style.color = criteria.length ? '#228B22' : '#b22222';
        lowerItem.firstElementChild.textContent = criteria.lower ? '✓' : '✕';
        lowerItem.style.color = criteria.lower ? '#228B22' : '#b22222';
        upperItem.firstElementChild.textContent = criteria.upper ? '✓' : '✕';
        upperItem.style.color = criteria.upper ? '#228B22' : '#b22222';
        numberItem.firstElementChild.textContent = criteria.number ? '✓' : '✕';
        numberItem.style.color = criteria.number ? '#228B22' : '#b22222';
        specialItem.firstElementChild.textContent = criteria.special ? '✓' : '✕';
        specialItem.style.color = criteria.special ? '#228B22' : '#b22222';

        if (criteria.allValid) {
          strengthBar.style.background = '#228B22';
          strengthText.textContent = 'Strong ✓';
          strengthText.style.color = '#228B22';
          verified.style.display = 'block';
        } else if (result.strength < 25) {
          strengthBar.style.background = '#b22222';
          strengthText.textContent = 'Very weak';
          strengthText.style.color = '#b22222';
          verified.style.display = 'none';
        } else if (result.strength < 50) {
          strengthBar.style.background = '#ff7a59';
          strengthText.textContent = 'Weak';
          strengthText.style.color = '#ff7a59';
          verified.style.display = 'none';
        } else if (result.strength < 75) {
          strengthBar.style.background = '#ffc107';
          strengthText.textContent = 'Fair';
          strengthText.style.color = '#ffc107';
          verified.style.display = 'none';
        } else {
          strengthBar.style.background = '#66bb6a';
          strengthText.textContent = 'Good';
          strengthText.style.color = '#66bb6a';
          verified.style.display = 'none';
        }
        
        if (!result.valid && result.error) {
          showMessage('password-error', result.error, true);
        } else {
          hideMessage('password-error');
        }
      } else {
        criteriaContainer.style.display = 'none';
        strengthEl.style.display = 'none';
        hideMessage('password-error');
        verified.style.display = 'none';
        setInputValidationState(passwordInput, false);
      }
    });
  }

  // First name validation
  const firstNameInput = document.getElementById('first-name');
  if (firstNameInput) {
    firstNameInput.addEventListener('blur', () => {
      const result = validateFirstName(firstNameInput.value);
      if (!result.valid) {
        showMessage('first-name-error', result.error, true);
      } else {
        hideMessage('first-name-error');
      }
    });
  }


}

// Handle signup
async function handleSignup(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('first-name')?.value;
  const lastName = document.getElementById('last-name')?.value;
  const username = document.getElementById('username')?.value;
  const password = document.getElementById('password')?.value;
  const contactType = getSelectedContactType();
  const contact = getContactValue();

  // Validate all fields
  const firstNameVal = validateFirstName(firstName);
  const contactVal = validateContact(contact, contactType);
  const usernameVal = validateUsername(username);
  const passwordVal = validatePassword(password);

  // Show validation errors
  if (!firstNameVal.valid) {
    showMessage('first-name-error', firstNameVal.error, true);
    return;
  }
  if (!contactVal.valid) {
    showMessage('contact-error', contactVal.error, true);
    return;
  }
  if (!usernameVal.valid) {
    showMessage('username-error', usernameVal.error, true);
    return;
  }
  if (!passwordVal.valid) {
    showMessage('password-error', passwordVal.error, true);
    return;
  }
  if (!contactVerified) {
    showMessage('contact-error', 'Please verify your email or phone with OTP before signing up', true);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        password,
        contactType,
        contact
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
