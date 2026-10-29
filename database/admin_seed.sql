-- =============================================================
-- EVENTDECOR - DỮ LIỆU KIỂM THỬ MODULE ADMIN
-- Mật khẩu chung cho các tài khoản seed: Test@12345
-- Có thể chạy lại file này; dữ liệu seed cũ sẽ được làm mới.
-- =============================================================

START TRANSACTION;

-- 1. Tài khoản kiểm thử
INSERT INTO `user`
  (`username`, `email`, `password`, `full_name`, `phone`, `role`, `status`)
VALUES
  ('seed_admin', 'admin.seed@eventdecor.test', '$2b$12$yPRwpIw3GCQYxe.QTnbwYu/16dOnSTxq1xtcn7Kp78XSrS6qOiRKG', 'Admin Seed', '0901000001', 'admin', 'active'),
  ('seed_anna', 'anna.customer@eventdecor.test', '$2b$12$yPRwpIw3GCQYxe.QTnbwYu/16dOnSTxq1xtcn7Kp78XSrS6qOiRKG', 'Nguyễn Minh Anh', '0901000002', 'user', 'active'),
  ('seed_bao', 'bao.customer@eventdecor.test', '$2b$12$yPRwpIw3GCQYxe.QTnbwYu/16dOnSTxq1xtcn7Kp78XSrS6qOiRKG', 'Trần Quốc Bảo', '0901000003', 'user', 'active'),
  ('seed_locked', 'locked.customer@eventdecor.test', '$2b$12$yPRwpIw3GCQYxe.QTnbwYu/16dOnSTxq1xtcn7Kp78XSrS6qOiRKG', 'Khách Hàng Bị Khóa', '0901000004', 'user', 'locked'),
  ('seed_partner_party', 'party.partner@eventdecor.test', '$2b$12$yPRwpIw3GCQYxe.QTnbwYu/16dOnSTxq1xtcn7Kp78XSrS6qOiRKG', 'PartyDesign Seed', '0901000005', 'partner', 'active'),
  ('seed_partner_media', 'media.partner@eventdecor.test', '$2b$12$yPRwpIw3GCQYxe.QTnbwYu/16dOnSTxq1xtcn7Kp78XSrS6qOiRKG', 'King Media Seed', '0901000006', 'partner', 'active')
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `full_name` = VALUES(`full_name`),
  `phone` = VALUES(`phone`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`);

SET @admin_id := (SELECT id FROM `user` WHERE role = 'admin' ORDER BY id LIMIT 1);
SET @customer_anna := (SELECT id FROM `user` WHERE email = 'anna.customer@eventdecor.test' LIMIT 1);
SET @customer_bao := (SELECT id FROM `user` WHERE email = 'bao.customer@eventdecor.test' LIMIT 1);
SET @partner_party_user := (SELECT id FROM `user` WHERE email = 'party.partner@eventdecor.test' LIMIT 1);
SET @partner_media_user := (SELECT id FROM `user` WHERE email = 'media.partner@eventdecor.test' LIMIT 1);

-- 2. Hồ sơ đối tác liên kết với tài khoản
INSERT INTO partners
  (user_id, name, image, description, address, phone, email, status)
VALUES
  (@partner_party_user, 'PartyDesign Seed', '/img/partners/partydesn.png', 'Đối tác kiểm thử trang trí và tổ chức tiệc.', 'TP. Hồ Chí Minh', '0901000005', 'party.partner@eventdecor.test', 'active'),
  (@partner_media_user, 'King Media Seed', '/img/kingMedia.png', 'Đối tác kiểm thử quay phim và truyền thông.', 'TP. Hồ Chí Minh', '0901000006', 'media.partner@eventdecor.test', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), image = VALUES(image), description = VALUES(description),
  address = VALUES(address), phone = VALUES(phone), email = VALUES(email), status = 'active';

SET @partner_party := (SELECT id FROM partners WHERE user_id = @partner_party_user LIMIT 1);
SET @partner_media := (SELECT id FROM partners WHERE user_id = @partner_media_user LIMIT 1);
SET @service_id := (SELECT id FROM products ORDER BY id LIMIT 1);

-- 3. Xóa riêng dữ liệu seed cũ để chạy lại không bị trùng
DELETE oi
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.note LIKE '[ADMIN-SEED:%';

DELETE FROM reports WHERE subject LIKE '[SEED]%';
DELETE FROM orders WHERE note LIKE '[ADMIN-SEED:%';

-- 4. Đơn hàng ở đủ trạng thái và trải qua nhiều tháng
INSERT INTO orders
  (user_id, partner_id, source_role, customer_name, customer_phone, service_name,
   event_date, event_time, event_location, note, total_amount, discount_amount,
   final_amount, payment_method, status, commission_rate, commission_amount,
   partner_payout, admin_note, approved_by, approved_at, created_at)
VALUES
  (NULL, @partner_party, 'partner', 'Công ty Ánh Dương', '0912000001', 'Year End Party 150 khách',
   DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), '18:00:00', 'Quận 1, TP.HCM', '[ADMIN-SEED:O01] Đơn đối tác mới cần duyệt',
   18000000, 0, 18000000, 'Chuyển khoản', 'pending', 10, 1800000, 16200000, NULL, NULL, NULL, NOW()),

  (NULL, @partner_media, 'partner', 'Cửa hàng Lumi', '0912000002', 'Quay phim khai trương',
   DATE_ADD(CURRENT_DATE, INTERVAL 20 DAY), '08:00:00', 'Thủ Đức, TP.HCM', '[ADMIN-SEED:O02] Đơn quay phim đang chờ admin',
   32000000, 2000000, 30000000, 'Chuyển khoản', 'pending', 10, 3000000, 27000000, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),

  (@customer_anna, @partner_party, 'customer', 'Nguyễn Minh Anh', '0901000002', 'Trang trí sinh nhật',
   DATE_ADD(CURRENT_DATE, INTERVAL 14 DAY), '17:30:00', 'Quận 7, TP.HCM', '[ADMIN-SEED:O03] Đơn khách hàng chờ duyệt',
   8500000, 0, 8500000, 'Ví điện tử', 'pending', 10, 850000, 7650000, NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),

  (@customer_bao, @partner_party, 'customer', 'Trần Quốc Bảo', '0901000003', 'Trang trí tiệc cưới',
   DATE_ADD(CURRENT_DATE, INTERVAL 45 DAY), '10:00:00', 'Quận 3, TP.HCM', '[ADMIN-SEED:O04] Đơn đã duyệt tháng này',
   25000000, 0, 25000000, 'Chuyển khoản', 'approved', 10, 2500000, 22500000, 'Thông tin hợp lệ, đã duyệt.', @admin_id, NOW(), DATE_SUB(NOW(), INTERVAL 4 DAY)),

  (@customer_anna, @partner_media, 'customer', 'Nguyễn Minh Anh', '0901000002', 'Quay phim sự kiện doanh nghiệp',
   DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), '09:00:00', 'Bình Thạnh, TP.HCM', '[ADMIN-SEED:O05] Đơn đang thực hiện',
   42000000, 0, 42000000, 'Chuyển khoản', 'processing', 10, 4200000, 37800000, 'Đối tác đang chuẩn bị thiết bị.', @admin_id, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 MONTH)),

  (@customer_bao, @partner_party, 'customer', 'Trần Quốc Bảo', '0901000003', 'Tiệc sinh nhật trọn gói',
   DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), '18:30:00', 'Gò Vấp, TP.HCM', '[ADMIN-SEED:O06] Hoàn thành tháng này',
   15000000, 0, 15000000, 'Tiền mặt', 'completed', 10, 1500000, 13500000, 'Đã nghiệm thu.', @admin_id, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),

  (@customer_anna, @partner_media, 'customer', 'Nguyễn Minh Anh', '0901000002', 'Chụp ảnh hội nghị',
   DATE_SUB(CURRENT_DATE, INTERVAL 35 DAY), '08:30:00', 'Quận 1, TP.HCM', '[ADMIN-SEED:O07] Hoàn thành tháng trước',
   28000000, 0, 28000000, 'Chuyển khoản', 'completed', 10, 2800000, 25200000, 'Đã bàn giao hình ảnh.', @admin_id, DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_SUB(NOW(), INTERVAL 1 MONTH)),

  (@customer_bao, @partner_party, 'customer', 'Trần Quốc Bảo', '0901000003', 'Khai trương showroom',
   DATE_SUB(CURRENT_DATE, INTERVAL 65 DAY), '07:30:00', 'Tân Bình, TP.HCM', '[ADMIN-SEED:O08] Hoàn thành hai tháng trước',
   36000000, 0, 36000000, 'Chuyển khoản', 'completed', 10, 3600000, 32400000, 'Hoàn tất đối soát.', @admin_id, DATE_SUB(NOW(), INTERVAL 2 MONTH), DATE_SUB(NOW(), INTERVAL 2 MONTH)),

  (@customer_anna, @partner_media, 'customer', 'Nguyễn Minh Anh', '0901000002', 'Quay phim lễ kỷ niệm',
   DATE_SUB(CURRENT_DATE, INTERVAL 95 DAY), '17:00:00', 'Quận 5, TP.HCM', '[ADMIN-SEED:O09] Hoàn thành ba tháng trước',
   19500000, 0, 19500000, 'Ví điện tử', 'completed', 10, 1950000, 17550000, 'Đã thanh toán đối tác.', @admin_id, DATE_SUB(NOW(), INTERVAL 3 MONTH), DATE_SUB(NOW(), INTERVAL 3 MONTH)),

  (@customer_bao, @partner_party, 'customer', 'Trần Quốc Bảo', '0901000003', 'Gala dinner doanh nghiệp',
   DATE_ADD(CURRENT_DATE, INTERVAL 60 DAY), '18:00:00', 'Quận 2, TP.HCM', '[ADMIN-SEED:O10] Đã duyệt bốn tháng trước',
   54000000, 0, 54000000, 'Chuyển khoản', 'approved', 10, 5400000, 48600000, 'Đã duyệt kế hoạch.', @admin_id, DATE_SUB(NOW(), INTERVAL 4 MONTH), DATE_SUB(NOW(), INTERVAL 4 MONTH)),

  (NULL, @partner_media, 'partner', 'Studio Mộc', '0912000011', 'Video quảng bá',
   DATE_ADD(CURRENT_DATE, INTERVAL 8 DAY), '09:00:00', 'Quận 10, TP.HCM', '[ADMIN-SEED:O11] Đơn bị từ chối',
   12000000, 0, 12000000, 'Chuyển khoản', 'rejected', 10, 1200000, 10800000, 'Thiếu thông tin khách hàng.', @admin_id, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),

  (@customer_anna, @partner_party, 'customer', 'Nguyễn Minh Anh', '0901000002', 'Trang trí lễ đính hôn',
   DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), '09:30:00', 'Quận 6, TP.HCM', '[ADMIN-SEED:O12] Đơn đã hủy',
   9000000, 0, 9000000, 'Tiền mặt', 'cancelled', 10, 900000, 8100000, 'Khách hàng yêu cầu hủy.', @admin_id, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY));

-- Mỗi đơn có một dịch vụ để kiểm thử chi tiết và liên kết đối tác.
INSERT INTO order_items (order_id, service_id, quantity, price)
SELECT id, @service_id, 1, total_amount
FROM orders
WHERE note LIKE '[ADMIN-SEED:%' AND @service_id IS NOT NULL;

SET @seed_order_pending := (SELECT id FROM orders WHERE note LIKE '[ADMIN-SEED:O01]%' LIMIT 1);
SET @seed_order_done := (SELECT id FROM orders WHERE note LIKE '[ADMIN-SEED:O06]%' LIMIT 1);

-- 5. Báo cáo/phản ánh ở đủ trạng thái
INSERT INTO reports
  (reporter_id, reporter_role, order_id, subject, category, content, priority,
   status, admin_response, handled_by, created_at)
VALUES
  (@customer_anna, 'user', @seed_order_pending, '[SEED] Đơn hàng chờ duyệt quá lâu', 'Đơn hàng', 'Tôi muốn biết khi nào đơn hàng được xác nhận.', 'high', 'open', NULL, NULL, NOW()),
  (@partner_party_user, 'partner', @seed_order_pending, '[SEED] Cần bổ sung thông tin đơn đối tác', 'Đơn hàng', 'Đối tác cần admin xác nhận thông tin địa điểm.', 'normal', 'open', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (@customer_bao, 'user', NULL, '[SEED] Không cập nhật được số điện thoại', 'Tài khoản', 'Trang hồ sơ báo lỗi khi cập nhật số điện thoại.', 'normal', 'in_progress', 'Bộ phận kỹ thuật đang kiểm tra.', @admin_id, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (@partner_media_user, 'partner', @seed_order_done, '[SEED] Thắc mắc về hoa hồng', 'Thanh toán / hoa hồng', 'Số tiền đối soát chưa khớp với báo cáo của đối tác.', 'high', 'in_progress', 'Đang đối chiếu giao dịch với kế toán.', @admin_id, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@customer_anna, 'user', @seed_order_done, '[SEED] Đánh giá chất lượng dịch vụ', 'Chất lượng dịch vụ', 'Dịch vụ hoàn thành tốt, cần hướng dẫn gửi đánh giá.', 'low', 'resolved', 'Đã gửi hướng dẫn đánh giá qua email.', @admin_id, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (@partner_party_user, 'partner', NULL, '[SEED] Yêu cầu không thuộc phạm vi hỗ trợ', 'Khác', 'Nội dung dùng để kiểm thử trạng thái từ chối.', 'normal', 'rejected', 'Yêu cầu không thuộc phạm vi xử lý của nền tảng.', @admin_id, DATE_SUB(NOW(), INTERVAL 10 DAY));

COMMIT;

-- Tài khoản test:
-- admin.seed@eventdecor.test / Test@12345
-- anna.customer@eventdecor.test / Test@12345
-- party.partner@eventdecor.test / Test@12345

