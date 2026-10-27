const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql2/promise");
const serviceRoutes = require("./js/service_routes");
const SERVICES = [];
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware đọc dữ liệu từ Form POST và JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình Express Session
app.use(session({
  secret: 'chuoi_bi_mat_rat_an_toan',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // Phiên tồn tại trong 1 ngày
}));

// Phục vụ file tĩnh từ các thư mục css, img, js và public
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình Nunjucks Template Engine cho thư mục views/
const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true // Đặt false khi deploy production
});
app.set('view engine', 'html');
env.addFilter('vnd', (n) => Number(n).toLocaleString('vi-VN'));

// Kết nối SQL (Pool)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Điền mật khẩu MySQL của bạn nếu có
  database: 'node_auth_demo', // Tên database của bạn
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    await pool.getConnection();
    console.log('Kết nối MySQL thành công!');
  } catch (error) {
    console.error('Lỗi kết nối MySQL:', error);
  }
}

testConnection().then();
// Nạp dịch vụ từ database vào bộ nhớ
async function loadServices() {
  const [rows] = await pool.query(`
    SELECT s.*, p.name AS partner
    FROM services s
    LEFT JOIN partners p ON p.id = s.partner_id
    ORDER BY s.id
  `);

  const list = rows.map((r) => ({
    id: r.id,
    title: r.title,
    name: r.title,
    image: r.image,
    rating: Number(r.rating),
    reviews: r.reviews,
    price: r.price,
    category: r.category,
    short: r.short_desc,
    duration: r.duration,
    area: r.area,
    partner: r.partner,
    partner_id: r.partner_id,
    includes: String(r.includes || '').split('\n').filter(Boolean),
    description: r.description
  }));

  // Cập nhật tại chỗ để cả app.js và service_routes.js cùng thấy dữ liệu mới
  SERVICES.length = 0;
  SERVICES.push(...list);
  serviceRoutes.SERVICES.length = 0;
  serviceRoutes.SERVICES.push(...list);
}

// Middleware kiểm tra xem người dùng đã đăng nhập chưa
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(401).json({ error: "login_required" });
  }
  res.redirect("/login");
}

// ================= ---------------- ROUTES ---------------- =================

// Trang chủ
app.get('/', async (req, res) => {
  try {
    const [partners] = await pool.query('SELECT * FROM partners');
    console.log('Số đối tác lấy được:', partners.length, partners);
    res.render('index.html', {
      services: SERVICES.slice(0, 6),   // chỉ 6 dịch vụ nổi bật
      part: partners,
      user: req.session.user || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi truy vấn database");
  }
});

// Giới thiệu
app.get('/about', (req, res) => {
  res.render('aboutus.html', { user: req.session.user || null });
});

// Dịch vụ
app.get('/services', (req, res) => {
  res.render('eventservices.html', {
    services: SERVICES,
    user: req.session.user || null
  });
});

// Đối tác
app.get('/partner', async (req, res) => {
  try {
    const [partners] = await pool.query('SELECT * FROM partners');
    res.render('partner.html', {          // đổi từ partner_list.html
      part: partners,
      user: req.session.user || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi truy vấn database");
  }
});

// Chi tiết đối tác: /partner/:id
app.get('/partner/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM partners WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).send('Không tìm thấy đối tác.');
    }

    const partner = rows[0];

    // Lấy các dịch vụ thuộc đối tác này
    const services = SERVICES.filter(
      (s) => s.partner_id === partner.id || s.partner === partner.name
    );

    res.render('partner_detail.html', {
      partner,
      services,
      user: req.session.user || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi truy vấn database");
  }
});

// Liên hệ (GET & POST)
app.get('/contact', (req, res) => {
  res.render('contact.html', { user: req.session.user || null });
});

app.post('/contact', (req, res) => {
  const { name, phone, email, message } = req.body;
  console.log('Thông tin liên hệ:', { name, phone, email, message });
  res.redirect('/contact');
});

// Đăng ký (GET & POST)
app.get('/register', (req, res) => {
  res.render('register.html');
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  console.log('Thông tin đăng ký:', { name, email });
  // Sau này bạn có thể viết thêm câu lệnh INSERT vào database ở đây
  res.redirect('/login');
});

// Đăng nhập (GET & POST)
app.get('/login', (req, res) => {
  res.render('login.html'); // Hoặc loggin.html tùy theo tên file view của bạn
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Truy vấn kiểm tra user trong database
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length > 0) {
      // Đăng nhập thành công, lưu thông tin vào session
      req.session.user = { id: rows[0].id, username: rows[0].username };
      return res.redirect('/');
    } else {
      // Sai tài khoản hoặc mật khẩu
      return res.send(`<script>alert('Sai email hoặc mật khẩu.'); window.location.href='/login';</script>`);
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).send('Lỗi hệ thống server.');
  }
});

// Đăng xuất
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Lỗi khi hủy session:', err);
    }
    res.redirect('/');
  });
});

// API lấy thông tin user đang đăng nhập
app.get('/api/current-user', isAuthenticated, (req, res) => {
  res.json({ username: req.session.user.username });
});


// ======================================================
// ===           QUẢN LÝ GIỎ HÀNG                     ===
// ======================================================

function findProduct(productId) {
  return SERVICES.find(p => p.id === parseInt(productId));
}

app.get('/cart', isAuthenticated, (req, res) => {
  const cart = req.session.cart || [];
  res.render('cart.html', { cart, user: req.session.user });
});

app.post('/cart/add', isAuthenticated, (req, res) => {
  const { product_id } = req.body;
  const product = findProduct(product_id);

  if (!product) {
    return res.status(404).send('Không tìm thấy sản phẩm.');
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existing = req.session.cart.find(item => item.product_id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    req.session.cart.push({
      product_id: product.id,
      name:       product.name,
      price:      product.price,
      img:        product.image,
      qty:        1
    });
  }

  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    const count = req.session.cart.reduce((sum, item) => sum + item.qty, 0);
    return res.json({ success: true, count });
  }
  res.redirect("/cart");
});

app.post('/cart/update', isAuthenticated, (req, res) => {
  const { product_id, action } = req.body;

  if (!req.session.cart) {
    return res.redirect('/cart');
  }

  const item = req.session.cart.find(i => i.product_id === parseInt(product_id));
  if (item) {
    if (action === 'plus') {
      item.qty += 1;
    } else if (action === 'minus' && item.qty > 1) {
      item.qty -= 1;
    }
  }

  res.redirect('/cart');
});

app.post('/cart/remove', isAuthenticated, (req, res) => {
  const { product_id } = req.body;

  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(
      item => item.product_id !== parseInt(product_id)
    );
  }

  res.redirect('/cart');
});

app.post('/cart/clear', isAuthenticated, (req, res) => {
  req.session.cart = [];
  res.redirect('/cart');
});

app.get('/api/cart-count', isAuthenticated, (req, res) => {
  const cart = req.session.cart || [];
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  res.json({ count });
});

// ======================================================

// Chi tiết dịch vụ: /services/:id
app.use("/", serviceRoutes);

// Đặt dịch vụ, thanh toán, lịch sử đơn hàng: /booking/:id, /orders
const bookingRoutes = require('./js/booking_routes');
app.use('/', bookingRoutes);

loadServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server đang chạy thành công tại: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không nạp được dịch vụ từ database:', err);
  });
