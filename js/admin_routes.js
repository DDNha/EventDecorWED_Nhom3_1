const express = require('express');

const ORDER_STATUSES = ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'];
const REPORT_STATUSES = ['open', 'in_progress', 'resolved', 'rejected'];

const orderStatusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  processing: 'Đang thực hiện',
  completed: 'Hoàn thành',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy'
};

const reportStatusLabels = {
  open: 'Mới tiếp nhận',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  rejected: 'Từ chối'
};

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
const dateTime = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—';

module.exports = function createAdminRoutes({ pool }) {
  const router = express.Router();

  function isAjax(req) {
    return req.get('x-requested-with') === 'XMLHttpRequest';
  }

  function actionSuccess(req, res, message, redirect, data = {}) {
    if (isAjax(req)) return res.json({ ok: true, message, data });
    return res.redirect(`${redirect}?notice=${encodeURIComponent(message)}`);
  }

  function actionError(req, res, status, message) {
    if (isAjax(req)) return res.status(status).json({ ok: false, message });
    return res.status(status).send(message);
  }

  function requireRole(role) {
    return (req, res, next) => {
      if (!req.session.user) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
      if (req.session.user.role !== role) return res.status(403).send('Bạn không có quyền truy cập trang này.');
      next();
    };
  }

  const requireAdmin = requireRole('admin');
  const requirePartner = requireRole('partner');

  router.use('/admin', requireAdmin);

  router.get('/admin', async (req, res, next) => {
    try {
      const [[users]] = await pool.query(`
        SELECT COUNT(*) AS total,
               SUM(role = 'user') AS customers,
               SUM(role = 'partner') AS partners,
               SUM(status = 'locked') AS locked_count
        FROM \`user\``);
      const [[orders]] = await pool.query(`
        SELECT COUNT(*) AS total,
               SUM(status = 'pending') AS pending_count,
               COALESCE(SUM(CASE WHEN status IN ('approved','processing','completed') THEN final_amount ELSE 0 END), 0) AS revenue,
               COALESCE(SUM(CASE WHEN status IN ('approved','processing','completed') THEN commission_amount ELSE 0 END), 0) AS commission
        FROM orders`);
      const [[reports]] = await pool.query("SELECT COUNT(*) AS total, SUM(status IN ('open','in_progress')) AS open_count FROM reports");
      const [monthlyRows] = await pool.query(`
        SELECT DATE_FORMAT(MIN(created_at), '%m/%Y') AS label,
               SUM(final_amount) AS revenue,
               SUM(commission_amount) AS commission
        FROM orders
        WHERE status IN ('approved','processing','completed')
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at), MONTH(created_at)`);
      const [recentRows] = await pool.query(`
        SELECT o.id, o.customer_name, o.final_amount, o.status, o.created_at,
               COALESCE(p.name, (
                 SELECT GROUP_CONCAT(DISTINCT pi.name SEPARATOR ', ')
                 FROM order_items oi
                 JOIN products s ON s.id = oi.service_id
                 JOIN partners pi ON pi.id = s.partner_id
                 WHERE oi.order_id = o.id
               ), 'Chưa gán') AS partner_name
        FROM orders o
        LEFT JOIN partners p ON p.id = o.partner_id
        ORDER BY o.created_at DESC
        LIMIT 6`);

      const maxRevenue = Math.max(1, ...monthlyRows.map((row) => Number(row.revenue)));
      const monthly = monthlyRows.map((row) => ({
        ...row,
        revenue_text: money(row.revenue),
        commission_text: money(row.commission),
        percent: Math.max(4, Math.round(Number(row.revenue) / maxRevenue * 100))
      }));
      const recentOrders = recentRows.map((row) => ({
        ...row,
        amount_text: money(row.final_amount),
        status_label: orderStatusLabels[row.status] || row.status,
        created_text: dateTime(row.created_at)
      }));

      res.render('admin/dashboard.html', {
        admin: req.session.user,
        active: 'dashboard',
        stats: {
          users: Number(users.total || 0),
          partners: Number(users.partners || 0),
          pending_orders: Number(orders.pending_count || 0),
          open_reports: Number(reports.open_count || 0),
          revenue: money(orders.revenue),
          commission: money(orders.commission)
        },
        monthly,
        recentOrders
      });
    } catch (error) { next(error); }
  });

  router.get(['/admin/users', '/admin/manager-customer'], async (req, res, next) => {
    const search = String(req.query.search || '').trim();
    const role = ['user', 'partner', 'admin'].includes(req.query.role) ? req.query.role : '';
    const status = ['active', 'locked'].includes(req.query.status) ? req.query.status : '';
    try {
      const clauses = [];
      const params = [];
      if (search) {
        clauses.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.username LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }
      if (role) { clauses.push('u.role = ?'); params.push(role); }
      if (status) { clauses.push('u.status = ?'); params.push(status); }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const [rows] = await pool.query(`
        SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.status, u.created_at,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.final_amount ELSE 0 END), 0) AS total_spent
        FROM \`user\` u
        LEFT JOIN orders o ON o.user_id = u.id
        ${where}
        GROUP BY u.id
        ORDER BY u.created_at DESC`, params);
      const [[summary]] = await pool.query(`
        SELECT COUNT(*) AS total, SUM(status = 'active') AS active_count,
               SUM(status = 'locked') AS locked_count, SUM(role = 'partner') AS partner_count
        FROM \`user\``);

      res.render('admin/users.html', {
        admin: req.session.user,
        active: 'users',
        filters: { search, role, status },
        summary,
        users: rows.map((row) => ({
          ...row,
          created_text: date(row.created_at),
          spent_text: money(row.total_spent),
          role_label: row.role === 'admin' ? 'Quản trị viên' : row.role === 'partner' ? 'Đối tác' : 'Khách hàng'
        })),
        notice: req.query.notice || ''
      });
    } catch (error) { next(error); }
  });

  router.post('/admin/users/:id/status', async (req, res, next) => {
    const status = req.body.status;
    if (!['active', 'locked'].includes(status)) return actionError(req, res, 400, 'Trạng thái không hợp lệ.');
    if (Number(req.params.id) === Number(req.session.user.id) && status === 'locked') {
      return actionError(req, res, 400, 'Không thể tự khóa tài khoản đang đăng nhập.');
    }
    try {
      const [result] = await pool.query('UPDATE `user` SET status = ? WHERE id = ?', [status, req.params.id]);
      if (!result.affectedRows) return actionError(req, res, 404, 'Không tìm thấy tài khoản.');
      return actionSuccess(req, res, 'Đã cập nhật trạng thái tài khoản.', '/admin/users', { status });
    } catch (error) { next(error); }
  });

  router.post('/admin/users/:id/role', async (req, res, next) => {
    const role = req.body.role;
    if (!['user', 'partner', 'admin'].includes(role)) return actionError(req, res, 400, 'Vai trò không hợp lệ.');
    if (Number(req.params.id) === Number(req.session.user.id) && role !== 'admin') {
      return actionError(req, res, 400, 'Không thể tự hạ quyền tài khoản đang đăng nhập.');
    }
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query('UPDATE `user` SET role = ? WHERE id = ?', [role, req.params.id]);
        if (role === 'partner') {
          const [[account]] = await connection.query(
            'SELECT full_name, username, email, phone FROM `user` WHERE id = ?',
            [req.params.id]
          );
          const [[profile]] = await connection.query('SELECT id FROM partners WHERE user_id = ?', [req.params.id]);
          if (!profile && account) {
            const [[matchingPartner]] = await connection.query(
              'SELECT id FROM partners WHERE email = ? AND user_id IS NULL LIMIT 1',
              [account.email]
            );
            if (matchingPartner) {
              await connection.query('UPDATE partners SET user_id = ? WHERE id = ?', [req.params.id, matchingPartner.id]);
            } else {
              await connection.query(
                'INSERT INTO partners (user_id, name, email, phone, description) VALUES (?, ?, ?, ?, ?)',
                [req.params.id, account.full_name || account.username, account.email, account.phone,
                  'Hồ sơ đối tác được tạo từ trung tâm quản trị.']
              );
            }
          }
        } else {
          await connection.query('UPDATE partners SET user_id = NULL WHERE user_id = ?', [req.params.id]);
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return actionSuccess(req, res, 'Đã cập nhật vai trò tài khoản.', '/admin/users', { role });
    } catch (error) { next(error); }
  });

  router.get('/admin/orders', async (req, res, next) => {
    const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : '';
    const search = String(req.query.search || '').trim();
    try {
      const clauses = [];
      const params = [];
      if (status) { clauses.push('o.status = ?'); params.push(status); }
      if (search) {
        clauses.push('(o.customer_name LIKE ? OR o.service_name LIKE ? OR CAST(o.id AS CHAR) LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const [rows] = await pool.query(`
        SELECT o.*, u.email AS customer_email,
               COALESCE(p.name, (
                 SELECT GROUP_CONCAT(DISTINCT pi.name SEPARATOR ', ')
                 FROM order_items oi
                 JOIN products s ON s.id = oi.service_id
                 JOIN partners pi ON pi.id = s.partner_id
                 WHERE oi.order_id = o.id
               ), 'Chưa gán') AS partner_name
        FROM orders o
        LEFT JOIN \`user\` u ON u.id = o.user_id
        LEFT JOIN partners p ON p.id = o.partner_id
        ${where}
        ORDER BY FIELD(o.status, 'pending','approved','processing','completed','rejected','cancelled'), o.created_at DESC`, params);
      const [[summary]] = await pool.query(`
        SELECT COUNT(*) AS total, SUM(status = 'pending') AS pending_count,
               SUM(status = 'approved') AS approved_count, SUM(status = 'completed') AS completed_count
        FROM orders`);
      res.render('admin/orders.html', {
        admin: req.session.user,
        active: 'orders',
        filters: { status, search },
        summary,
        statuses: ORDER_STATUSES.map((value) => ({ value, label: orderStatusLabels[value] })),
        orders: rows.map((row) => ({
          ...row,
          status_label: orderStatusLabels[row.status] || row.status,
          amount_text: money(row.final_amount),
          commission_text: money(row.commission_amount),
          payout_text: money(row.partner_payout),
          event_text: date(row.event_date),
          created_text: dateTime(row.created_at)
        })),
        notice: req.query.notice || ''
      });
    } catch (error) { next(error); }
  });

  router.post('/admin/orders/:id/status', async (req, res, next) => {
    const status = req.body.status;
    if (!ORDER_STATUSES.includes(status)) return actionError(req, res, 400, 'Trạng thái không hợp lệ.');
    try {
      const approved = ['approved', 'processing', 'completed'].includes(status);
      const [result] = await pool.query(`
        UPDATE orders SET status = ?, admin_note = ?, approved_by = ?,
          approved_at = CASE WHEN ? THEN COALESCE(approved_at, NOW()) ELSE approved_at END
        WHERE id = ?`, [status, String(req.body.admin_note || '').trim() || null,
        req.session.user.id, approved, req.params.id]);
      if (!result.affectedRows) return actionError(req, res, 404, 'Không tìm thấy đơn hàng.');
      return actionSuccess(req, res, `Đã cập nhật đơn hàng #${req.params.id}.`, '/admin/orders', { status });
    } catch (error) { next(error); }
  });

  router.get(['/admin/finance', '/admin/financial-payout'], async (req, res, next) => {
    try {
      const [[summary]] = await pool.query(`
        SELECT COALESCE(SUM(final_amount), 0) AS gross,
               COALESCE(SUM(partner_payout), 0) AS payout,
               COALESCE(SUM(commission_amount), 0) AS commission,
               COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) AS collected,
               COUNT(*) AS order_count
        FROM orders WHERE status IN ('approved','processing','completed')`);
      const [partners] = await pool.query(`
        SELECT p.id, p.name, COUNT(o.id) AS order_count,
               COALESCE(SUM(o.final_amount), 0) AS gross,
               COALESCE(SUM(o.partner_payout), 0) AS payout,
               COALESCE(SUM(o.commission_amount), 0) AS commission
        FROM partners p
        LEFT JOIN orders o ON o.partner_id = p.id AND o.status IN ('approved','processing','completed')
        GROUP BY p.id
        ORDER BY gross DESC`);
      const [transactions] = await pool.query(`
        SELECT o.id, o.created_at, o.final_amount, o.commission_amount, o.partner_payout, o.status,
               COALESCE(p.name, 'Nhiều đối tác') AS partner_name
        FROM orders o LEFT JOIN partners p ON p.id = o.partner_id
        WHERE o.status IN ('approved','processing','completed')
        ORDER BY o.created_at DESC LIMIT 30`);
      res.render('admin/finance.html', {
        admin: req.session.user,
        active: 'finance',
        summary: {
          gross: money(summary.gross), payout: money(summary.payout),
          commission: money(summary.commission), collected: money(summary.collected),
          order_count: Number(summary.order_count)
        },
        partners: partners.map((row) => ({ ...row, gross_text: money(row.gross), payout_text: money(row.payout), commission_text: money(row.commission) })),
        transactions: transactions.map((row) => ({ ...row, created_text: dateTime(row.created_at), gross_text: money(row.final_amount), payout_text: money(row.partner_payout), commission_text: money(row.commission_amount), status_label: orderStatusLabels[row.status] }))
      });
    } catch (error) { next(error); }
  });

  router.get('/admin/reports', async (req, res, next) => {
    const status = REPORT_STATUSES.includes(req.query.status) ? req.query.status : '';
    try {
      const params = status ? [status] : [];
      const where = status ? 'WHERE r.status = ?' : '';
      const [rows] = await pool.query(`
        SELECT r.*, u.full_name, u.email, u.phone
        FROM reports r LEFT JOIN \`user\` u ON u.id = r.reporter_id
        ${where}
        ORDER BY FIELD(r.status, 'open','in_progress','resolved','rejected'), r.created_at DESC`, params);
      const [[summary]] = await pool.query(`
        SELECT COUNT(*) AS total, SUM(status = 'open') AS open_count,
               SUM(status = 'in_progress') AS processing_count, SUM(status = 'resolved') AS resolved_count
        FROM reports`);
      res.render('admin/reports.html', {
        admin: req.session.user,
        active: 'reports',
        filters: { status },
        summary,
        statuses: REPORT_STATUSES.map((value) => ({ value, label: reportStatusLabels[value] })),
        reports: rows.map((row) => ({ ...row, status_label: reportStatusLabels[row.status], created_text: dateTime(row.created_at) })),
        notice: req.query.notice || ''
      });
    } catch (error) { next(error); }
  });

  router.post('/admin/reports/:id/resolve', async (req, res, next) => {
    const status = req.body.status;
    if (!REPORT_STATUSES.includes(status)) return actionError(req, res, 400, 'Trạng thái không hợp lệ.');
    try {
      const [result] = await pool.query(`UPDATE reports SET status = ?, admin_response = ?, handled_by = ? WHERE id = ?`, [
        status, String(req.body.admin_response || '').trim() || null, req.session.user.id, req.params.id
      ]);
      if (!result.affectedRows) return actionError(req, res, 404, 'Không tìm thấy phản ánh.');
      return actionSuccess(req, res, 'Đã lưu kết quả xử lý phản ánh.', '/admin/reports', { status });
    } catch (error) { next(error); }
  });

  router.get('/partner/orders/new', requirePartner, async (req, res, next) => {
    try {
      const [partners] = await pool.query('SELECT id, name FROM partners WHERE user_id = ?', [req.session.user.id]);
      res.render('partner_order_new.html', { user: req.session.user, partner: partners[0] || null, error: null, success: req.query.success || '' });
    } catch (error) { next(error); }
  });

  router.post('/partner/orders', requirePartner, async (req, res, next) => {
    try {
      const [[partner]] = await pool.query('SELECT id, name FROM partners WHERE user_id = ? LIMIT 1', [req.session.user.id]);
      if (!partner) return res.status(400).render('partner_order_new.html', { user: req.session.user, partner: null, success: '', error: 'Tài khoản chưa được liên kết với hồ sơ đối tác.' });
      const customerName = String(req.body.customer_name || '').trim();
      const serviceName = String(req.body.service_name || '').trim();
      const amount = Number(req.body.final_amount);
      if (!customerName || !serviceName || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).render('partner_order_new.html', { user: req.session.user, partner, success: '', error: 'Vui lòng nhập đầy đủ khách hàng, dịch vụ và giá trị đơn hợp lệ.' });
      }
      const commissionRate = 10;
      const commission = Math.round(amount * commissionRate / 100);
      const [result] = await pool.query(`
        INSERT INTO orders
          (partner_id, source_role, customer_name, customer_phone, service_name, event_date,
           event_location, note, total_amount, final_amount, payment_method, status,
           commission_rate, commission_amount, partner_payout)
        VALUES (?, 'partner', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`, [
        partner.id, customerName, String(req.body.customer_phone || '').trim() || null,
        serviceName, req.body.event_date || null, String(req.body.event_location || '').trim() || null,
        String(req.body.note || '').trim() || null, amount, amount,
        String(req.body.payment_method || 'Chuyển khoản'), commissionRate, commission, amount - commission
      ]);
      res.redirect('/partner/orders/new?success=' + encodeURIComponent(`Đã gửi đơn #${result.insertId} đến quản trị viên để duyệt.`));
    } catch (error) { next(error); }
  });

  router.requireAdmin = requireAdmin;
  return router;
};

