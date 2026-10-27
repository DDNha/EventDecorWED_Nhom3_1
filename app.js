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
app.use(
  "/admin-assets",
  express.static(path.join(__dirname, "views", "admin")),
);
// Cấu hình Express Session
app.use(
  session({
    secret: "chuoi_bi_mat_rat_an_toan",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Phiên tồn tại trong 1 ngày
  }),
);

// Phục vụ file tĩnh từ các thư mục css, img, js và public
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/admin-assets",
  express.static(path.join(__dirname, "views", "admin")),
);
// Cấu hình Nunjucks Template Engine cho thư mục views/
const env = nunjucks.configure("views", {
  autoescape: true,
  express: app,
  noCache: true, // Đặt false khi deploy production
});
app.set("view engine", "html");
env.addFilter("vnd", (n) => Number(n).toLocaleString("vi-VN"));

// Kết nối SQL (Pool)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Điền mật khẩu MySQL của bạn nếu có
  database: "event_decor", // Tên database của bạn
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    await pool.getConnection();
    console.log("Kết nối MySQL thành công!");
  } catch (error) {
    console.error("Lỗi kết nối MySQL:", error);
  }
}

testConnection().then();
// Nạp dịch vụ từ database vào bộ nhớ
async function loadServices() {
  const [rows] = await pool.query(`
    SELECT
      p.id,
      p.name AS title,
      p.img AS image,
      p.rating,
      p.reviewsCount AS reviews,
      p.price,
      p.description AS short_desc,
      p.executionTime AS duration,
      p.location AS area,
      p.partner_id,
      partner.name AS partner,
      p.description,
      (
        SELECT GROUP_CONCAT(pi.item_text ORDER BY pi.id SEPARATOR '\\n')
        FROM product_inclusions pi
        WHERE pi.product_id = p.id
      ) AS includes
    FROM products p
    LEFT JOIN partners partner ON partner.id = p.partner_id
    ORDER BY p.id
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
    includes: String(r.includes || "")
      .split("\n")
      .filter(Boolean),
    description: r.description,
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
app.get("/", async (req, res) => {
  try {
    const [partners] = await pool.query("SELECT * FROM partners");
    console.log("Số đối tác lấy được:", partners.length, partners);
    res.render("index.html", {
      services: SERVICES.slice(0, 6), // chỉ 6 dịch vụ nổi bật
      part: partners,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi truy vấn database");
  }
});

// Giới thiệu
app.get("/about", (req, res) => {
  res.render("aboutus.html", { user: req.session.user || null });
});
// Trang admin
app.get("/admin", (req, res) => {
  res.render("admin/dashboard.html");
});
app.get("/admin/manager-customer", (req, res) => {
  res.render("admin/manager-customer.html");
});
app.get("/admin/manager-partner", (req, res) => {
  res.render("admin/manager-partner.html");
});
app.get("/admin/approve-event", (req, res) => {
  res.render("admin/approve-event.html");
});
app.get("/admin/available-event", (req, res) => {
  res.render("admin/available-event.html");
});
app.get("/admin/orders", (req, res) => {
  res.render("admin/orders.html");
});
app.get("/admin/report-review", (req, res) => {
  res.render("admin/report-review.html");
});
app.get("/admin/financial-payout", (req, res) => {
  res.render("admin/financial-payout.html");
});
app.get("/partner/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).send("Không tìm thấy đối tác");
  }

  try {
    const sql = `
      SELECT p.name, p.image, p.description, p.address, p.phone, p.email,
             s.name AS specialty_name
      FROM partners p
      JOIN partner_specialties ps ON ps.partner_id = p.id
      JOIN specialties s ON s.id = ps.specialty_id
      WHERE p.id = ?`;
    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).send("Không tìm thấy đối tác");
    }
    const [other] = await pool.query(
      `SELECT id, name FROM partners where id <> ? limit 2`,
      [id],
    );
    return res.render("detailed-partner.html", {
      parts: rows[0],
      spec: rows.map((r) => r.specialty_name),
      other,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Lỗi truy vấn database");
  }
});
// Dịch vụ
app.get("/services", (req, res) => {
  res.render("eventservices.html", {
    services: SERVICES,
    user: req.session.user || null,
  });
});

// Đối tác
app.get("/partner", async (req, res) => {
  try {
    const [partners] = await pool.query("SELECT * FROM partners");
    res.render("partner.html", {
      // đổi từ partner_list.html
      part: partners,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi truy vấn database");
  }
});

// Chi tiết đối tác: /partner/:id
app.get("/partner/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM partners WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).send("Không tìm thấy đối tác.");
    }

    const partner = rows[0];

    // Lấy các dịch vụ thuộc đối tác này
    const services = SERVICES.filter(
      (s) => s.partner_id === partner.id || s.partner === partner.name,
    );

    res.render("partner_detail.html", {
      partner,
      services,
      user: req.session.user || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi truy vấn database");
  }
});

// Liên hệ (GET & POST)
app.get("/contact", (req, res) => {
  res.render("contact.html", { user: req.session.user || null });
});

app.post("/contact", (req, res) => {
  const { name, phone, email, message } = req.body;
  console.log("Thông tin liên hệ:", { name, phone, email, message });
  res.redirect("/contact");
});
const bcrypt = require("bcryptjs");

// Trang đăng ký
app.get("/register", (req, res) => {
  res.render("register.html", { user: req.session.user || null });
});

// Trang đăng nhập
app.get(["/loggin", "/login"], (req, res) => {
  res.render("loggin.html", { user: req.session.user || null });
});
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password.html");
});

/* ================= API ĐĂNG KÝ ================= */
app.post("/api/auth/register", async (req, res) => {
  const fullName = String(req.body.fullName || req.body.full_name || "").trim();
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");

  if (fullName.length < 2 || !email || password.length < 8) {
    return res.status(400).json({
      message: "Vui lòng nhập họ tên, email và mật khẩu ít nhất 8 ký tự.",
    });
  }

  try {
    // Kiểm tra email đã được sử dụng chưa
    const [existing] = await pool.execute(
      "SELECT id FROM `user` WHERE email = ? LIMIT 1",
      [email],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Email đã tồn tại!",
      });
    }

    // Nếu không nhập username, tạo username từ phần trước @ của email
    const finalUsername = username || email.split("@")[0];

    // Kiểm tra username trùng
    const [existingUsername] = await pool.execute(
      "SELECT id FROM `user` WHERE username = ? LIMIT 1",
      [finalUsername],
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        message: "Tên đăng nhập đã tồn tại!",
      });
    }

    // Mã hóa mật khẩu trước khi lưu
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO \`user\`
       (username, email, password, full_name, phone, role)
       VALUES (?, ?, ?, ?, ?, 'user')`,
      [finalUsername, email, passwordHash, fullName, phone || null],
    );

    return res.status(201).json({
      message: "Đăng ký thành công! Vui lòng đăng nhập.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email hoặc tên đăng nhập đã tồn tại!",
      });
    }

    return res.status(500).json({
      message: "Không thể đăng ký tài khoản.",
    });
  }
});

