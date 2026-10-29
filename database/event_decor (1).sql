-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 28, 2026 lúc 02:27 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
-- Aiven/MySQL managed có thể yêu cầu khóa chính ngay khi CREATE TABLE,
-- trong khi dump phpMyAdmin thêm khóa chính ở phần ALTER TABLE phía dưới.
SET SESSION sql_require_primary_key = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `event_decor`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `event_decor`;

--
-- Cơ sở dữ liệu: `event_decor`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_reviews_featured`
--

CREATE TABLE `customer_reviews_featured` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_avatar` varchar(255) DEFAULT NULL,
  `feedback_text` text NOT NULL,
  `rating_stars` int(11) NOT NULL DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `source_role` enum('customer','partner') NOT NULL DEFAULT 'customer',
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `service_name` varchar(200) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `event_location` varchar(255) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0,
  `final_amount` decimal(15,2) NOT NULL DEFAULT 0,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` enum('pending','approved','processing','completed','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 10.00,
  `commission_amount` decimal(15,2) NOT NULL DEFAULT 0,
  `partner_payout` decimal(15,2) NOT NULL DEFAULT 0,
  `admin_note` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đơn mẫu tương ứng với dữ liệu order_items bên dưới.
INSERT INTO `orders`
(`id`, `user_id`, `source_role`, `customer_name`, `customer_phone`, `service_name`,
 `event_date`, `event_time`, `event_location`, `total_amount`, `final_amount`,
 `payment_method`, `status`, `commission_rate`, `commission_amount`, `partner_payout`)
VALUES
(1, 4, 'customer', 'Khách hàng mẫu', '0900000000', 'Đơn nhiều dịch vụ',
 '2026-11-20', '18:00:00', 'TP. Hồ Chí Minh', 5300000, 5300000,
 'Chuyển khoản', 'completed', 10, 530000, 4770000);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `partner` varchar(255) DEFAULT NULL,
  `price` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `service_id`, `title`, `image`, `partner`, `price`, `quantity`) VALUES
(1, 1, 2, 'Gói làm bánh & tiệc cho sự kiện', '/img/BanhvaSuKien.png', 'Bếp Nhà Ngọc', 800000, 1),
(2, 1, 1, 'Gói trang trí sinh nhật cao cấp', '/img/birthday.png', 'Sắc Màu Decor', 1500000, 1),
(3, 1, 3, 'Gói MC chuyên nghiệp', '/img/anhMC.png', 'MC Minh Khang', 3000000, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `partners`
--

CREATE TABLE `partners` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(160) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `partners`
--

INSERT INTO `partners` (`id`, `name`, `image`, `description`, `address`, `phone`, `email`, `created_at`) VALUES
(1, 'PartyDesign VN', '/img/partners/partydesn.png', 'Đối tác tin cậy của nhiều thương hiệu lớn như Acer, Vietcombank, Pepsico', 'TP. Hồ Chí Minh', '0901234567', 'contact@partydesign.', '2026-10-27 16:07:44'),
(2, 'HoaBinh Events', '/img/partners/hoabinh.png', 'Đơn vị tổ chức hội nghị, sự kiện và du lịch (MICE) quy mô lớn trên toàn quốc.', 'TP. Hồ Chí Minh', '0912345678', 'info@hoabinh-events.', '2026-10-27 16:07:44'),
(3, 'Á Châu Event', '/img/partners/achauevent.png', 'Mạnh về tổ chức teambuilding, tiệc cuối năm (YEP) và sự kiện doanh nghiệp.', 'Bình Dương', '0923456789', 'contact@achauevent.com', '2026-10-27 16:07:44'),
(4, 'Sắc Màu Decor', '/img/PDesigh.png', 'Đơn vị trang trí sinh nhật và sự kiện theo chủ đề.', 'TP. Hồ Chí Minh', '0934000004', 'contact@sacmaudecor.vn', '2026-10-27 16:07:44'),
(5, 'King Media', '/img/kingMedia.png', 'Dịch vụ chụp ảnh, quay phim và truyền thông sự kiện.', 'TP. Hồ Chí Minh', '0934000005', 'contact@kingmedia.vn', '2026-10-27 16:07:44'),
(6, 'HBG Event', '/img/HBGevent.png', 'Tổ chức và điều phối sự kiện doanh nghiệp trọn gói.', 'TP. Hồ Chí Minh', '0934000006', 'contact@hbgevent.vn', '2026-10-27 16:07:44'),
(7, 'Sound & Light Pro', '/img/hero-img.png', 'Cung cấp âm thanh, ánh sáng và sân khấu sự kiện.', 'TP. Hồ Chí Minh', '0934000007', 'contact@soundlight.vn', '2026-10-27 16:07:44'),
(8, 'Hoa Cưới Việt', '/img/hoaCuoi.png', 'Hoa cưới và phụ kiện hoa cho các dịp đặc biệt.', 'Đồng Nai', '0934000008', 'contact@hoacuoi.vn', '2026-10-27 16:07:44'),
(9, 'Bếp Nhà Ngọc', '/img/BanhvaSuKien.png', 'Bánh và tiệc nhẹ cho hội thảo, sinh nhật và sự kiện.', 'TP. Hồ Chí Minh', '0934000009', 'contact@bepnhangoc.vn', '2026-10-27 16:07:44');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `partner_payouts`
--

CREATE TABLE `partner_payouts` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 0,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_account_name` varchar(100) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `partner_schedules`
--

