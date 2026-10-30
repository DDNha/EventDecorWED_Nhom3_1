require("dotenv").config();
const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const session = require("express-session");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { signInWithGoogle } = require("./js/google_auth");
const { getDbConfig } = require("./js/db_config");
const serviceRoutes = require("./js/service_routes");
// Dùng chung một mảng với service_routes để trang chi tiết cũng thấy dữ liệu.
// Dữ liệu được nạp từ bảng `products` trong database (xem loadProducts bên dưới).
const PRODUCTS = serviceRoutes.SERVICES;
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "921639641123-44j6hefhg2iobahvm24cdi3u290rabl0.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware đọc dữ liệu từ Form POST và JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình Express Session
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "eventdecor-development-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Phiên tồn tại trong 1 ngày
  }),
);

// Phục vụ file tĩnh từ các thư mục css, img, js và public
// Làm mới danh sách sản phẩm (cache 30 giây) trước khi xử lý các trang
app.use(async (req, res, next) => {
  if (req.method === "GET" && !/^\/(css|img|js)\//.test(req.path))
    await loadProducts();
  next();
});

app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use(express.static(path.join(__dirname, "public")));

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
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("Kết nối MySQL thành công!");
  } catch (error) {
    console.error("Lỗi kết nối MySQL:", error);
  }
}

if (!process.env.SKIP_DATABASE_CONNECTION_TEST) testConnection().then();

