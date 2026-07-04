import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: "../../apps/server/.env" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const client = await pool.connect();
try {
  await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
  console.log("pgvector extension enabled");
} finally {
  client.release();
}
await pool.end();
