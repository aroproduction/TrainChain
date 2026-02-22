import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// Create a new Pool instance
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // ssl: {
  //   rejectUnauthorized: false, // required for SSL connection
  //   sslmode: "require",
  // }
  ssl: false, // Disable SSL for local development (Ganache + local PostgreSQL)
});

// Check the connection
export const connectToDB = async () => {
  try {
    const res = await pool.query("SELECT NOW()");  // This query returns the current timestamp from the database
    console.log("Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

// Export pool to be used elsewhere
export default pool;