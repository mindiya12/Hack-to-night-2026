import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

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
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  account_type TEXT NOT NULL DEFAULT 'savings',
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  risk_score INTEGER,
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

CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'transfer',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

export async function runStatement(sql: string) {
  await ensureDatabase()
  return pool.query(sql)
}

export async function query(sql: string, params: unknown[] = []) {
  await ensureDatabase()
  return pool.query(sql, params)
}

export async function ensureDatabase() {
  if (booted) return
  await pool.query(schema)

  // Seed admin account from env (idempotent)
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@novabank.lk'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2026#'
  const adminFullName = process.env.ADMIN_FULL_NAME || 'Platform Administrator'
  const adminHash = bcrypt.hashSync(adminPassword, 10)

  await pool.query(
    `INSERT INTO users (username, password, role, full_name, email)
     VALUES ($1, $2, 'admin', $3, $4)
     ON CONFLICT (username) DO NOTHING`,
    [adminUsername, adminHash, adminFullName, adminEmail]
  )

  // Remove legacy demo accounts if present from old seeds
  await pool.query(
    `DELETE FROM transactions WHERE created_by IN (
       SELECT id FROM users WHERE username IN ('dilara', 'kasun')
     )`
  )
  await pool.query(
    `DELETE FROM account_applications WHERE user_id IN (
       SELECT id FROM users WHERE username IN ('dilara', 'kasun')
     )`
  )
  await pool.query(
    `DELETE FROM accounts WHERE user_id IN (
       SELECT id FROM users WHERE username IN ('dilara', 'kasun')
     )`
  )
  await pool.query(`DELETE FROM users WHERE username IN ('dilara', 'kasun')`)

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
    },
    { status: 500 }
  )
}
