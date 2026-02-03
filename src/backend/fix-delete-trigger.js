const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'utmn_security'
};

async function fixDeleteTrigger() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Dropping problematic trigger tr_user_after_delete...');
    await connection.query('DROP TRIGGER IF EXISTS tr_user_after_delete');
    
    console.log('✅ Trigger dropped successfully.');
    console.log('The application will now handle audit logging for user deletion manually.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixDeleteTrigger();