/* ================= API ĐĂNG NHẬP ================= */
app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({
      message: "Vui lòng nhập email và mật khẩu.",
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, username, email, password,
              full_name, phone, role
       FROM \`user\`
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    if (
      rows.length === 0 ||
      !(await bcrypt.compare(password, rows[0].password))
    ) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    const account = rows[0];

    // Tạo session đăng nhập, không lưu mật khẩu vào session
    req.session.user = {
      id: account.id,
      username: account.username,
      email: account.email,
      full_name: account.full_name,
      phone: account.phone,
      role: account.role,
    };

    return res.json({
      message: "Đăng nhập thành công!",
      redirect: "/",
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);

    return res.status(500).json({
      message: "Lỗi hệ thống khi đăng nhập.",
    });
  }
});

/* ================= API CẬP NHẬT THÔNG TIN ================= */
app.put("/api/auth/profile", isAuthenticated, async (req, res) => {
  const fullName = String(req.body.full_name || "").trim();
  const phone = String(req.body.phone || "").trim();
  const userId = req.session.user.id;

  if (fullName.length < 2) {
    return res.status(400).json({
      message: "Họ tên phải có ít nhất 2 ký tự.",
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE \`user\`
       SET full_name = ?, phone = ?
       WHERE id = ?`,
      [fullName, phone || null, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản.",
      });
    }

    // Cập nhật thông tin trong session
    req.session.user.full_name = fullName;
    req.session.user.phone = phone || null;

    return res.json({
      message: "Cập nhật thông tin thành công!",
      user: {
        id: userId,
        username: req.session.user.username,
        email: req.session.user.email,
        full_name: fullName,
        phone: phone || null,
        role: req.session.user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin:", error);

    return res.status(500).json({
      message: "Không thể cập nhật thông tin.",
    });
  }
});