CREATE TABLE `partner_schedules` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `busy_date` date NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `partner_specialties`
--

CREATE TABLE `partner_specialties` (
  `partner_id` int(11) NOT NULL,
  `specialty_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `partner_specialties`
--

INSERT INTO `partner_specialties` (`partner_id`, `specialty_id`) VALUES
(1, 1),
(1, 3),
(1, 5),
(2, 2),
(2, 4),
(3, 3),
(3, 4);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 0,
  `transaction_code` varchar(100) DEFAULT NULL,
  `status` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `payment_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` int(11) NOT NULL DEFAULT 0,
  `img` varchar(255) DEFAULT NULL,
  `rating` decimal(3,1) NOT NULL DEFAULT 0.0,
  `reviewsCount` int(11) NOT NULL DEFAULT 0,
  `executionTime` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_inclusions`
--

CREATE TABLE `product_inclusions` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `item_text` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) DEFAULT NULL,
  `reporter_role` enum('user','partner') NOT NULL DEFAULT 'user',
  `order_id` int(11) DEFAULT NULL,
  `subject` varchar(180) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Khác',
  `content` text NOT NULL,
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `status` enum('open','in_progress','resolved','rejected') NOT NULL DEFAULT 'open',
  `admin_response` text DEFAULT NULL,
  `handled_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

-- Cấu trúc bảng đánh giá
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `rating_stars` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `partner_reply` text DEFAULT NULL,
  `replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `review_reports`
--

