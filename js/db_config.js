const fs = require('fs');
const path = require('path');

function getDbConfig(extra = {}) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_decor',
    ...extra
  };

  if (String(process.env.DB_SSL || '').toLowerCase() === 'true') {
    const hasCustomCa = Boolean(process.env.DB_CA_PATH);
    const verifyCertificate = hasCustomCa ||
      String(process.env.DB_SSL_REJECT_UNAUTHORIZED || '').toLowerCase() === 'true';

    config.ssl = { rejectUnauthorized: verifyCertificate };
    if (process.env.DB_CA_PATH) {
      config.ssl.ca = fs.readFileSync(path.resolve(process.env.DB_CA_PATH));
    }
  }

  return config;
}

module.exports = { getDbConfig };

