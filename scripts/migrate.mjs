import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL no esta configurada.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
});

const migrationsDir = path.join(process.cwd(), "migrations");
const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

await pool.query(`
  create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )
`);

for (const file of files) {
  const applied = await pool.query(
    "select filename from schema_migrations where filename = $1",
    [file],
  );

  if (applied.rowCount) {
    console.log(`skip ${file}`);
    continue;
  }

  const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "insert into schema_migrations (filename) values ($1)",
      [file],
    );
    await client.query("COMMIT");
    console.log(`applied ${file}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`failed ${file}`);
    throw error;
  } finally {
    client.release();
  }
}

await pool.end();