CREATE TABLE `review_reports` (
  `id` int(11) NOT NULL,
  `review_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `saved_products`
--

CREATE TABLE `saved_products` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT 0.0,
  `reviews` int(11) DEFAULT 0,
  `price` int(11) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `short_desc` varchar(500) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `area` varchar(255) DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL,
  `includes` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','active','inactive','rejected') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `services`
--

INSERT INTO `services` (`id`, `title`, `image`, `rating`, `reviews`, `price`, `category`, `short_desc`, `duration`, `area`, `partner_id`, `includes`, `description`, `created_at`) VALUES
(1, 'Gói trang trí sinh nhật cao cấp', '/img/birthday.png', 4.6, 125, 1500000, 'Trang trí sự kiện', 'Trang trí sinh nhật sang trọng với bóng, hoa và phông nền theo yêu cầu.', '3 - 4 giờ', 'TP.HCM', 4, 'Phông nền và cổng bóng\nBàn bánh kem và bàn quà\nGóc chụp ảnh\nNhân viên lắp đặt và dọn dẹp', 'Gói trang trí sinh nhật cao cấp dành cho tiệc gia đình và bạn bè. Đội ngũ tư vấn màu sắc, lắp đặt trước giờ tiệc và thu dọn sau khi kết thúc.', '2026-10-27 07:48:08'),
(2, 'Gói làm bánh & tiệc cho sự kiện', '/img/BanhvaSuKien.png', 4.9, 14, 800000, 'Trang trí sự kiện', 'Bánh kem, bánh ngọt và tiệc nhẹ cho sự kiện nhỏ.', 'Giao trong ngày', 'Nội thành TP.HCM', 2, 'Bánh kem trang trí theo chủ đề\nBánh ngọt mini\nDụng cụ ăn uống\nGiao tận nơi đúng giờ', 'Gói bánh và tiệc nhẹ phù hợp sinh nhật, họp mặt và lễ kỷ niệm. Vui lòng đặt trước 2 ngày để kịp chuẩn bị.', '2026-10-27 07:48:08'),
(3, 'Gói MC chuyên nghiệp', '/img/anhMC.png', 4.6, 125, 3000000, 'Nhân sự sự kiện', 'MC dẫn chương trình có kinh nghiệm cho tiệc và hội nghị.', '3 giờ', 'TP.HCM', 3, 'MC dẫn chương trình\nKịch bản chương trình\nTrao đổi nội dung trước sự kiện', 'MC làm việc cùng ban tổ chức để thống nhất kịch bản, thời lượng và phong cách dẫn phù hợp từng sự kiện.', '2026-10-27 07:48:08'),
(4, 'Gói trang trí tiệc cuối năm', '/img/endYear.png', 4.6, 125, 4000000, 'Trang trí sự kiện', 'Trang trí sân khấu và không gian cho tiệc tất niên.', '5 giờ', 'TP.HCM', 6, 'Trang trí sân khấu\nKhu vực check-in\nBóng và hoa trang trí bàn\nNhân viên lắp đặt', 'Gói trang trí không gian tiệc cuối năm cho công ty, bao gồm lắp đặt và thu dọn sau sự kiện.', '2026-10-27 07:48:08'),
(5, 'Gói chụp ảnh & quay phim sự kiện', '/img/quayPhim.png', 4.6, 125, 2000000, 'Nhân sự sự kiện', 'Chụp ảnh và quay phim ghi lại các khoảnh khắc của sự kiện.', '4 giờ', 'TP.HCM', 5, 'Nhiếp ảnh gia\nẢnh đã chỉnh màu\nVideo ngắn tổng hợp', 'Ghi lại toàn bộ khoảnh khắc chính của sự kiện, bàn giao ảnh và video trong vài ngày làm việc.', '2026-10-27 07:48:08'),
(6, 'Gói & phụ kiện hoa cho sự kiện', '/img/hoaCuoi.png', 4.6, 125, 300000, 'Trang trí sự kiện', 'Hoa tươi và phụ kiện hoa cho sự kiện nhỏ.', '1 - 2 giờ', 'TP.HCM', 1, 'Hoa cầm tay\nHoa trang trí bàn\nHoa cài áo', 'Gói hoa cơ bản cho lễ đính hôn, sinh nhật và các sự kiện nhỏ. Hoa được chọn theo mùa.', '2026-10-27 07:48:08'),
(7, 'Gói trang trí sinh nhật thiếu nhi theo chủ đề', '/img/birthday.png', 4.8, 96, 2200000, 'Trang trí sự kiện', 'Trang trí tiệc sinh nhật cho bé với bóng bay, phông nền và góc chụp ảnh theo chủ đề yêu thích.', '3 - 4 giờ', 'TP.HCM và các quận lân cận', 4, 'Phông nền và cổng bóng theo chủ đề\nBàn quà tặng và bàn bánh kem\nGóc chụp ảnh cho bé\nNhân viên lắp đặt và dọn dẹp sau tiệc', 'Gói dành cho tiệc sinh nhật bé từ 1 đến 12 tuổi. Đội ngũ tư vấn chủ đề cùng gia đình, lắp đặt trước giờ tiệc 2 tiếng và thu dọn sau khi kết thúc. Có thể thêm bóng bay hiệu ứng, thú nhún hoặc hoạt náo viên với chi phí riêng.', '2026-10-27 07:48:08'),
(8, 'Gói chụp ảnh sự kiện trọn buổi', '/img/quayPhim.png', 4.7, 82, 3500000, 'Nhân sự sự kiện', 'Nhiếp ảnh gia chụp toàn bộ sự kiện, bàn giao ảnh đã chỉnh màu trong 3 ngày.', '4 giờ', 'TP.HCM', 5, '1 nhiếp ảnh gia và 1 phụ tá\nTối thiểu 150 ảnh đã chỉnh màu\nBàn giao ảnh gốc qua đường dẫn tải về\nIn 10 ảnh khổ 13x18 miễn phí', 'Phù hợp cho lễ kỷ niệm, hội nghị khách hàng và tiệc công ty. Nhiếp ảnh gia đến sớm 30 phút để khảo sát ánh sáng, chụp các khoảnh khắc chính và ảnh nhóm. Ảnh được bàn giao trong vòng 3 ngày làm việc.', '2026-10-27 07:48:08'),
(9, 'Gói quay phim và flycam sự kiện', '/img/quayPhim.png', 4.9, 54, 6500000, 'Nhân sự sự kiện', 'Quay phim đa góc máy kèm flycam, dựng video tổng hợp 3 - 5 phút.', '5 giờ', 'TP.HCM và Bình Dương', 5, '2 quay phim và 1 người điều khiển flycam\nVideo highlight 3 - 5 phút\nNhạc nền bản quyền\nChỉnh sửa tối đa 2 lần theo góp ý', 'Gói quay phim chuyên nghiệp cho sự kiện quy mô vừa và lớn. Flycam chỉ hoạt động khi điều kiện thời tiết và địa điểm cho phép bay. Thời gian bàn giao video dựng là 7 ngày làm việc.', '2026-10-27 07:48:08'),
(10, 'Gói âm thanh ánh sáng cho sự kiện 100 khách', '/img/hero-img.png', 4.6, 71, 4800000, 'Âm thanh - Ánh sáng', 'Hệ thống loa, mixer, micro không dây và đèn sân khấu cho sự kiện trong nhà đến 100 khách.', '6 giờ', 'TP.HCM', 7, '2 loa full và 1 loa sub\n4 micro không dây\nBộ đèn par LED và đèn moving head\nKỹ thuật viên vận hành suốt chương trình', 'Thiết bị được lắp đặt và chạy thử trước giờ bắt đầu 1 giờ. Gói phù hợp tiệc công ty, họp mặt và lễ kỷ niệm trong nhà. Sự kiện ngoài trời hoặc trên 100 khách vui lòng chọn gói âm thanh ánh sáng nâng cao.', '2026-10-27 07:48:08'),
(11, 'Gói sân khấu và màn hình LED ngoài trời', '/img/hero-img.png', 4.8, 38, 12000000, 'Âm thanh - Ánh sáng', 'Sân khấu 6x4m, màn hình LED P3 và hệ thống âm thanh công suất lớn cho sự kiện ngoài trời.', '8 giờ', 'TP.HCM và các tỉnh lân cận', 7, 'Sân khấu khung sắt 6x4m có thảm trải\nMàn hình LED P3 khoảng 12m2\nHệ thống âm thanh ngoài trời\nĐội kỹ thuật 4 người lắp đặt và vận hành', 'Gói trọn bộ cho lễ khai trương, hội chợ và chương trình ca nhạc ngoài trời. Giá chưa gồm giấy phép tổ chức và máy phát điện dự phòng. Báo trước ít nhất 5 ngày để chuẩn bị thiết bị.', '2026-10-27 07:48:08'),
(12, 'Gói tiệc trà và buffet nhẹ cho hội thảo', '/img/BanhvaSuKien.png', 4.7, 63, 1800000, 'Nhân sự sự kiện', 'Bánh ngọt, trái cây, nước uống và nhân viên phục vụ cho hội thảo từ 30 đến 80 khách.', '3 giờ', 'TP.HCM', 9, 'Bánh ngọt và bánh mặn mini\nTrái cây theo mùa\nTrà, cà phê và nước suối\n2 nhân viên phục vụ và dụng cụ trang trí bàn', 'Phù hợp giờ giải lao giữa chương trình hội thảo, họp báo và buổi đào tạo. Thực đơn có thể điều chỉnh theo ngân sách và yêu cầu ăn chay. Chi phí tính theo trọn gói cho tối đa 50 khách, mỗi 10 khách thêm sẽ tính phụ thu.', '2026-10-27 07:48:08'),
(13, 'Gói bánh kem và tháp ly cho tiệc sự kiện', '/img/BanhvaSuKien.png', 4.9, 47, 950000, 'Trang trí sự kiện', 'Bánh kem thiết kế theo yêu cầu kèm bánh cupcake và tháp ly cho tiệc kỷ niệm.', 'Giao trong ngày', 'Nội thành TP.HCM', 2, 'Bánh kem 2 tầng trang trí theo chủ đề\n24 bánh cupcake\nDao, dĩa và nến kèm theo\nGiao tận nơi đúng giờ', 'Bánh được làm trong ngày từ nguyên liệu tươi, có thể chọn vị vani, socola hoặc trà xanh. Vui lòng đặt trước 3 ngày để kịp thiết kế mẫu bánh. Hỗ trợ viết chữ và in hình theo yêu cầu.', '2026-10-27 07:48:08'),
(14, 'Gói hoa cưới và cổng hoa lễ đính hôn', '/img/hoaCuoi.png', 4.8, 88, 4200000, 'Trang trí sự kiện', 'Hoa cầm tay cô dâu, cổng hoa và bàn lễ trang trí hoa tươi cho lễ đính hôn.', 'Lắp đặt 2 giờ', 'TP.HCM và Đồng Nai', 8, '1 bó hoa cầm tay cô dâu\nCổng hoa tươi 2m\nHoa trang trí bàn lễ và bàn gia tiên\n8 hoa cài áo cho gia đình hai bên', 'Hoa được chọn theo màu chủ đạo của lễ và cắm trước giờ lễ 2 tiếng. Có thể đổi sang hoa lụa nếu muốn giữ làm kỷ niệm. Giá có thể thay đổi nhẹ vào mùa cưới cao điểm.', '2026-10-27 07:48:08'),
(15, 'Gói MC song ngữ cho tiệc cuối năm', '/img/anhMC.png', 4.9, 59, 5500000, 'Nhân sự sự kiện', 'MC song ngữ Việt - Anh dẫn chương trình, xây dựng kịch bản và điều phối trò chơi.', '3 - 4 giờ', 'TP.HCM', 3, 'MC song ngữ Việt - Anh\nKịch bản chương trình chi tiết\nThiết kế 2 trò chơi giao lưu\nHọp online thống nhất nội dung trước sự kiện', 'Phù hợp tiệc tất niên doanh nghiệp có đối tác nước ngoài. MC làm việc cùng ban tổ chức để thống nhất nội dung, thời lượng từng phần và phong cách dẫn. Chi phí chưa gồm trang phục theo yêu cầu đặc biệt.', '2026-10-27 07:48:08'),
(16, 'Gói điều phối trọn gói tiệc tất niên công ty', '/img/endYear.png', 4.7, 41, 15000000, 'Trang trí sự kiện', 'Lên kịch bản, trang trí, điều phối nhân sự và chương trình cho tiệc tất niên đến 150 khách.', 'Trọn sự kiện', 'TP.HCM', 6, 'Tư vấn ý tưởng và lên kịch bản chương trình\nTrang trí sân khấu và khu vực check-in\nĐiều phối viên và nhân viên đón khách\nTrò chơi giao lưu và bốc thăm trúng thưởng', 'Một đầu mối phụ trách toàn bộ sự kiện từ ý tưởng đến thu dọn. Gói đã gồm đội ngũ điều phối nhưng chưa gồm chi phí địa điểm và ăn uống, bạn có thể ghép thêm với các gói tiệc trà hoặc buffet của đối tác khác.', '2026-10-27 07:48:08');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `specialties`
--

CREATE TABLE `specialties` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `specialties`
--

INSERT INTO `specialties` (`id`, `name`) VALUES
(4, 'Khai Trương'),
(1, 'Sinh Nhật'),
(5, 'Thôi Nôi'),
(2, 'Tiệc Cưới'),
(3, 'Year Party');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('user','partner','admin') NOT NULL DEFAULT 'user',
  `status` enum('active','locked') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `user`
--

INSERT INTO `user` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`) VALUES
(1, 'User', 'user@gmail.com', '$2b$12$k8df2weR/fKv9/lk.40A1OwV2eNSw1laoPizy3CvuBmSnSXDe4ZMO', NULL, NULL, 'user'),
(2, 'Bulee', 'bulee012@gmail.com', '$2b$12$sxsIbDy3WFmSq6rLHfznqOM.ZrjrmqdWI4b23Skv1W1iTrDb5DwUa', 'Bluee', '0123456789', 'user'),
(3, 'Nha', 'dnha012@gmail.com', '$2b$12$0YwmzAoQttnjJPQzFPqsaeghJmuAcSuIt2ldOe0lMEkzhiAO51ZTO', 'dao', '012345678', 'user'),
(4, 'nhadaoduy01123', 'nhadaoduy01123@gmail.com', '$2b$12$Ly4HI6/r8dhcUBRa8jAIi.BFUtO.vN7wnKSB8.CaKInn4RirPsUia', 'buleee', NULL, 'user');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `vouchers`
--

CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` int(11) NOT NULL,
  `min_order_value` int(11) NOT NULL DEFAULT 0,
  `max_discount_amount` int(11) DEFAULT NULL,
  `expired_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `customer_reviews_featured`
--
ALTER TABLE `customer_reviews_featured`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `partner_id` (`partner_id`),
  ADD KEY `voucher_id` (`voucher_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_order_status_created` (`status`,`created_at`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Chỉ mục cho bảng `partners`
--
ALTER TABLE `partners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_partner_status` (`status`);

--
-- Chỉ mục cho bảng `partner_payouts`
--
ALTER TABLE `partner_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Chỉ mục cho bảng `partner_schedules`
--
ALTER TABLE `partner_schedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_partner_busy_date` (`partner_id`,`busy_date`);

--
-- Chỉ mục cho bảng `partner_specialties`
--
ALTER TABLE `partner_specialties`
  ADD PRIMARY KEY (`partner_id`,`specialty_id`),
  ADD KEY `specialty_id` (`specialty_id`);

--
-- Chỉ mục cho bảng `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`);

--
-- Chỉ mục cho bảng `product_inclusions`
--
ALTER TABLE `product_inclusions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

-- Chỉ mục cho bảng phản ánh
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `handled_by` (`handled_by`),
  ADD KEY `idx_report_status_created` (`status`,`created_at`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `review_reports`
--
ALTER TABLE `review_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_id` (`review_id`),
  ADD KEY `reporter_id` (`reporter_id`);

--
-- Chỉ mục cho bảng `saved_products`
--
ALTER TABLE `saved_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_saved_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partner_id` (`partner_id`),
  ADD KEY `idx_service_status` (`status`);

--
-- Chỉ mục cho bảng `specialties`
--
ALTER TABLE `specialties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_role_status` (`role`,`status`);

--
-- Chỉ mục cho bảng `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `customer_reviews_featured`
--
ALTER TABLE `customer_reviews_featured`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `partners`
--
ALTER TABLE `partners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `partner_payouts`
--
ALTER TABLE `partner_payouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `partner_schedules`
--
ALTER TABLE `partner_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `product_inclusions`
--
ALTER TABLE `product_inclusions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- AUTO_INCREMENT cho bảng phản ánh
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `review_reports`
--
ALTER TABLE `review_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `saved_products`
--
ALTER TABLE `saved_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `specialties`
--
ALTER TABLE `specialties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `user` (`id`) ON DELETE SET NULL;

-- Ràng buộc cho chi tiết đơn hàng
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

-- Liên kết tài khoản đăng nhập với hồ sơ đối tác
ALTER TABLE `partners`
  ADD CONSTRAINT `partners_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `partner_payouts`
--
ALTER TABLE `partner_payouts`
  ADD CONSTRAINT `partner_payouts_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

--
-- Các ràng buộc cho bảng `partner_schedules`
--
ALTER TABLE `partner_schedules`
  ADD CONSTRAINT `partner_schedules_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `partner_specialties`
--
ALTER TABLE `partner_specialties`
  ADD CONSTRAINT `partner_specialties_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `partner_specialties_ibfk_2` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `product_inclusions`
--
ALTER TABLE `product_inclusions`
  ADD CONSTRAINT `product_inclusions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

-- Ràng buộc cho báo cáo/phản ánh
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`handled_by`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `review_reports`
--
ALTER TABLE `review_reports`
  ADD CONSTRAINT `review_reports_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_reports_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `saved_products`
--
ALTER TABLE `saved_products`
  ADD CONSTRAINT `saved_products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

-- Mỗi dịch vụ thuộc một đối tác
ALTER TABLE `services`
  ADD CONSTRAINT `services_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
