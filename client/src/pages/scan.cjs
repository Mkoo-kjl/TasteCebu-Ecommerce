const fs = require('fs');
const content = fs.readFileSync('c:/coding/Taste-Ecommerce/client/src/pages/AdminDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  const m = line.match(/[^\x00-\x7F]/g);
  if (m) {
    const chars = m.map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));
    console.log('Line ' + (i+1) + ': ' + chars.join(',') + ' => ' + line.trim().substring(0, 100));
  }
});
