const express = require('express');

// Dùng bảng `orders` và `order_items` có sẵn trong database event_decor
module.exports = function ({ pool, SERVICES, isAuthenticated }) {
  const router = express.Router();

  const STEPS = ['Đã đặt hàng', 'Hoàn thành'];
  const FEE_RATE = 0.05; // phải khớp với cart.html
  const COMMISSION_RATE = 10;
  const METHODS = {
    cod: 'Thanh toán khi nghiệm thu',
    bank: 'Chuyển khoản ngân hàng',
    card: 'Thẻ / Ví điện tử'
  };

  // Dựng giỏ hàng từ session nhưng lấy GIÁ từ SERVICES (không tin dữ liệu client)
  function buildLines(sessionCart) {
    const lines = [];
    for (const item of sessionCart || []) {
      const svc = SERVICES.find((s) => s.id === item.product_id);
      if (!svc) continue;
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const price = Number(svc.price);
      lines.push({ service: svc, qty, price, lineTotal: price * qty });
    }
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const fee = Math.round(subtotal * FEE_RATE);
    return { lines, subtotal, fee, total: subtotal + fee };
  }

  function renderCheckout(res, status, summary, form, error, user) {
    return res.status(status).render('cart_checkout.html', {
      ...summary, methods: METHODS, form, error, user
    });
  }

  // ---------- Trang xác nhận đơn gộp ----------
  router.get('/checkout', isAuthenticated, (req, res) => {
    const summary = buildLines(req.session.cart);
    if (!summary.lines.length) return res.redirect('/cart');

    // Điền sẵn họ tên và số điện thoại từ tài khoản
    const u = req.session.user;
    const form = { name: u.full_name || u.username, phone: u.phone || '' };
    renderCheckout(res, 200, summary, form, null, u);
  });

  // ---------- Tạo 1 đơn từ toàn bộ giỏ ----------
  router.post('/checkout', isAuthenticated, async (req, res) => {
    const summary = buildLines(req.session.cart);
    if (!summary.lines.length) return res.redirect('/cart');

    const form = req.body;
    const name = String(form.name || '').trim();
    const phone = String(form.phone || '').trim();
    const address = String(form.address || '').trim();
    const date = String(form.date || '').trim();
    const time = String(form.time || '').trim() || '00:00';
    const note = String(form.note || '').trim() || null;

    let error = null;
    if (!name || !phone || !address || !date) {
      error = 'Vui lòng nhập đầy đủ họ tên, số điện thoại, địa điểm và ngày tổ chức.';
    } else if (!/^[0-9+\s.-]{8,15}$/.test(phone)) {
      error = 'Số điện thoại không hợp lệ.';
    } else if (!METHODS[form.method]) {
      error = 'Vui lòng chọn phương thức thanh toán.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date) < new Date(new Date().toDateString())) {
      error = 'Ngày tổ chức không hợp lệ hoặc đã qua.';
    }
    if (error) return renderCheckout(res, 400, summary, form, error, req.session.user);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // total_amount = tạm tính, final_amount = tạm tính + phí dịch vụ 5%
      const [result] = await conn.query(
        `INSERT INTO orders
         (user_id, customer_name, customer_phone, event_date, event_time,
          event_location, note, total_amount, discount_amount, final_amount,
          payment_method, status, source_role, commission_rate, commission_amount, partner_payout)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending', 'customer', ?, ?, ?)`,
        [req.session.user.id, name, phone, date, time, address, note,
          summary.subtotal, summary.total, METHODS[form.method], COMMISSION_RATE,
          Math.round(summary.total * COMMISSION_RATE / 100),
          summary.total - Math.round(summary.total * COMMISSION_RATE / 100)]
      );
      const orderId = result.insertId;

      const rows = summary.lines.map((l) => [orderId, l.service.id, l.qty, l.price]);
      await conn.query(
        'INSERT INTO order_items (order_id, service_id, quantity, price) VALUES ?',
        [rows]
      );

      await conn.commit();

      req.session.cart = [];
      req.session.save(() => res.redirect('/orders?new=' + orderId));
    } catch (err) {
      await conn.rollback();
      console.error('Lỗi tạo đơn hàng:', err);
      renderCheckout(res, 500, summary, form,
        'Không thể tạo đơn hàng: ' + (err.sqlMessage || 'vui lòng thử lại.'),
        req.session.user);
    } finally {
      conn.release();
    }
  });

  // ---------- Lịch sử đơn hàng ----------
  router.get('/orders', isAuthenticated, async (req, res) => {
    try {
      const [orderRows] = await pool.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
        [req.session.user.id]
      );

      let itemRows = [];
      let reviewRows = [];
      if (orderRows.length) {
        const orderIds = orderRows.map((o) => o.id);
        [itemRows] = await pool.query(
          `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price,
                  p.name AS title, p.img AS image, pt.name AS partner
           FROM order_items oi
           LEFT JOIN products p  ON p.id = oi.product_id
           LEFT JOIN partners pt ON pt.id = p.partner_id
           WHERE oi.order_id IN (?)`,
          [orderIds]
        );
        [reviewRows] = await pool.query(
          `SELECT order_id, product_id, rating_stars, comment
           FROM reviews
           WHERE user_id = ? AND order_id IN (?)`,
          [req.session.user.id, orderIds]
        );
      }

      // Gắn đánh giá (nếu có) vào từng dịch vụ trong đơn
      for (const it of itemRows) {
        it.review = reviewRows.find(
          (r) => r.order_id === it.order_id && r.product_id === it.product_id
        ) || null;
      }

      const orders = orderRows.map((o) => {
        const time = o.event_time ? String(o.event_time).slice(0, 5) : '';
        return {
          id: o.id,
          createdAt: o.created_at,
          status: o.status,
          cancelled: o.status === 'cancelled',
          cancelReason: o.cancel_reason,
          step: o.status === 'completed' ? STEPS.length - 1 : 0,
          subtotal: o.total_amount,
          fee: o.final_amount - (o.total_amount - o.discount_amount),
          total: o.final_amount,
          method: o.payment_method,
          contactName: o.customer_name,
          phone: o.customer_phone,
          address: o.event_location,
          date: new Date(o.event_date).toLocaleDateString('vi-VN'),
          time: time && time !== '00:00' ? time : '',
          note: o.note,
          items: itemRows.filter((i) => i.order_id === o.id)
        };
      });

      res.render('orders.html', {
        orders,
        steps: STEPS,
        newId: parseInt(req.query.new, 10) || null,
        notice: req.query.notice || '',
        error: req.query.error || '',
        user: req.session.user
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi truy vấn database');
    }
  });

  function backToOrders(res, key, message) {
    res.redirect('/orders?' + key + '=' + encodeURIComponent(message));
  }

  // ---------- Khách hàng hủy đơn (chỉ khi đơn đang chờ duyệt) ----------
  router.post('/orders/:id/cancel', isAuthenticated, async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const reason = String(req.body.cancel_reason || '').trim();

    if (reason.length < 5 || reason.length > 500) {
      return backToOrders(res, 'error', 'Vui lòng nhập lý do hủy đơn (từ 5 đến 500 ký tự).');
    }

    try {
      const [result] = await pool.query(
        `UPDATE orders SET status = 'cancelled', cancel_reason = ?
         WHERE id = ? AND user_id = ? AND status = 'pending'`,
        [reason, orderId, req.session.user.id]
      );
      if (!result.affectedRows) {
        return backToOrders(res, 'error', `Không thể hủy đơn #${orderId}. Chỉ hủy được đơn đang chờ duyệt.`);
      }
      backToOrders(res, 'notice', `Đã hủy đơn hàng #${orderId}.`);
    } catch (err) {
      console.error('Lỗi hủy đơn hàng:', err);
      backToOrders(res, 'error', 'Không thể hủy đơn hàng lúc này. Vui lòng thử lại.');
    }
  });

  // ---------- Khách hàng đánh giá dịch vụ trong đơn đã hoàn thành ----------
  router.post('/orders/:id/review', isAuthenticated, async (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const productId = parseInt(req.body.product_id, 10);
    const stars = parseInt(req.body.rating_stars, 10);
    const comment = String(req.body.comment || '').trim() || null;
    const userId = req.session.user.id;

    if (!(stars >= 1 && stars <= 5)) {
      return backToOrders(res, 'error', 'Vui lòng chọn số sao từ 1 đến 5.');
    }
    if (comment && comment.length > 1000) {
      return backToOrders(res, 'error', 'Nhận xét tối đa 1000 ký tự.');
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Đơn phải của khách này, đã hoàn thành và có chứa dịch vụ được đánh giá
      const [[item]] = await conn.query(
        `SELECT oi.id
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.id = ? AND o.user_id = ? AND o.status = 'completed' AND oi.product_id = ?
         LIMIT 1`,
        [orderId, userId, productId]
      );
      if (!item) {
        await conn.rollback();
        return backToOrders(res, 'error', 'Chỉ đánh giá được dịch vụ trong đơn hàng đã hoàn thành.');
      }

      const [[existing]] = await conn.query(
        'SELECT id FROM reviews WHERE order_id = ? AND user_id = ? AND product_id = ? FOR UPDATE',
        [orderId, userId, productId]
      );
      if (existing) {
        await conn.rollback();
        return backToOrders(res, 'error', 'Bạn đã đánh giá dịch vụ này trong đơn hàng.');
      }

      await conn.query(
        `INSERT INTO reviews (order_id, user_id, product_id, rating_stars, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, userId, productId, stars, comment]
      );

      // Tính lại điểm trung bình và số lượt đánh giá của dịch vụ
      await conn.query(
        `UPDATE products p
         JOIN (SELECT product_id, ROUND(AVG(rating_stars), 1) AS avg_stars, COUNT(*) AS total
               FROM reviews WHERE product_id = ? GROUP BY product_id) r
           ON r.product_id = p.id
         SET p.rating = r.avg_stars, p.reviewsCount = r.total`,
        [productId]
      );

      await conn.commit();
      backToOrders(res, 'notice', 'Cảm ơn bạn đã đánh giá dịch vụ!');
    } catch (err) {
      await conn.rollback();
      console.error('Lỗi gửi đánh giá:', err);
      backToOrders(res, 'error', 'Không thể gửi đánh giá lúc này. Vui lòng thử lại.');
    } finally {
      conn.release();
    }
  });

  // Chỉ admin mới được cập nhật tiến độ; giữ route cũ để không làm hỏng giao diện khách hàng.
  router.post('/orders/:id/advance', isAuthenticated, async (req, res) => {
    res.redirect('/orders');
  });


  return router;
};
