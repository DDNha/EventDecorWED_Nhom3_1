CREATE DATABASE  event_decor;

USE  event_decor;

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
(
    'PartyDesign VN',
    '/img/partners/partydesn.png',
    'Đối tác tin cậy của nhiều thương hiệu lớn như Acer, Vietcombank, Pepsico',
    'TP. Hồ Chí Minh',
    '0901234567',
    'contact@partydesign.com'
),
(
    'HoaBinh Events',
    '/img/partners/hoabinh.png',
    'Đơn vị tổ chức hội nghị, sự kiện và du lịch (MICE) quy mô lớn trên toàn quốc.',
    'TP. Hồ Chí Minh',
    '0912345678',
    'info@hoabinh-events.com'
),
(
    'Á Châu Event',
    '/img/partners/achauevent.png',
    'Mạnh về tổ chức teambuilding, tiệc cuối năm (YEP) và sự kiện doanh nghiệp.',
    'Bình Dương',
    '0923456789',
    'contact@achauevent.com'
);
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
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (partner_id)
        REFERENCES partners(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
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