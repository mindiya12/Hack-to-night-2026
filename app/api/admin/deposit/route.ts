import {
  asText,
  pool,
  ensureDatabase,
  query,
  serviceFailure
} from '@/lib/platform-db'
import { getSessionUserId, getSessionUserRole } from '@/lib/session'

function requireAdmin(request: Request) {
  return getSessionUserRole(request) === 'admin'
}

export async function POST(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const adminId = getSessionUserId(request)
    const body = await request.json().catch(() => ({}))
    const accountNumber = asText(body.accountNumber)
    const amount = parseFloat(asText(body.amount || '0'))
    const type = asText(body.type) // 'deposit' | 'withdrawal'
    const description = asText(body.description || `Admin ${type}`)

    if (!accountNumber || !['deposit', 'withdrawal'].includes(type)) {
      return Response.json(
        { ok: false, message: 'Missing or invalid fields' },
        { status: 400 }
      )
    }
    if (isNaN(amount) || amount <= 0) {
      return Response.json(
        { ok: false, message: 'Invalid amount' },
        { status: 400 }
      )
    }

    const accCheck = await query(
      'SELECT balance, is_frozen FROM accounts WHERE account_number = $1',
      [accountNumber]
    )
    if (accCheck.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Account not found' },
        { status: 404 }
      )
    }

    const acc = accCheck.rows[0]

    if (acc.is_frozen) {
      return Response.json(
        {
          ok: false,
          message:
            'Account is frozen. Unfreeze the account before posting transactions.'
        },
        { status: 403 }
      )
    }

    if (type === 'withdrawal' && parseFloat(acc.balance) < amount) {
      return Response.json(
        { ok: false, message: 'Insufficient balance for withdrawal' },
        { status: 400 }
      )
    }

    await ensureDatabase()
    const client = await pool.connect()
    let txRow: any
    try {
      await client.query('BEGIN')

      if (type === 'deposit') {
        await client.query(
          'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2',
          [amount, accountNumber]
        )
      } else {
        await client.query(
          'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2',
          [amount, accountNumber]
        )
      }

      const from = type === 'deposit' ? 'BANK_SYSTEM' : accountNumber
      const to = type === 'deposit' ? accountNumber : 'BANK_SYSTEM'

      const inserted = await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [from, to, amount, description, adminId]
      )
      txRow = inserted.rows[0]

      await client.query(
        'INSERT INTO audit_logs (event, payload) VALUES ($1, $2)',
        [
          type === 'deposit' ? 'ADMIN_DEPOSIT' : 'ADMIN_WITHDRAWAL',
          JSON.stringify({
            accountNumber,
            amount,
            description,
            adminId,
            transactionId: txRow.id
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

    const updated = await query(
      'SELECT balance FROM accounts WHERE account_number = $1',
      [accountNumber]
    )

    return Response.json({
      ok: true,
      message: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} posted.`,
      newBalance: updated.rows[0].balance,
      transactionId: txRow.id
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
