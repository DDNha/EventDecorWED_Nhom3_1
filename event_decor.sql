CREATE DATABASE event_decor;

USE  event_decor;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 27, 2026 lúc 05:44 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- 1. USERS
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL unique,
    email varchar(100) not null,
    password VARCHAR(255) NOT NULL
);

insert into users(username, email, password) value ('User', 'user@gmail.com', 'user');
-- =====================================================
-- 2. PARTNERS
-- =====================================================
CREATE TABLE partners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    image VARCHAR(255),
    description TEXT,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT INTO partners
(name, image, description, address, phone, email)
VALUES
('Á châu Event', '/img/partners/achauevent.png', 'Chuyên hoa tươi và phụ kiện hoa cho sự kiện nhỏ.', 'TP. Hồ Chí Minh', '0934567890', 'hoa@hoatuoi.com'),
('Hoà Bình', '/img/partners/hoabinh.png', 'Bánh kem, bánh ngọt và tiệc nhẹ giao tận nơi.', 'TP. Hồ Chí Minh', '0945678901', 'info@banhtiec.com'),
('Party Design', '/img/partners/partydesn.png', 'Cung cấp MC và nhân sự dẫn chương trình chuyên nghiệp.', 'TP. Hồ Chí Minh', '0956789012', 'mc@nhansusukien.com'),
('Vietlink Event', '/img/partners/vietlink.png', 'Trang trí sinh nhật cho trẻ em và gia đình theo chủ đề.', 'TP. Hồ Chí Minh', '0967890123', 'hello@sinhnhatdecor.com'),
('Studio Ảnh & Phim Sự Kiện', '/img/partners/studio.png', 'Chụp ảnh, quay phim và flycam cho sự kiện.', 'TP. Hồ Chí Minh', '0978901234', 'studio@anhphim.com'),
('Âm Thanh Ánh Sáng Sài Gòn', '/img/partners/amthanh.png', 'Cho thuê sân khấu, âm thanh, ánh sáng và màn hình LED.', 'TP. Hồ Chí Minh', '0989012345', 'sale@amthanhsg.com');
-- =====================================================
-- 3. SPECIALTIES
-- =====================================================
CREATE TABLE specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
)ENGINE=InnoDB;
INSERT INTO specialties (name)
VALUES
('Sinh Nhật'),
('Tiệc Cưới'),
('Year Party'),
('Khai Trương'),
('Thôi Nôi');
-- =====================================================
-- 4. PARTNER_SPECIALTIES
-- =====================================================
CREATE TABLE partner_specialties (
    partner_id INT NOT NULL,
    specialty_id INT NOT NULL,

    PRIMARY KEY (partner_id, specialty_id),

    FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE,

    FOREIGN KEY (specialty_id)
        REFERENCES specialties(id)
        ON DELETE CASCADE
)ENGINE=InnoDB;
INSERT INTO partner_specialties (partner_id, specialty_id)
VALUES
(1, 1), 
(1, 3), 
(1, 5),
(2, 2), 
(2, 4),
(3, 3),
(3, 4);
-- =====================================================
-- 5. PRODUCTS
-- =====================================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL DEFAULT 0,
    img VARCHAR(255),
    rating DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    reviewsCount INT NOT NULL DEFAULT 0,
    executionTime VARCHAR(100),
    location VARCHAR(255),
    category VARCHAR(100),         
    short_desc VARCHAR(500),        
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 
    INDEX idx_products_category (category),
 
    FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
