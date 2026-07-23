import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  user: process.env.DB_USER || '4H4B6FEz3WPrVQT.root',
  password: process.env.DB_PASSWORD || 'wWEvmvEoC9yVUPmt',
  database: process.env.DB_NAME || 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// https://github.com/gotanel1/node-101
// Test connection
try {
  const connection = await pool.getConnection();
  console.log('Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'test'));
  connection.release();
} catch (error) {
  console.error('Database connection failed! Error details:', error.message);
}

export default pool;
