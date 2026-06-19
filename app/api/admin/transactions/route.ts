import {
  asText,
  ensureDatabase,
  pool,
  query,
  serviceFailure
} from '@/lib/platform-db'
import { getSessionUserId, getSessionUserRole } from '@/lib/session'

function requireAdmin(request: Request) {
  return getSessionUserRole(request) === 'admin'
}

export async function GET(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const flagged = searchParams.get('flagged') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

    let sql = `
      SELECT t.*, u.username AS created_by_name
      FROM transactions t
      LEFT JOIN users u ON u.id = t.created_by
      ${flagged ? 'WHERE t.flagged = true' : ''}
      ORDER BY t.created_at DESC
      LIMIT $1
    `
    const result = await query(sql, [limit])

    return Response.json({ ok: true, transactions: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const adminId = getSessionUserId(request)
    const body = await request.json().catch(() => ({}))
    const action = asText(body.action)
    const transactionId = parseInt(asText(body.transactionId))
    const reason = asText(body.reason)

    if (!transactionId || !['flag', 'unflag', 'reverse'].includes(action)) {
      return Response.json(
        { ok: false, message: 'Missing fields' },
        { status: 400 }
      )
    }

    const txCheck = await query('SELECT * FROM transactions WHERE id = $1', [
      transactionId
    ])
    if (txCheck.rows.length === 0)
      return Response.json(
        { ok: false, message: 'Transaction not found' },
        { status: 404 }
      )
    const tx = txCheck.rows[0]

    if (action === 'flag') {
      await query(
        'UPDATE transactions SET flagged = true, flag_reason = $1 WHERE id = $2',
        [reason, transactionId]
      )
      await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
        'TRANSACTION_FLAGGED',
        JSON.stringify({ transactionId, reason, adminId })
      ])
      return Response.json({ ok: true, message: 'Transaction flagged.' })
    }

    if (action === 'unflag') {
      await query(
        'UPDATE transactions SET flagged = false, flag_reason = NULL WHERE id = $1',
        [transactionId]
      )
      return Response.json({ ok: true, message: 'Transaction unflagged.' })
    }

    // Reverse: create an opposite transaction and adjust balances
    if (tx.from_account === 'BANK_SYSTEM' || tx.to_account === 'BANK_SYSTEM') {
      return Response.json(
        {
          ok: false,
          message:
            'System postings cannot be reversed here. Use teller withdrawal.'
        },
        { status: 400 }
      )
    }

    await ensureDatabase()
    const client = await pool.connect()
    let reversalRow: any
    try {
      await client.query('BEGIN')

      // Lock both accounts and verify the recipient (to_account) has enough to be debited back
      const balCheck = await client.query(
        'SELECT account_number, balance FROM accounts WHERE account_number = ANY($1) FOR UPDATE',
        [[tx.from_account, tx.to_account]]
      )
      const recipientRow = balCheck.rows.find(
        (r: any) => r.account_number === tx.to_account
      )
      if (
        !recipientRow ||
        parseFloat(recipientRow.balance) < parseFloat(tx.amount)
      ) {
        await client.query('ROLLBACK')
        return Response.json(
          {
            ok: false,
            message:
              'Reversal blocked: recipient account has insufficient funds to be debited back.'
          },
          { status: 400 }
        )
      }

      // Move money back: credit the original debited account, debit the credited account
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2',
        [tx.amount, tx.from_account]
      )
      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2',
        [tx.amount, tx.to_account]
      )

      const reversal = await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, created_by, status)
         VALUES ($1, $2, $3, $4, $5, 'REVERSED')
         RETURNING *`,
        [
          tx.to_account,
          tx.from_account,
          tx.amount,
          `REVERSAL of txn #${transactionId}: ${reason}`,
          adminId
        ]
      )
      reversalRow = reversal.rows[0]

      await client.query(
        `UPDATE transactions SET status = 'REVERSED', flag_reason = $1 WHERE id = $2`,
        [`Reversed by admin (txn #${reversalRow.id}): ${reason}`, transactionId]
      )

      await client.query(
        'INSERT INTO audit_logs (event, payload) VALUES ($1, $2)',
        [
          'TRANSACTION_REVERSED',
          JSON.stringify({
            originalTxId: transactionId,
            reversalTxId: reversalRow.id,
            reason,
            adminId
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
      message: 'Transaction reversed.',
      reversalId: reversalRow.id
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
