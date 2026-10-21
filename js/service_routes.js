const express = require("express");
const router = express.Router();

// Dữ liệu mẫu khớp với 6 thẻ ở trang chủ.
// Sau này bạn có thể thay bằng truy vấn database.
const SERVICES = [
  {
    id: 1,
    title: "Gói trang trí sinh nhật cao cấp",
    image: "/img/birthday.png",
    rating: 4.6,
    reviews: 125,
    price: 1500000,
    short: "Không gian sinh nhật được thiết kế riêng theo chủ đề bạn chọn.",
    duration: "3 giờ (setup + dọn dẹp)",
    area: "TP. Hồ Chí Minh và Bình Dương",
    partner: "Party Planner",
    category: "trang-tri",
    events: ["sinh-nhat", "thoi-noi"],
    includes: [
      "Backdrop theo chủ đề",
      "Bóng bay trang trí",
      "Bàn quà và bàn tiệc",
      "Chữ tên / số tuổi",
      "Nhân viên setup tại chỗ",
    ],
    description:
      "Gói trang trí sinh nhật cao cấp phù hợp cho tiệc 20-50 khách. Đội ngũ sẽ trao đổi chủ đề, màu sắc trước ngày tổ chức và hoàn tất setup trước giờ tiệc.",
  },
  {
    id: 2,
    title: "Gói làm bánh & tiệc cho sự kiện",
    image: "/img/BanhvaSuKien.png",
    rating: 4.9,
    reviews: 14,
    price: 800000,
    short: "Bánh và đồ ăn nhẹ cho sự kiện, làm theo số lượng khách.",
    duration: "Giao trong ngày",
    area: "TP. Hồ Chí Minh",
    partner: "Sweet House",
    category: "banh-tiec",
    events: ["sinh-nhat", "tiec-cuoi", "thoi-noi"],
    includes: [
      "Bánh kem theo yêu cầu",
      "Bánh ngọt / finger food",
      "Dụng cụ cắt bánh",
      "Giao tận nơi",
    ],
    description:
      "Bánh và tiệc nhẹ được làm tươi trong ngày, có thể tùy chỉnh hương vị và số lượng.",
  },
  {
    id: 3,
    title: "Gói MC chuyên nghiệp",
    image: "/img/anhMC.png",
    rating: 4.6,
    reviews: 125,
    price: 3000000,
    short: "MC dẫn chương trình cho tiệc cưới, sinh nhật, sự kiện doanh nghiệp.",
    duration: "Tối đa 4 giờ",
    area: "Toàn quốc (có phụ phí di chuyển)",
    partner: "Golden Voice",
    category: "nhan-su",
    events: ["tiec-cuoi", "sinh-nhat", "year-party"],
    includes: [
      "Kịch bản chương trình",
      "Họp trao đổi trước sự kiện",
      "Dẫn chương trình trọn buổi",
      "Trang phục theo yêu cầu",
    ],
    description:
      "MC có kinh nghiệm, chủ động điều phối chương trình và tương tác với khách mời.",
  },
  {
    id: 4,
    title: "Gói trang trí tiệc cuối năm",
    image: "/img/endYear.png",
    rating: 4.6,
    reviews: 125,
    price: 4000000,
    short: "Trang trí tiệc tất niên, year end party cho công ty và nhóm bạn.",
    duration: "4 giờ (setup + dọn dẹp)",
    area: "TP. Hồ Chí Minh và Bình Dương",
    partner: "Event Pro",
    category: "trang-tri",
    events: ["year-party"],
    includes: [
      "Backdrop sân khấu",
      "Trang trí bàn tiệc",
      "Đèn và bóng trang trí",
      "Cổng chào / photobooth",
    ],
    description:
      "Gói trang trí dành cho tiệc 50-150 khách, theo concept bạn chọn.",
  },
  {
    id: 5,
    title: "Gói chụp ảnh & quay phim sự kiện",
    image: "/img/quayPhim.png",
    rating: 4.6,
    reviews: 125,
    price: 2000000,
    short: "Ghi lại toàn bộ khoảnh khắc sự kiện bằng ảnh và video.",
    duration: "Tối đa 4 giờ",
    area: "TP. Hồ Chí Minh",
    partner: "Moment Studio",
    category: "chup-anh",
    events: ["sinh-nhat", "tiec-cuoi", "year-party", "khai-truong", "thoi-noi"],
    includes: [
      "1 nhiếp ảnh gia + 1 quay phim",
      "Ảnh chỉnh sửa cơ bản",
      "Video highlight 2-3 phút",
      "Giao file qua link tải",
    ],
    description:
      "Nhận ảnh trong 3 ngày và video highlight trong 7 ngày sau sự kiện.",
  },
  {
    id: 6,
    title: "Gói & phụ kiện hoa cho sự kiện",
    image: "/img/hoaCuoi.png",
    rating: 4.6,
    reviews: 125,
    price: 300000,
    short: "Hoa tươi và phụ kiện hoa cho bàn tiệc, cổng chào, cầm tay.",
    duration: "Giao trong ngày",
    area: "TP. Hồ Chí Minh",
    partner: "Flora Studio",
    category: "hoa",
    events: ["tiec-cuoi", "khai-truong"],
    includes: ["Hoa cầm tay / hoa cài áo", "Hoa để bàn", "Phụ kiện trang trí"],
    description: "Hoa tươi theo mùa, phối màu theo chủ đề sự kiện.",
  },
  {
    id: 7,
    title: "Gói trang trí tiệc cưới trọn gói",
    image: "/img/wedding.png",
    rating: 4.8,
    reviews: 86,
    price: 12000000,
    short: "Trang trí sảnh cưới, cổng hoa, bàn gallery và sân khấu theo concept.",
    duration: "6 giờ (setup + dọn dẹp)",
    area: "TP. Hồ Chí Minh và các tỉnh lân cận",
    partner: "HoaBinh Events",
    category: "trang-tri",
    events: ["tiec-cuoi"],
    includes: [
      "Cổng hoa và lối đi",
      "Backdrop sân khấu",
      "Bàn gallery / bàn ký tên",
      "Hoa để bàn khách",
      "Nhân viên setup tại chỗ",
    ],
    description:
      "Gói trang trí tiệc cưới cho 200-400 khách, tư vấn concept và phối màu trước ngày cưới.",
  },
  {
    id: 8,
    title: "Gói âm thanh - ánh sáng sân khấu",
    image: "/img/hero-img.png",
    rating: 4.7,
    reviews: 52,
    price: 6500000,
    short: "Hệ thống loa, mixer, đèn sân khấu cho sự kiện vừa và lớn.",
    duration: "Tối đa 6 giờ",
    area: "TP. Hồ Chí Minh và Bình Dương",
    partner: "PartyDesign VN",
    category: "am-thanh",
    events: ["tiec-cuoi", "year-party", "khai-truong"],
    includes: [
      "Loa full + sub",
      "Mixer và micro không dây",
      "Đèn moving, đèn par",
      "Kỹ thuật viên vận hành",
    ],
    description:
      "Phù hợp cho sân khấu 100-300 khách, kỹ thuật viên có mặt suốt chương trình.",
  },
  {
    id: 9,
    title: "Gói trang trí khai trương",
    image: "/img/endYear.png",
    rating: 4.5,
    reviews: 40,
    price: 3500000,
    short: "Cổng bóng, backdrop và kệ hoa cho ngày khai trương cửa hàng.",
    duration: "3 giờ (setup + dọn dẹp)",
    area: "TP. Hồ Chí Minh",
    partner: "Á Châu Event",
    category: "trang-tri",
    events: ["khai-truong"],
    includes: [
      "Cổng bóng",
      "Backdrop khai trương",
      "Băng rôn / bảng tên",
      "Kệ hoa chúc mừng",
    ],
    description:
      "Trang trí mặt tiền và khu vực cắt băng, hoàn tất trước giờ khai trương.",
  },
  {
    id: 10,
    title: "Gói trang trí thôi nôi cho bé",
    image: "/img/birthday.png",
    rating: 4.8,
    reviews: 63,
    price: 2500000,
    short: "Không gian thôi nôi dễ thương theo chủ đề bé trai / bé gái.",
    duration: "3 giờ (setup + dọn dẹp)",
    area: "TP. Hồ Chí Minh và Bình Dương",
    partner: "Party Planner",
    category: "trang-tri",
    events: ["thoi-noi", "sinh-nhat"],
    includes: [
      "Backdrop tên bé",
      "Bóng bay trang trí",
      "Bàn bốc thôi nôi",
      "Nhân viên setup tại chỗ",
    ],
    description:
      "Gói trang trí thôi nôi cho tiệc 20-50 khách, đầy đủ bàn bốc đồ truyền thống.",
  },
  {
    id: 11,
    title: "Gói MC & ca sĩ tiệc cưới",
    image: "/img/anhMC.png",
    rating: 4.9,
    reviews: 31,
    price: 5500000,
    short: "MC dẫn lễ và ca sĩ biểu diễn trong tiệc cưới.",
    duration: "Tối đa 4 giờ",
    area: "TP. Hồ Chí Minh",
    partner: "Golden Voice",
    category: "nhan-su",
    events: ["tiec-cuoi"],
    includes: [
      "MC dẫn lễ thành hôn",
      "1 ca sĩ biểu diễn 4-5 bài",
      "Kịch bản chương trình",
    ],
    description:
      "MC và ca sĩ phối hợp để chương trình tiệc cưới liền mạch, trang trọng.",
  },
  {
    id: 12,
    title: "Gói nhân viên lễ tân sự kiện",
    image: "/img/anhMC.png",
    rating: 4.3,
    reviews: 22,
    price: 1200000,
    short: "Lễ tân đón khách, hướng dẫn chỗ ngồi, hỗ trợ check-in.",
    duration: "Tối đa 5 giờ",
    area: "TP. Hồ Chí Minh",
    partner: "Á Châu Event",
    category: "nhan-su",
    events: ["khai-truong", "year-party"],
    includes: [
      "2 nhân viên lễ tân",
      "Đồng phục theo yêu cầu",
      "Hỗ trợ check-in khách mời",
    ],
    description: "Nhân viên được đào tạo về tác phong, đón tiếp khách chuyên nghiệp.",
  },
  {
    id: 13,
    title: "Gói chụp ảnh cưới phóng sự",
    image: "/img/quayPhim.png",
    rating: 4.7,
    reviews: 48,
    price: 7000000,
    short: "Chụp phóng sự toàn bộ ngày cưới, từ lễ gia tiên đến tiệc.",
    duration: "Cả ngày",
    area: "TP. Hồ Chí Minh và các tỉnh lân cận",
    partner: "Moment Studio",
    category: "chup-anh",
    events: ["tiec-cuoi"],
    includes: [
      "2 nhiếp ảnh gia",
      "Toàn bộ ảnh chỉnh màu",
      "Album in 30x30",
    ],
    description: "Nhận ảnh chỉnh sửa trong 10 ngày và album in trong 20 ngày.",
  },
  {
    id: 14,
    title: "Gói chụp ảnh sinh nhật & thôi nôi",
    image: "/img/quayPhim.png",
    rating: 4.4,
    reviews: 37,
    price: 1800000,
    short: "Ghi lại khoảnh khắc tiệc sinh nhật, thôi nôi của bé.",
    duration: "Tối đa 3 giờ",
    area: "TP. Hồ Chí Minh",
    partner: "Moment Studio",
    category: "chup-anh",
    events: ["sinh-nhat", "thoi-noi"],
    includes: [
      "1 nhiếp ảnh gia",
      "Ảnh chỉnh sửa cơ bản",
      "Giao file qua link tải",
    ],
    description: "Nhận ảnh trong 3 ngày sau buổi tiệc.",
  },
  {
    id: 15,
    title: "Gói bánh cưới nhiều tầng",
    image: "/img/BanhvaSuKien.png",
    rating: 4.6,
    reviews: 29,
    price: 2800000,
    short: "Bánh cưới 3-5 tầng, trang trí hoa đường theo yêu cầu.",
    duration: "Giao trong ngày",
    area: "TP. Hồ Chí Minh",
    partner: "Sweet House",
    category: "banh-tiec",
    events: ["tiec-cuoi"],
    includes: [
      "Bánh cưới nhiều tầng",
      "Tháp ly champagne",
      "Giao và lắp đặt tận nơi",
    ],
    description: "Có thể chọn hương vị từng tầng bánh và màu hoa trang trí.",
  },
  {
    id: 16,
    title: "Gói tiệc buffet nhẹ khai trương",
    image: "/img/BanhvaSuKien.png",
    rating: 4.2,
    reviews: 18,
    price: 4500000,
    short: "Buffet finger food và nước uống cho 50 khách.",
    duration: "Phục vụ 3 giờ",
    area: "TP. Hồ Chí Minh",
    partner: "Sweet House",
    category: "banh-tiec",
    events: ["khai-truong", "year-party"],
    includes: [
      "Finger food 8 món",
      "Nước uống và trái cây",
      "Bàn buffet và dụng cụ",
      "Nhân viên phục vụ",
    ],
    description: "Thực đơn có thể điều chỉnh theo số lượng khách và ngân sách.",
  },
  {
    id: 17,
    title: "Gói hoa cưới & cổng hoa",
    image: "/img/hoaCuoi.png",
    rating: 4.8,
    reviews: 55,
    price: 3200000,
    short: "Hoa cầm tay cô dâu, hoa cài áo và cổng hoa tươi.",
    duration: "Giao trong ngày",
    area: "TP. Hồ Chí Minh",
    partner: "Flora Studio",
    category: "hoa",
    events: ["tiec-cuoi"],
    includes: [
      "Hoa cầm tay cô dâu",
      "Hoa cài áo chú rể",
      "Cổng hoa tươi",
    ],
    description: "Hoa tươi nhập trong ngày, phối màu theo tông của tiệc cưới.",
  },
  {
    id: 18,
    title: "Gói lẵng hoa chúc mừng khai trương",
    image: "/img/hoaCuoi.png",
    rating: 3.9,
    reviews: 12,
    price: 900000,
    short: "Lẵng hoa / kệ hoa chúc mừng gửi tặng đối tác.",
    duration: "Giao trong ngày",
    area: "TP. Hồ Chí Minh",
    partner: "Flora Studio",
    category: "hoa",
    events: ["khai-truong"],
    includes: ["Kệ hoa 2 tầng", "Băng rôn chúc mừng", "Giao tận nơi"],
    description: "Có thể in tên người gửi và lời chúc trên băng rôn.",
  },
  {
    id: 19,
    title: "Gói âm thanh tiệc sinh nhật mini",
    image: "/img/hero-img.png",
    rating: 3.8,
    reviews: 9,
    price: 700000,
    short: "Loa kéo, micro và đèn led cho tiệc nhỏ tại nhà.",
    duration: "Tối đa 4 giờ",
    area: "TP. Hồ Chí Minh",
    partner: "PartyDesign VN",
    category: "am-thanh",
    events: ["sinh-nhat", "thoi-noi"],
    includes: ["Loa kéo + 2 micro", "Đèn led trang trí", "Giao và lắp đặt"],
    description: "Phù hợp tiệc 10-30 khách trong nhà hoặc sân vườn.",
  },
];

