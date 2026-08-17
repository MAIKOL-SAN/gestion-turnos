import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const name = process.env.SUPER_ADMIN_NAME;
const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!connectionString || !name || !email || !password) {
  console.error(
    "Configura DATABASE_URL, SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD.",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("SUPER_ADMIN_PASSWORD debe tener minimo 8 caracteres.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
});

const passwordHash = await bcrypt.hash(password, 12);
const existing = await pool.query("select id from users where lower(email) = $1", [
  email,
]);

if (existing.rowCount) {
  await pool.query(
    `update users
     set name = $1,
         password_hash = $2,
         role = 'SUPER_ADMIN',
         status = 'ACTIVE'
     where id = $3`,
    [name, passwordHash, existing.rows[0].id],
  );
  console.log(`SUPER_ADMIN actualizado: ${email}`);
} else {
  await pool.query(
    `insert into users (name, email, password_hash, role, status)
     values ($1, $2, $3, 'SUPER_ADMIN', 'ACTIVE')`,
    [name, email, passwordHash],
  );
  console.log(`SUPER_ADMIN creado: ${email}`);
}

await pool.end();
