const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'utmn_security'
};

async function fixAuditTriggers() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Dropping problematic triggers...');
    
    // Drop DELETE trigger (caused 400 error on delete)
    await connection.query('DROP TRIGGER IF EXISTS tr_user_after_delete');
    console.log('✅ Dropped tr_user_after_delete');
    
    // Drop UPDATE trigger (caused implicit actor attribution to the user themselves)
    await connection.query('DROP TRIGGER IF EXISTS tr_user_after_update');
    console.log('✅ Dropped tr_user_after_update');
    
    // Drop INSERT trigger (caused implicit actor attribution to the user themselves)
    await connection.query('DROP TRIGGER IF EXISTS tr_user_after_insert');
    console.log('✅ Dropped tr_user_after_insert');
    
    console.log('SUCCESS: All problematic triggers have been removed.');
    console.log('Audit logging is now handled securely by the application controller.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

fixAuditTriggers();