// Các lựa chọn của bộ lọc ở trang /services
const CATEGORIES = {
  "trang-tri": "Trang trí sự kiện",
  "am-thanh": "Âm thanh - Ánh sáng",
  "nhan-su": "Nhân sự sự kiện",
  "chup-anh": "Chụp ảnh - Quay phim",
  "banh-tiec": "Bánh & Tiệc",
  hoa: "Hoa sự kiện",
};

// Khớp với bảng specialties trong database
const EVENT_TYPES = {
  "sinh-nhat": "Sinh Nhật",
  "tiec-cuoi": "Tiệc Cưới",
  "year-party": "Year Party",
  "khai-truong": "Khai Trương",
  "thoi-noi": "Thôi Nôi",
};

// [min, max) theo VNĐ
const PRICE_RANGES = {
  "duoi-1tr": { label: "Dưới 1 triệu", min: 0, max: 1000000 },
  "1-3tr": { label: "1 - 3 triệu", min: 1000000, max: 3000000 },
  "3-5tr": { label: "3 - 5 triệu", min: 3000000, max: 5000000 },
  "tren-5tr": { label: "Trên 5 triệu", min: 5000000, max: Infinity },
};

const RATINGS = {
  "4.5": "Từ 4.5 sao",
  "4.0": "Từ 4 sao",
  "3.0": "Từ 3 sao",
};

