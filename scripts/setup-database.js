require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDbConfig } = require('../js/db_config');

async function main() {
  const schemaPath = path.join(__dirname, '..', 'database', 'event_decor (1).sql');
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Aiven đã tạo sẵn database (thường là defaultdb). Import schema vào DB_NAME
  // thay vì cố tạo một database khác.
  schema = schema
    .replace(/CREATE DATABASE IF NOT EXISTS `?event_decor`?[\s\S]*?;/i, '')
    .replace(/USE `?event_decor`?\s*;/i, '');

  const connection = await mysql.createConnection(getDbConfig({ multipleStatements: true }));
  try {
    await connection.query(schema);
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Đã khởi tạo database ${process.env.DB_NAME} với ${tables.length} bảng.`);
    for (const row of tables) console.log(`- ${Object.values(row)[0]}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Không thể khởi tạo database:', error.message);
  process.exitCode = 1;
});

