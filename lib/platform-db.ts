import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:supersecurepassword@localhost:5432/htn26db'

export const pool = new Pool({
  connectionString,
  max: 3
})

let booted = false

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  nic TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  pin TEXT NOT NULL DEFAULT '0000'
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scam_accounts (
  id SERIAL PRIMARY KEY,
  account_number TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  reported_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  requested_type TEXT NOT NULL DEFAULT 'savings',
  status TEXT NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

const seedTransactions = `
INSERT INTO transactions (from_account, to_account, amount, description, created_by) VALUES
  ('1000003423', '2000006754', 4500.00, 'Lunch money', 1),
  ('1000004876', '9999999999', 10000.00, 'Totally normal fee', 1),
  ('2000006754', '1000003423', 9870.00, 'Refund maybe', 2)
ON CONFLICT DO NOTHING;
`

export async function runStatement(sql: string) {
  await ensureDatabase()
  console.log('[bank-sql]', sql)
  return pool.query(sql)
}

export async function query(sql: string, params: unknown[] = []) {
  await ensureDatabase()
  console.log('[bank-sql-param]', sql, params)
  return pool.query(sql, params)
}

export async function ensureDatabase() {
  if (booted) return
  await pool.query(schema)

  // Idempotent column additions (safe to run on existing tables)
  await pool.query(
    `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'savings'`
  )
  await pool.query(
    `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false`
  )
  await pool.query(
    `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  )
  await pool.query(
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT false`
  )
  await pool.query(
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS flag_reason TEXT`
  )
  await pool.query(
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS risk_score INTEGER`
  )

  // Seed users with hashed passwords
  const password123Hash = bcrypt.hashSync('password123', 10)
  const kasunHash = bcrypt.hashSync('kasun', 10)
  const adminHash = bcrypt.hashSync('admin', 10)

  await pool.query(
    `
    INSERT INTO users (id, username, password, role, full_name, nic, email) VALUES
      (1, 'dilara', $1, 'customer', 'Dilara Perera', '200112345678', 'dilara@example.test'),
      (2, 'kasun', $2, 'customer', 'Kasun Wickramanayake', '199812345678', 'kasun@example.test'),
      (3, 'admin', $3, 'admin', 'Platform Administrator', '000000000000', 'root@example.test')
    ON CONFLICT (id) DO NOTHING;
  `,
    [password123Hash, kasunHash, adminHash]
  )

  // Seed accounts with hashed PINs
  const pin1234Hash = bcrypt.hashSync('1234', 10)
  const pin0000Hash = bcrypt.hashSync('0000', 10)
  const pin9999Hash = bcrypt.hashSync('9999', 10)

  await pool.query(
    `
    INSERT INTO accounts (user_id, account_number, account_name, balance, pin) VALUES
      (1, '1000003423', 'Dilara Savings', 100000.00, $1),
      (1, '1000004876', 'Dilara Expenses', 42000.00, $1),
      (2, '2000006754', 'Kasun Current', 9870.00, $2),
      (3, '9999999999', 'Admin Vault', 9999999.99, $3)
    ON CONFLICT (account_number) DO NOTHING;
  `,
    [pin1234Hash, pin0000Hash, pin9999Hash]
  )

  await pool.query(seedTransactions)

  // Seed a demo application so the admin panel has something to show
  await pool.query(`
    INSERT INTO account_applications (user_id, requested_type, status)
    VALUES (2, 'current', 'pending')
    ON CONFLICT DO NOTHING
  `)

  booted = true
}

export function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

export function serviceFailure(reason: unknown) {
  const issue = reason as {
    message?: string
    code?: string
    detail?: string
    stack?: string
  }

  return Response.json(
    {
      ok: false,
      message: issue.message,
      code: issue.code,
      detail: issue.detail,
      trace: process.env.NODE_ENV === 'development' ? issue.stack : undefined
      // databaseUrl removed for security
    },
    { status: 500 }
  )
}