const SORTS = {
  "gia-tang": "Giá thấp đến cao",
  "gia-giam": "Giá cao đến thấp",
  "danh-gia": "Đánh giá cao nhất",
};

const PAGE_SIZE = 9;

function getService(id) {
  return SERVICES.find((s) => s.id === id);
}

// Bỏ dấu tiếng Việt để tìm "sinh nhat" vẫn ra "sinh nhật"
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

// Chỉ nhận giá trị nằm trong danh sách cho phép, còn lại coi như không lọc
function pick(value, options) {
  return typeof value === "string" && Object.hasOwn(options, value) ? value : "";
}

// Checkbox chọn nhiều: ?category=hoa&category=trang-tri -> ["hoa", "trang-tri"]
function pickMany(value, options) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.filter((v) => pick(v, options)))];
}

// Tìm kiếm + lọc + sắp xếp + phân trang.
// Trong cùng 1 nhóm là HOẶC (Trang trí hoặc Hoa), giữa các nhóm là VÀ.
// Sau này đổi sang database: category IN (...) AND (price BETWEEN ... OR ...) ...
function searchServices(query) {
  const filters = {
    q: typeof query.q === "string" ? query.q.trim().slice(0, 100) : "",
    category: pickMany(query.category, CATEGORIES),
    event: pickMany(query.event, EVENT_TYPES),
    price: pickMany(query.price, PRICE_RANGES),
    rating: pick(query.rating, RATINGS),
    sort: pick(query.sort, SORTS),
  };

  const keyword = normalize(filters.q);
  const ranges = filters.price.map((key) => PRICE_RANGES[key]);

  const list = SERVICES.filter(
    (s) =>
      (!keyword || normalize(`${s.title} ${s.short} ${s.partner}`).includes(keyword)) &&
      (!filters.category.length || filters.category.includes(s.category)) &&
      (!filters.event.length || filters.event.some((e) => s.events.includes(e))) &&
      (!ranges.length || ranges.some((r) => s.price >= r.min && s.price < r.max)) &&
      (!filters.rating || s.rating >= Number(filters.rating))
  );

  if (filters.sort === "gia-tang") list.sort((a, b) => a.price - b.price);
  if (filters.sort === "gia-giam") list.sort((a, b) => b.price - a.price);
  if (filters.sort === "danh-gia")
    list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), totalPages);

  return {
    services: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: list.length,
    page,
    totalPages,
    filters,
  };
}

