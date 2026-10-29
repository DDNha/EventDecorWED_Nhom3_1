const path = require('path');
const nunjucks = require('nunjucks');

const env = nunjucks.configure(path.join(__dirname, '..', 'views'), {
  autoescape: true,
  noCache: true
});

const base = {
  admin: { id: 1, username: 'admin', full_name: 'Admin EventDecor' },
  active: 'dashboard',
  notice: '',
  stats: {},
  summary: {},
  filters: {},
  statuses: [],
  monthly: [],
  recentOrders: [],
  users: [],
  orders: [],
  partners: [],
  transactions: [],
  reports: []
};

for (const file of [
  'admin/dashboard.html',
  'admin/users.html',
  'admin/orders.html',
  'admin/finance.html',
  'admin/reports.html',
  'partner_order_new.html',
  'report.html'
]) {
  env.render(file, { ...base, user: base.admin, partner: null, success: '', error: null });
  console.log(`OK ${file}`);
}