// Đăng xuất
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Lỗi khi hủy session:", err);
    }
    res.redirect("/");
  });
});

// API lấy thông tin user đang đăng nhập
app.get("/api/current-user", isAuthenticated, (req, res) => {
  res.json({ user: req.session.user });
});

app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const uid = req.session.user.id;

    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, phone FROM `user` WHERE id = ?',
      [uid]
    );
    if (!users.length) return res.redirect('/logout');

    const [[stats]] = await pool.query(
      'SELECT COUNT(*) AS count, COALESCE(SUM(final_amount), 0) AS spent FROM orders WHERE user_id = ?',
      [uid]
    );

    res.render('profile.html', {
      profile: users[0],
      stats: { count: stats.count, spent: Number(stats.spent) },
      user: req.session.user
    });
  } catch (error) {
    console.error('Lỗi trang hồ sơ:', error);
    res.status(500).send('Lỗi truy vấn database');
  }
});
// ======================================================
// ===           QUẢN LÝ GIỎ HÀNG                     ===
// ======================================================

function findProduct(productId) {
  return SERVICES.find((p) => p.id === parseInt(productId));
}

app.get("/cart", isAuthenticated, (req, res) => {
  const cart = req.session.cart || [];
  res.render("cart.html", { cart, user: req.session.user });
});

app.post("/cart/add", isAuthenticated, (req, res) => {
  const { product_id } = req.body;
  const product = findProduct(product_id);

  if (!product) {
    return res.status(404).send("Không tìm thấy sản phẩm.");
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existing = req.session.cart.find(
    (item) => item.product_id === product.id,
  );
  if (existing) {
    existing.qty += 1;
  } else {
    req.session.cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      img: product.image,
      qty: 1,
    });
  }

  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    const count = req.session.cart.reduce((sum, item) => sum + item.qty, 0);
    return res.json({ success: true, count });
  }
  res.redirect("/cart");
});

app.post("/cart/update", isAuthenticated, (req, res) => {
  const { product_id, action } = req.body;

  if (!req.session.cart) {
    return res.redirect("/cart");
  }

  const item = req.session.cart.find(
    (i) => i.product_id === parseInt(product_id),
  );
  if (item) {
    if (action === "plus") {
      item.qty += 1;
    } else if (action === "minus" && item.qty > 1) {
      item.qty -= 1;
    }
  }

  res.redirect("/cart");
});

app.post("/cart/remove", isAuthenticated, (req, res) => {
  const { product_id } = req.body;

  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(
      (item) => item.product_id !== parseInt(product_id),
    );
  }

  res.redirect("/cart");
});

app.post("/cart/clear", isAuthenticated, (req, res) => {
  req.session.cart = [];
  res.redirect("/cart");
});

app.get("/api/cart-count", isAuthenticated, (req, res) => {
  const cart = req.session.cart || [];
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  res.json({ count });
});

// ======================================================

// Chi tiết dịch vụ: /services/:id
app.use("/", serviceRoutes);

// Đặt dịch vụ, thanh toán, lịch sử đơn hàng: /booking/:id, /orders
const bookingRoutes = require("./js/booking_routes");
app.use("/", bookingRoutes);

loadServices()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server đang chạy thành công tại: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Không nạp được dịch vụ từ database:", err);
  });