INSERT INTO products
(id, partner_id, name, price, img, rating, reviewsCount, executionTime, location, category, short_desc, description, created_at)
VALUES
(1, 4, 'Gói trang trí sinh nhật cao cấp', 1500000, '/img/birthday.png', 4.6, 125, '3 - 4 giờ', 'TP.HCM', 'Trang trí sự kiện', 'Trang trí sinh nhật sang trọng với bóng, hoa và phông nền theo yêu cầu.', 'Gói trang trí sinh nhật cao cấp dành cho tiệc gia đình và bạn bè. Đội ngũ tư vấn màu sắc, lắp đặt trước giờ tiệc và thu dọn sau khi kết thúc.', '2026-10-27 07:48:08'),
(2, 2, 'Gói làm bánh & tiệc cho sự kiện', 800000, '/img/BanhvaSuKien.png', 4.9, 14, 'Giao trong ngày', 'Nội thành TP.HCM', 'Trang trí sự kiện', 'Bánh kem, bánh ngọt và tiệc nhẹ cho sự kiện nhỏ.', 'Gói bánh và tiệc nhẹ phù hợp sinh nhật, họp mặt và lễ kỷ niệm. Vui lòng đặt trước 2 ngày để kịp chuẩn bị.', '2026-10-27 07:48:08'),
(3, 3, 'Gói MC chuyên nghiệp', 3000000, '/img/anhMC.png', 4.6, 125, '3 giờ', 'TP.HCM', 'Nhân sự sự kiện', 'MC dẫn chương trình có kinh nghiệm cho tiệc và hội nghị.', 'MC làm việc cùng ban tổ chức để thống nhất kịch bản, thời lượng và phong cách dẫn phù hợp từng sự kiện.', '2026-10-27 07:48:08'),
(4, 1, 'Gói trang trí tiệc cuối năm', 4000000, '/img/endYear.png', 4.6, 125, '5 giờ', 'TP.HCM', 'Trang trí sự kiện', 'Trang trí sân khấu và không gian cho tiệc tất niên.', 'Gói trang trí không gian tiệc cuối năm cho công ty, bao gồm lắp đặt và thu dọn sau sự kiện.', '2026-10-27 07:48:08'),
(5, 5, 'Gói chụp ảnh & quay phim sự kiện', 2000000, '/img/quayPhim.png', 4.6, 125, '4 giờ', 'TP.HCM', 'Nhân sự sự kiện', 'Chụp ảnh và quay phim ghi lại các khoảnh khắc của sự kiện.', 'Ghi lại toàn bộ khoảnh khắc chính của sự kiện, bàn giao ảnh và video trong vài ngày làm việc.', '2026-10-27 07:48:08'),
(6, 1, 'Gói & phụ kiện hoa cho sự kiện', 300000, '/img/hoaCuoi.png', 4.6, 125, '1 - 2 giờ', 'TP.HCM', 'Trang trí sự kiện', 'Hoa tươi và phụ kiện hoa cho sự kiện nhỏ.', 'Gói hoa cơ bản cho lễ đính hôn, sinh nhật và các sự kiện nhỏ. Hoa được chọn theo mùa.', '2026-10-27 07:48:08'),
(7, 4, 'Gói trang trí sinh nhật thiếu nhi theo chủ đề', 2200000, '/img/birthday.png', 4.8, 96, '3 - 4 giờ', 'TP.HCM và các quận lân cận', 'Trang trí sự kiện', 'Trang trí tiệc sinh nhật cho bé với bóng bay, phông nền và góc chụp ảnh theo chủ đề yêu thích.', 'Gói dành cho tiệc sinh nhật bé từ 1 đến 12 tuổi. Đội ngũ tư vấn chủ đề cùng gia đình, lắp đặt trước giờ tiệc 2 tiếng và thu dọn sau khi kết thúc. Có thể thêm bóng bay hiệu ứng, thú nhún hoặc hoạt náo viên với chi phí riêng.', '2026-10-27 07:48:08'),
(8, 5, 'Gói chụp ảnh sự kiện trọn buổi', 3500000, '/img/quayPhim.png', 4.7, 82, '4 giờ', 'TP.HCM', 'Nhân sự sự kiện', 'Nhiếp ảnh gia chụp toàn bộ sự kiện, bàn giao ảnh đã chỉnh màu trong 3 ngày.', 'Phù hợp cho lễ kỷ niệm, hội nghị khách hàng và tiệc công ty. Nhiếp ảnh gia đến sớm 30 phút để khảo sát ánh sáng, chụp các khoảnh khắc chính và ảnh nhóm. Ảnh được bàn giao trong vòng 3 ngày làm việc.', '2026-10-27 07:48:08'),
(9, 5, 'Gói quay phim và flycam sự kiện', 6500000, '/img/quayPhim.png', 4.9, 54, '5 giờ', 'TP.HCM và Bình Dương', 'Nhân sự sự kiện', 'Quay phim đa góc máy kèm flycam, dựng video tổng hợp 3 - 5 phút.', 'Gói quay phim chuyên nghiệp cho sự kiện quy mô vừa và lớn. Flycam chỉ hoạt động khi điều kiện thời tiết và địa điểm cho phép bay. Thời gian bàn giao video dựng là 7 ngày làm việc.', '2026-10-27 07:48:08'),
(10, 6, 'Gói âm thanh ánh sáng cho sự kiện 100 khách', 4800000, '/img/hero-img.png', 4.6, 71, '6 giờ', 'TP.HCM', 'Âm thanh - Ánh sáng', 'Hệ thống loa, mixer, micro không dây và đèn sân khấu cho sự kiện trong nhà đến 100 khách.', 'Thiết bị được lắp đặt và chạy thử trước giờ bắt đầu 1 giờ. Gói phù hợp tiệc công ty, họp mặt và lễ kỷ niệm trong nhà. Sự kiện ngoài trời hoặc trên 100 khách vui lòng chọn gói âm thanh ánh sáng nâng cao.', '2026-10-27 07:48:08'),
(11, 6, 'Gói sân khấu và màn hình LED ngoài trời', 12000000, '/img/hero-img.png', 4.8, 38, '8 giờ', 'TP.HCM và các tỉnh lân cận', 'Âm thanh - Ánh sáng', 'Sân khấu 6x4m, màn hình LED P3 và hệ thống âm thanh công suất lớn cho sự kiện ngoài trời.', 'Gói trọn bộ cho lễ khai trương, hội chợ và chương trình ca nhạc ngoài trời. Giá chưa gồm giấy phép tổ chức và máy phát điện dự phòng. Báo trước ít nhất 5 ngày để chuẩn bị thiết bị.', '2026-10-27 07:48:08'),
(12, 6, 'Gói tiệc trà và buffet nhẹ cho hội thảo', 1800000, '/img/BanhvaSuKien.png', 4.7, 63, '3 giờ', 'TP.HCM', 'Nhân sự sự kiện', 'Bánh ngọt, trái cây, nước uống và nhân viên phục vụ cho hội thảo từ 30 đến 80 khách.', 'Phù hợp giờ giải lao giữa chương trình hội thảo, họp báo và buổi đào tạo. Thực đơn có thể điều chỉnh theo ngân sách và yêu cầu ăn chay. Chi phí tính theo trọn gói cho tối đa 50 khách, mỗi 10 khách thêm sẽ tính phụ thu.', '2026-10-27 07:48:08'),
(13, 2, 'Gói bánh kem và tháp ly cho tiệc sự kiện', 950000, '/img/BanhvaSuKien.png', 4.9, 47, 'Giao trong ngày', 'Nội thành TP.HCM', 'Trang trí sự kiện', 'Bánh kem thiết kế theo yêu cầu kèm bánh cupcake và tháp ly cho tiệc kỷ niệm.', 'Bánh được làm trong ngày từ nguyên liệu tươi, có thể chọn vị vani, socola hoặc trà xanh. Vui lòng đặt trước 3 ngày để kịp thiết kế mẫu bánh. Hỗ trợ viết chữ và in hình theo yêu cầu.', '2026-10-27 07:48:08'),
(14, 1, 'Gói hoa cưới và cổng hoa lễ đính hôn', 4200000, '/img/hoaCuoi.png', 4.8, 88, 'Lắp đặt 2 giờ', 'TP.HCM và Đồng Nai', 'Trang trí sự kiện', 'Hoa cầm tay cô dâu, cổng hoa và bàn lễ trang trí hoa tươi cho lễ đính hôn.', 'Hoa được chọn theo màu chủ đạo của lễ và cắm trước giờ lễ 2 tiếng. Có thể đổi sang hoa lụa nếu muốn giữ làm kỷ niệm. Giá có thể thay đổi nhẹ vào mùa cưới cao điểm.', '2026-10-27 07:48:08'),
(15, 3, 'Gói MC song ngữ cho tiệc cuối năm', 5500000, '/img/anhMC.png', 4.9, 59, '3 - 4 giờ', 'TP.HCM', 'Nhân sự sự kiện', 'MC song ngữ Việt - Anh dẫn chương trình, xây dựng kịch bản và điều phối trò chơi.', 'Phù hợp tiệc tất niên doanh nghiệp có đối tác nước ngoài. MC làm việc cùng ban tổ chức để thống nhất nội dung, thời lượng từng phần và phong cách dẫn. Chi phí chưa gồm trang phục theo yêu cầu đặc biệt.', '2026-10-27 07:48:08'),
(16, 6, 'Gói điều phối trọn gói tiệc tất niên công ty', 15000000, '/img/endYear.png', 4.7, 41, 'Trọn sự kiện', 'TP.HCM', 'Trang trí sự kiện', 'Lên kịch bản, trang trí, điều phối nhân sự và chương trình cho tiệc tất niên đến 150 khách.', 'Một đầu mối phụ trách toàn bộ sự kiện từ ý tưởng đến thu dọn. Gói đã gồm đội ngũ điều phối nhưng chưa gồm chi phí địa điểm và ăn uống, bạn có thể ghép thêm với các gói tiệc trà hoặc buffet của đối tác khác.', '2026-10-27 07:48:08');
-- =====================================================
-- 6. PRODUCT_INCLUSIONS
-- =====================================================
CREATE TABLE product_inclusions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    item_text VARCHAR(255) NOT NULL,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
-- =====================================================
-- 7. PARTNER_SCHEDULES
-- =====================================================
CREATE TABLE partner_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    busy_date DATE NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_partner_busy_date (partner_id, busy_date),

    FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
