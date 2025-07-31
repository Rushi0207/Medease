import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'medease_db',
  user: process.env.DB_USER || 'medease_user',
  password: process.env.DB_PASSWORD || '',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait when connecting a client
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected at:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
    
    // In development, allow server to start without database
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Running in development mode without database connection');
      console.warn('⚠️  Please install and start PostgreSQL to use full functionality');
      return;
    }
    
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
});

export default pool;