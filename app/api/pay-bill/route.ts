import {
  asText,
  ensureDatabase,
  pool,
  query,
  serviceFailure
} from '@/lib/platform-db'
import { getSessionUserId } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount)
    const amount = parseFloat(asText(body.amount || '0'))
    const description = asText(body.description)
    const otp = asText(body.otp)

    if (!fromAccount || !otp) {
      return Response.json(
        { ok: false, message: 'Missing fields' },
        { status: 400 }
      )
    }
    if (isNaN(amount) || amount <= 0) {
      return Response.json(
        { ok: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Verify OTP
    const otpCheck = await query(
      `SELECT id FROM otps
       WHERE user_id = $1 AND code = $2 AND purpose = 'payment'
         AND used = false AND expires_at > NOW()`,
      [userId, otp]
    )
    if (otpCheck.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // Verify ownership and frozen status
    const accCheck = await query(
      'SELECT id, balance, is_frozen FROM accounts WHERE account_number = $1 AND user_id = $2',
      [fromAccount, userId]
    )
    if (accCheck.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Forbidden or account not found' },
        { status: 403 }
      )
    }
    if (accCheck.rows[0].is_frozen) {
      return Response.json(
        {
          ok: false,
          message: 'Your account is frozen. Contact the bank for assistance.'
        },
        { status: 403 }
      )
    }

    await ensureDatabase()
    const client = await pool.connect()
    let txRow: any
    try {
      await client.query('BEGIN')

      const locked = await client.query(
        'SELECT balance FROM accounts WHERE account_number = $1 AND user_id = $2 FOR UPDATE',
        [fromAccount, userId]
      )
      if (parseFloat(locked.rows[0].balance) < amount) {
        await client.query('ROLLBACK')
        return Response.json(
          { ok: false, message: 'Insufficient balance' },
          { status: 400 }
        )
      }

      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2',
        [amount, fromAccount]
      )

      const inserted = await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
         VALUES ($1, 'BILLER_SYSTEM', $2, $3, $4) RETURNING *`,
        [fromAccount, amount, description, userId]
      )
      txRow = inserted.rows[0]

      await client.query(
        'INSERT INTO audit_logs (event, payload) VALUES ($1, $2)',
        [
          'BILL_PAYMENT',
          JSON.stringify({
            transactionId: txRow.id,
            from: fromAccount,
            amount,
            description,
            userId
          })
        ]
      )

      // Mark OTP used inside the same transaction
      await client.query('UPDATE otps SET used = true WHERE id = $1', [
        otpCheck.rows[0].id
      ])

      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    return Response.json({
      ok: true,
      message: 'Payment successful.',
      transaction: txRow
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