// Nạp danh sách sản phẩm từ bảng `products` vào mảng PRODUCTS (ghi đè tại chỗ, giữ nguyên tham chiếu)
let productsLoadedAt = 0;
async function loadProducts(force = false) {
  if (!force && Date.now() - productsLoadedAt < 30 * 1000) return;
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY id");
    PRODUCTS.length = 0;
    // Hỗ trợ cả cột kiểu mới (title, image, reviews, duration, area, includes)
    // lẫn kiểu cũ (name, img, reviewsCount, executionTime, location)
    rows.forEach((p) => {
      const name = p.title ?? p.name;
      const image = p.image ?? p.img;
      PRODUCTS.push({
        ...p,
        name,
        title: name,
        image,
        img: image,
        reviews: p.reviews ?? p.reviewsCount ?? 0,
        reviewsCount: p.reviewsCount ?? p.reviews ?? 0,
        duration: p.duration ?? p.executionTime,
        executionTime: p.executionTime ?? p.duration,
        area: p.area ?? p.location,
        location: p.location ?? p.area,
        includes:
          typeof p.includes === "string"
            ? p.includes.split(/\r?\n/).filter(Boolean)
            : p.includes || [],
        price: Number(p.price),
        rating: Number(p.rating),
      });
    });
    productsLoadedAt = Date.now();
  } catch (error) {
    console.error("Lỗi nạp dịch vụ từ bảng products:", error.message);
  }
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
    const [partners] = await pool
      .query(`SELECT * FROM partners`)
      .catch(() => [[]]);
    res.render("index.html", {
      products: PRODUCTS.slice(0, 6),
      services: PRODUCTS.slice(0, 6), // chỉ 6 dịch vụ nổi bật
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

// Đối tác
app.get("/partner", async (req, res) => {
  try {
    const [partners] = await pool.query(`SELECT * FROM partners`);
    res.render("partner.html", {
      part: partners,
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

app.post("/contact", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `Liên hệ mới từ khách hàng`,
      text: `Tên khách hàng: ${name}
      Số điện thoại: ${phone}
      Email: ${email}
      Nội dung:${message}`,
    });
    const [result] = await pool.execute(
      `
      INSERT INTO contacts (full_name, email, phone, message) VALUES (?,?,?,?)`,
      [name.trim(), phone.trim(), email.trim(), message.trim()],
    );
    return res.status(200).json({
      success: true,
      message: "Gửi tin nhắn thành công!",
    });
  } catch (error) {
    console.error("Lỗi gửi email contact:", error.message);
    return res.status(500).json({
      success: false,
      message: "Gửi tin nhắn thất bại. Vui lòng thử lại!",
    });
  }
});

// Trang đăng ký
app.get("/register", (req, res) => {
  res.render("register.html", {
    user: req.session.user || null,
    googleClientId: GOOGLE_CLIENT_ID,
  });
});

// Trang đăng nhập
app.get(["/loggin", "/login"], (req, res) => {
  res.render("loggin.html", {
    user: req.session.user || null,
    googleClientId: GOOGLE_CLIENT_ID,
  });
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
      "SELECT id FROM `users` WHERE email = ? LIMIT 1",
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
      "SELECT id FROM `users` WHERE username = ? LIMIT 1",
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
app.post("/api/auth/google", async (req, res) => {
  const credential = String(req.body.credential || "");
  if (!credential) {
    return res
      .status(400)
      .json({ message: "Thiếu thông tin xác thực Google." });
  }

  let tokenVerified = false;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    tokenVerified = true;
    const account = await signInWithGoogle({
      profile: ticket.getPayload(),
      repository: {
        async findByEmail(email) {
          const [accounts] = await pool.execute(
            "SELECT id, username, email FROM `users` WHERE email = ? LIMIT 1",
            [email],
          );
          return accounts[0] || null;
        },
        async findByUsername(username) {
          const [accounts] = await pool.execute(
            "SELECT id FROM `users" + "` WHERE username = ? LIMIT 1",
            [username],
          );
          return accounts[0] || null;
        },
        async createUser(user) {
          await pool.execute(
            "INSERT INTO `users` (username, email, password) VALUES (?, ?, ?)",
            [user.username, user.email, user.password],
          );
        },
      },
      hashPassword: (password) => bcrypt.hash(password, 12),
    });

    req.session.user = {
      id: account.id,
      username: account.username,
      email: account.email,
      full_name: account.full_name || account.username,
      phone: account.phone || null,
      role: account.role || "user",
    };

    return req.session.save((error) => {
      if (error) {
        console.error("Lỗi lưu phiên Google:", error);
        return res
          .status(500)
          .json({ message: "Không thể tạo phiên đăng nhập." });
      }
      res.json({ message: "Đăng nhập bằng Google thành công!", redirect: "/" });
    });
  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    if (tokenVerified) {
      if (error.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({
          message: "Chưa tìm thấy bảng tài khoản trong cơ sở dữ liệu.",
        });
      }
      if (error.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({
          message:
            "Cấu trúc bảng tài khoản chưa đủ các cột cần thiết để đăng nhập Google.",
        });
      }
      if (error.code === "ER_NO_DEFAULT_FOR_FIELD") {
        return res.status(500).json({
          message:
            "Cấu trúc bảng tài khoản còn thiếu giá trị mặc định cho tài khoản Google.",
        });
      }
      return res.status(500).json({
        message: "Không thể tạo hoặc truy cập tài khoản. Vui lòng thử lại.",
      });
    }
    return res.status(401).json({
      message: "Không thể xác minh tài khoản Google. Vui lòng thử lại.",
    });
  }
});

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
      `SELECT id, username, email, password
       FROM \`users\`
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

    if (account.status === "locked") {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    // Tạo session đăng nhập, không lưu mật khẩu vào session
    req.session.user = {
      id: account.id,
      username: account.username,
      email: account.email,
      full_name: account.full_name || account.username,
      phone: account.phone || null,
      role: account.role || "user",
    };

    return res.json({
      message: "Đăng nhập thành công!",
      redirect:
        account.role === "admin"
          ? "/admin"
          : account.role === "partner"
            ? "/partner/orders/new"
            : "/",
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
      `UPDATE \`users\`
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

// Trung tâm báo cáo/phản ánh dành cho khách hàng và đối tác
app.get("/report", isAuthenticated, (req, res) => {
  res.render("report.html", {
    user: req.session.user,
    success: req.query.success || "",
    error: null,
  });
});

app.post("/report", isAuthenticated, async (req, res) => {
  const subject = String(req.body.subject || "").trim();
  const content = String(req.body.content || "").trim();
  const category = String(req.body.category || "Khác").trim();
  const orderId = req.body.order_id ? Number(req.body.order_id) : null;

  if (subject.length < 3 || content.length < 10) {
    return res.status(400).render("report.html", {
      user: req.session.user,
      success: "",
      error: "Vui lòng nhập tiêu đề và nội dung phản ánh chi tiết hơn.",
    });
  }

  try {
    await pool.query(
      `INSERT INTO reports (reporter_id, reporter_role, order_id, subject, category, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        req.session.user.role === "partner" ? "partner" : "user",
        Number.isFinite(orderId) ? orderId : null,
        subject,
        category,
        content,
      ],
    );
    res.redirect(
      "/report?success=" +
        encodeURIComponent(
          "Phản ánh đã được gửi. Quản trị viên sẽ tiếp nhận và phản hồi sớm.",
        ),
    );
  } catch (error) {
    console.error("Lỗi gửi phản ánh:", error);
    res.status(500).render("report.html", {
      user: req.session.user,
      success: "",
      error: "Không thể gửi phản ánh lúc này. Vui lòng thử lại.",
    });
  }
});