// Tạo link /services giữ nguyên các bộ lọc đang chọn, ghi đè bằng changes.
// Đổi bộ lọc thì quay về trang 1 (không giữ page).
function servicesUrl(filters, changes = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...changes })) {
    if (key === "page" && value === 1) continue;
    for (const v of [].concat(value)) if (v) params.append(key, v);
  }
  const qs = params.toString();
  return qs ? `/services?${qs}` : "/services";
}

// GET /services?q=&category=&event=&price=&rating=&sort=&page=
router.get("/services", (req, res) => {
  const result = searchServices(req.query);

  res.render("eventservices.html", {
    ...result,
    options: {
      categories: CATEGORIES,
      events: EVENT_TYPES,
      prices: Object.fromEntries(
        Object.entries(PRICE_RANGES).map(([key, r]) => [key, r.label])
      ),
      ratings: RATINGS,
      sorts: SORTS,
    },
    // Dùng trong view: url("page", 2)
    url: (key, value) => servicesUrl(result.filters, { [key]: value }),
    // Số bộ lọc đang bật (không tính từ khóa và sắp xếp) để hiện nút "Xóa"
    activeCount:
      result.filters.category.length +
      result.filters.event.length +
      result.filters.price.length +
      (result.filters.rating ? 1 : 0),
    user: req.session.user || null,
  });
});

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
