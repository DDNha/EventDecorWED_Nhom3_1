require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../js/db_config');

async function main() {
  const seedPath = path.join(__dirname, '..', 'database', 'admin_seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  const connection = await mysql.createConnection(getDbConfig({ multipleStatements: true }));
  try {
    await connection.query(seedSql);
    const [[orders]] = await connection.query("SELECT COUNT(*) AS count FROM orders WHERE note LIKE '[ADMIN-SEED:%'");
    const [[reports]] = await connection.query("SELECT COUNT(*) AS count FROM reports WHERE subject LIKE '[SEED]%'");
    const [[users]] = await connection.query("SELECT COUNT(*) AS count FROM `user` WHERE email LIKE '%@eventdecor.test'");
    console.log(`Seed thành công: ${users.count} tài khoản, ${orders.count} đơn hàng, ${reports.count} phản ánh.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Không thể seed dữ liệu admin:', error);
  process.exitCode = 1;
});

