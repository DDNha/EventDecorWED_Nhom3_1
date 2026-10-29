require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../js/db_config');

async function main() {
  const validationDb = `eventdecor_validate_${Date.now()}`;
  const schemaPath = path.join(__dirname, '..', 'database', 'event_decor (1).sql');
  let schema = fs.readFileSync(schemaPath, 'utf8')
    .replace(/CREATE DATABASE IF NOT EXISTS `?event_decor`?[\s\S]*?;/i, '')
    .replace(/USE `?event_decor`?\s*;/i, '');

  const connection = await mysql.createConnection(getDbConfig({ multipleStatements: true }));
  try {
    await connection.query(`CREATE DATABASE \`${validationDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${validationDb}\``);
    await connection.query(schema);
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`SQL hợp lệ: tạo thành công ${tables.length} bảng trong database kiểm thử.`);
  } finally {
    await connection.query(`USE \`${process.env.DB_NAME}\``).catch(() => {});
    await connection.query(`DROP DATABASE IF EXISTS \`${validationDb}\``).catch(() => {});
    await connection.end();
  }
}

main().catch((error) => {
  console.error('SQL không hợp lệ:', error.message);
  process.exitCode = 1;
});

