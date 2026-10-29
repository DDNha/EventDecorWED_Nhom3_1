const express = require("express");

// Giỏ hàng và checkout trong app.js vẫn đọc mảng này (chưa chuyển sang database).
const SERVICES = [];
let productsHasCategory;

// Khoảng giá của bộ lọc "Mức giá" trên trang dịch vụ
const PRICE_RANGES = {
  low: { label: "Dưới 1 triệu", sql: "p.price < 1000000" },
  mid: { label: "1 - 3 triệu", sql: "p.price BETWEEN 1000000 AND 3000000" },
  high: { label: "Trên 3 triệu", sql: "p.price > 3000000" },
};

// Đổi tên cột của bảng products sang tên mà các template đang dùng
function toService(row) {
  return {
    id: row.id,
    title: row.name,
    image: row.img,
    rating: row.rating,
    reviews: row.reviewsCount,
    price: row.price,
    short: row.short_desc,
    duration: row.executionTime,
    area: row.location,
    partner: row.partner_name,
    category: row.category,
    description: row.description,
  };
}

async function supportsProductCategory(pool) {
  if (productsHasCategory !== undefined) return productsHasCategory;

  const [columns] = await pool.query(
    "SHOW COLUMNS FROM products LIKE 'category'",
  );
  productsHasCategory = columns.length > 0;
  return productsHasCategory;
}

module.exports = function ({ pool }) {
  const router = express.Router();

  // GET /services?q=&category=&price=  -> danh sách dịch vụ, tìm kiếm và lọc trên database
  router.get("/services", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const price = PRICE_RANGES[req.query.price] ? req.query.price : "";

    try {
      const hasCategory = await supportsProductCategory(pool);
      const clauses = [];
      const params = [];
      if (q) {
        clauses.push("p.name LIKE ?");
        params.push(`%${q}%`);
      }
      if (category && hasCategory) {
        clauses.push("p.category = ?");
        params.push(category);
      }
      if (price) clauses.push(PRICE_RANGES[price].sql);
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

      const [rows] = await pool.query(
        `SELECT p.*, pt.name AS partner_name
         FROM products p
         LEFT JOIN partners pt ON pt.id = p.partner_id
         ${where}
         ORDER BY p.id`,
        params,
      );
      const [categories] = hasCategory
        ? await pool.query(
            `SELECT DISTINCT category FROM products
             WHERE category IS NOT NULL AND category <> ''
             ORDER BY category`,
          )
        : [[]];

      res.render("eventservices.html", {
        services: rows.map(toService),
        categories: categories.map((c) => c.category),
        priceRanges: PRICE_RANGES,
        filters: { q, category, price },
        user: req.session.user || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi truy vấn database");
    }
  });

  // GET /services/:id
  router.get("/services/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).send("Không tìm thấy dịch vụ");
    }

    try {
      const [rows] = await pool.query(
        `SELECT p.*, pt.name AS partner_name
         FROM products p
         LEFT JOIN partners pt ON pt.id = p.partner_id
         WHERE p.id = ?`,
        [id],
      );
      if (!rows.length) {
        return res.status(404).send("Không tìm thấy dịch vụ");
      }

      const service = toService(rows[0]);
      const [inclusions] = await pool.query(
        "SELECT item_text FROM product_inclusions WHERE product_id = ? ORDER BY id",
        [id],
      );
      service.includes = inclusions.map((i) => i.item_text);

      const [reviews] = await pool.query(
        `SELECT r.rating_stars, r.comment, r.partner_reply, r.created_at, u.username
         FROM reviews r
         LEFT JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC`,
        [id],
      );

      const [related] = await pool.query(
        "SELECT * FROM products WHERE id <> ? ORDER BY id LIMIT 3",
        [id],
      );

      res.render("service_detail.html", {
        service,
        reviews,
        related: related.map(toService),
        user: req.session.user || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Lỗi truy vấn database");
    }
  });

  return router;
};

module.exports.SERVICES = SERVICES;
