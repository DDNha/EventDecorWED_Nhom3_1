const fs = require('fs');

// Sửa file js
for (const f of ['js/admin_routes.js', 'js/checkout_routes.js']) {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/(JOIN\s+)services(\s+s\b)/g, '$1products$2');
  fs.writeFileSync(f, s);
}

// Sửa file sql
let q = fs.readFileSync('database/admin_seed.sql', 'utf8');
q = q.replace(/(FROM\s+)services\b/g, '$1products');
fs.writeFileSync('database/admin_seed.sql', q);

console.log('xong');
