const express = require("express");
const router = express.Router();

// Danh sách sản phẩm (dịch vụ). Được nạp từ bảng `products` trong database bởi app.js.
const PRODUCTS = [];

function getProduct(id) {
  return PRODUCTS.find((p) => Number(p.id) === id);
}

// GET /services/:id  và  /products/:id
router.get(["/services/:id", "/products/:id"], (req, res) => {
  const id = parseInt(req.params.id, 10);
  const product = getProduct(id);

  if (!product) {
    return res.status(404).send("Không tìm thấy sản phẩm");
  }

  const related = PRODUCTS.filter((p) => p.id !== id).slice(0, 3);
  // Giữ thêm khóa `service` cho template service_detail.html hiện tại
  res.render("service_detail.html", { product, service: product, related });
});

module.exports = router;
module.exports.PRODUCTS = PRODUCTS;
module.exports.SERVICES = PRODUCTS; // bí danh tương thích code cũ
