const express = require("express");
const router = express.Router();

// Dữ liệu mẫu khớp với 6 thẻ ở trang chủ.
// Sau này bạn có thể thay bằng truy vấn database.
const SERVICES = [];

function getService(id) {
  return SERVICES.find((s) => Number(s.id) === id);
}

// GET /services/:id
router.get("/services/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const service = getService(id);

  if (!service) {
    return res.status(404).send("Không tìm thấy dịch vụ");
  }

  const related = SERVICES.filter((s) => s.id !== id).slice(0, 3);
  res.render("service_detail.html", { service, related });
});

module.exports = router;
module.exports.SERVICES = SERVICES;
