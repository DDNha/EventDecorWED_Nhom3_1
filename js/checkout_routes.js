const express = require('express');

// Dùng bảng `orders` và `order_items` có sẵn trong database event_decor
module.exports = function ({ pool, SERVICES, isAuthenticated }) {
  const router = express.Router();

  const STEPS = ['Đã đặt hàng', 'Hoàn thành'];
  const FEE_RATE = 0.05; // phải khớp với cart.html
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
          payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending')`,
        [req.session.user.id, name, phone, date, time, address, note,
          summary.subtotal, summary.total, METHODS[form.method]]
      );
      const orderId = result.insertId;

      const rows = summary.lines.map((l) => [orderId, l.service.id, l.qty, l.price]);
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
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
      if (orderRows.length) {
        [itemRows] = await pool.query(
          `SELECT oi.order_id, oi.product_id, oi.quantity, oi.price,
                  p.name AS title, p.img AS image, pt.name AS partner
           FROM order_items oi
           LEFT JOIN products p  ON p.id = oi.product_id
           LEFT JOIN partners pt ON pt.id = p.partner_id
           WHERE oi.order_id IN (?)`,
          [orderRows.map((o) => o.id)]
        );
      }

      const orders = orderRows.map((o) => {
        const time = o.event_time ? String(o.event_time).slice(0, 5) : '';
        return {
          id: o.id,
          createdAt: o.created_at,
          cancelled: o.status === 'cancelled',
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
        user: req.session.user
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Lỗi truy vấn database');
    }
  });

  // Nút demo: đánh dấu hoàn thành (xoá khi đã có trang cho đối tác/admin)
  router.post('/orders/:id/advance', isAuthenticated, async (req, res) => {
    try {
      await pool.query(
        "UPDATE orders SET status = 'completed' WHERE id = ? AND user_id = ? AND status = 'pending'",
        [req.params.id, req.session.user.id]
      );
    } catch (err) {
      console.error(err);
    }
    res.redirect('/orders');
  });

  return router;
};
