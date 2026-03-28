import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
    sslmode: "require",
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const connectToDB = async () => {
  let client;
  try {
    client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("Database connection error:", err);
  } finally {
    if (client) client.release();
  }
};

export default pool;