require('dotenv').config();
const https = require('https');
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('Missing TELEGRAM_BOT_TOKEN'); process.exit(1); }
https.get(`https://api.telegram.org/bot${token}/getMe`, (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => { console.log(data); });
}).on('error', (e) => { console.error(e); process.exit(1); });
