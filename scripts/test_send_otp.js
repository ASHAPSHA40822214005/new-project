(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'phone', contact: '+919443264845' })
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
})();