app.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const uid = req.session.user.id;

    const [users] = await pool.execute(
      "SELECT id, username, email, full_name, phone FROM `user` WHERE id = ?",
      [uid],
    );
    if (!users.length) return res.redirect("/logout");

    const [[stats]] = await pool.query(
      "SELECT COUNT(*) AS count, COALESCE(SUM(final_amount), 0) AS spent FROM orders WHERE user_id = ?",
      [uid],
    );

    res.render("profile.html", {
      profile: users[0],
      stats: { count: stats.count, spent: Number(stats.spent) },
      user: req.session.user,
    });
  } catch (error) {
    console.error("Lỗi trang hồ sơ:", error);
    res.status(500).send("Lỗi truy vấn database");
  }
});
// ======================================================
// ===           QUẢN LÝ GIỎ HÀNG                     ===
// ======================================================

function findProduct(productId) {
  return PRODUCTS.find((p) => p.id === parseInt(productId));
}

// Nút "Đặt dịch vụ" ở trang chi tiết: thêm sản phẩm vào giỏ rồi chuyển thẳng sang trang thanh toán
app.get(
  ["/booking/:id", "/products/:id/book", "/services/:id/book"],
  isAuthenticated,
  (req, res) => {
    const product = findProduct(req.params.id);

    if (!product) {
      return res.status(404).send("Không tìm thấy sản phẩm.");
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existing = req.session.cart.find(
      (item) => item.product_id === product.id,
    );
    if (!existing) {
      req.session.cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        img: product.image,
        qty: 1,
      });
    }

    res.redirect("/checkout");
  },
);

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

// Danh sách dịch vụ (tìm kiếm, lọc) và chi tiết dịch vụ: /services, /services/:id
app.use("/", serviceRoutes({ pool }));

// Đặt dịch vụ, thanh toán và lưu đơn hàng vào MySQL
const checkoutRoutes = require("./js/checkout_routes");
app.use(
  "/",
  checkoutRoutes({ pool, PRODUCTS, SERVICES: PRODUCTS, isAuthenticated }),
);

// Khu vực quản trị và cổng tạo đơn dành cho đối tác
const createAdminRoutes = require("./js/admin_routes");
app.use("/", createAdminRoutes({ pool }));

app.use((error, req, res, next) => {
  console.error("Lỗi xử lý yêu cầu:", error);
  if (res.headersSent) return next(error);
  res
    .status(500)
    .send(
      "Hệ thống đang gặp lỗi. Vui lòng kiểm tra database hoặc thử lại sau.",
    );
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server đang chạy thành công tại: http://localhost:${PORT}`);
  });
}
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
app.use(
  "/admin-assets",
  express.static(path.join(__dirname, "views", "admin")),
);

module.exports = app;
