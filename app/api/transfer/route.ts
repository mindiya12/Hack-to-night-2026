import {
  asText,
  pool,
  ensureDatabase,
  query,
  serviceFailure
} from '@/lib/platform-db'
import { getSessionUserId } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount || body.from)
    const toAccount = asText(body.toAccount || body.to)
    const amount = parseFloat(asText(body.amount || '0'))
    const description = asText(body.description)
    const pin = asText(body.pin)

    if (!fromAccount || !toAccount || !pin) {
      return Response.json(
        { ok: false, message: 'Missing fields. PIN is required.' },
        { status: 400 }
      )
    }

    if (isNaN(amount) || amount <= 0) {
      return Response.json(
        { ok: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (fromAccount === toAccount) {
      return Response.json(
        { ok: false, message: 'Cannot transfer to same account' },
        { status: 400 }
      )
    }

    // PIN brute-force protection: max 3 wrong PINs per 5 minutes per user
    if (!checkRateLimit(`transfer_pin:${userId}`, 3, 300_000)) {
      return Response.json(
        {
          ok: false,
          message: 'Too many incorrect PIN attempts. Try again in 5 minutes.'
        },
        { status: 429 }
      )
    }

    // Verify ownership and fetch stored PIN hash
    const ownCheck = await query(
      'SELECT id, balance, pin FROM accounts WHERE account_number = $1 AND user_id = $2',
      [fromAccount, userId]
    )
    if (ownCheck.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Forbidden or account not found' },
        { status: 403 }
      )
    }

    const accountRow = ownCheck.rows[0]

    // Verify PIN before touching balances
    if (!bcrypt.compareSync(pin, accountRow.pin)) {
      await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
        'TRANSFER_FAILED',
        JSON.stringify({
          reason: 'Invalid PIN',
          from: fromAccount,
          to: toAccount,
          userId
        })
      ])
      return Response.json(
        { ok: false, message: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Verify destination exists
    const destCheck = await query(
      'SELECT id FROM accounts WHERE account_number = $1',
      [toAccount]
    )
    if (destCheck.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Destination account not found' },
        { status: 404 }
      )
    }

    // Atomically debit + credit + record the transaction
    await ensureDatabase()
    const client = await pool.connect()
    let transactionRow: any
    try {
      await client.query('BEGIN')

      // Re-read balance with a row lock to prevent concurrent race conditions
      const locked = await client.query(
        'SELECT balance FROM accounts WHERE account_number = $1 AND user_id = $2 FOR UPDATE',
        [fromAccount, userId]
      )
      if (parseFloat(locked.rows[0].balance) < amount) {
        await client.query('ROLLBACK')
        await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
          'TRANSFER_FAILED',
          JSON.stringify({
            reason: 'Insufficient funds',
            from: fromAccount,
            amount,
            userId
          })
        ])
        return Response.json(
          { ok: false, message: 'Insufficient balance' },
          { status: 400 }
        )
      }

      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2',
        [amount, fromAccount]
      )
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2',
        [amount, toAccount]
      )

      const inserted = await client.query(
        'INSERT INTO transactions (from_account, to_account, amount, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [fromAccount, toAccount, amount, description, userId]
      )
      transactionRow = inserted.rows[0]

      await client.query(
        'INSERT INTO audit_logs (event, payload) VALUES ($1, $2)',
        [
          'TRANSFER_SUCCESS',
          JSON.stringify({
            transactionId: transactionRow.id,
            from: fromAccount,
            to: toAccount,
            amount,
            userId
          })
        ]
      )

      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    return Response.json({
      ok: true,
      message: 'Transfer accepted.',
      transaction: transactionRow
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
