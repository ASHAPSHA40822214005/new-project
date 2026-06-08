const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/codecraft.db');

db.all('SELECT id, contact, contactType, code, verified, createdAt, expiresAt FROM otps ORDER BY createdAt DESC LIMIT 10', (err, rows) => {
  if (err) {
    console.error('DB error:', err);
    process.exit(1);
  }
  console.log('Recent otps:', rows);
  db.close();
});
