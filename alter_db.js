const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'misiones',
  });
  
  try {
    await pool.execute('ALTER TABLE mantenimiento ADD COLUMN id_boleta VARCHAR(50) DEFAULT NULL;');
    console.log('Column id_boleta added successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column id_boleta already exists');
    } else {
      console.error('Error adding column:', err);
    }
  } finally {
    await pool.end();
  }
}
main();