-- =====================================================
-- 8. PARTNER_PAYOUTS
-- =====================================================
CREATE TABLE partner_payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partner_id INT NOT NULL,
    amount INT NOT NULL DEFAULT 0,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_name VARCHAR(100),
    status ENUM(
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;
-- =====================================================
-- 9. VOUCHERS
-- =====================================================
CREATE TABLE vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value INT NOT NULL,
    min_order_value INT NOT NULL DEFAULT 0,
    max_discount_amount INT NULL,
    expired_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
-- =====================================================
-- 10. ORDERS
-- =====================================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    voucher_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    note TEXT,
    total_amount INT NOT NULL DEFAULT 0,
    discount_amount INT NOT NULL DEFAULT 0,
    final_amount INT NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    status ENUM(
        'pending',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (voucher_id)
        REFERENCES vouchers(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;
-- =====================================================
-- 11. ORDER_ITEMS
-- =====================================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price INT NOT NULL DEFAULT 0,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;
-- =====================================================
-- 12. PAYMENTS
-- =====================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount INT NOT NULL DEFAULT 0,
    transaction_code VARCHAR(100),
    status ENUM(
        'pending',
        'success',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB;
-- =====================================================
-- 13. SAVED_PRODUCTS
-- Sản phẩm khách hàng yêu thích/lưu lại
-- =====================================================
CREATE TABLE saved_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_saved_user_product (user_id, product_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
-- =====================================================
-- 14. REVIEWS
-- =====================================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating_stars INT NOT NULL,
    comment TEXT,
    partner_reply TEXT,
    replied_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_review_rating
        CHECK (rating_stars BETWEEN 1 AND 5),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
-- =====================================================
-- 15. REVIEW_REPORTS
-- Báo cáo đánh giá vi phạm
-- =====================================================
CREATE TABLE review_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    reporter_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM(
        'pending',
        'approved',
        'rejected'
    ) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (review_id)
        REFERENCES reviews(id)
        ON DELETE CASCADE,

    FOREIGN KEY (reporter_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
-- =====================================================
-- 16. CONTACTS
-- Form liên hệ
-- =====================================================
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
-- =====================================================
-- 17. CUSTOMER_REVIEWS_FEATURED
-- Đánh giá nổi bật hiển thị trên giao diện
-- =====================================================
CREATE TABLE customer_reviews_featured (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_avatar VARCHAR(255),
    feedback_text TEXT NOT NULL,
    rating_stars INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (rating_stars BETWEEN 1 AND 5)
) ENGINE=InnoDB;