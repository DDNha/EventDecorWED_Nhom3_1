require('dotenv').config();
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../js/db_config');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Cách dùng: npm run make-admin -- email@example.com');
    process.exitCode = 1;
    return;
  }

  const connection = await mysql.createConnection(getDbConfig());

  try {
    const [result] = await connection.execute(
      "UPDATE `user` SET role = 'admin', status = 'active' WHERE email = ?",
      [email]
    );
    if (!result.affectedRows) {
      console.error(`Không tìm thấy tài khoản ${email}. Hãy đăng ký tài khoản trên website trước.`);
      process.exitCode = 1;
      return;
    }
    console.log(`Đã cấp quyền admin cho ${email}.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Không thể cấp quyền admin:', error.message);
  process.exitCode = 1;
});

