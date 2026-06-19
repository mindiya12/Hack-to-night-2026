import { asText, query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserRole } from '@/lib/session'

function requireAdmin(request: Request) {
  return getSessionUserRole(request) === 'admin'
}

export async function GET(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Single customer detail with their accounts
      const user = await query(
        `SELECT id, username, role, full_name, nic, email, created_at FROM users WHERE id = $1`,
        [userId]
      )
      if (user.rows.length === 0)
        return Response.json(
          { ok: false, message: 'Not found' },
          { status: 404 }
        )

      const accounts = await query(
        `SELECT id, account_number, account_name, balance, account_type, is_frozen, created_at
         FROM accounts WHERE user_id = $1 ORDER BY id`,
        [userId]
      )

      return Response.json({
        ok: true,
        user: user.rows[0],
        accounts: accounts.rows
      })
    }

    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.email, u.role, u.created_at,
              COUNT(a.id)::int AS account_count,
              COALESCE(SUM(a.balance), 0)::numeric AS total_balance
       FROM users u
       LEFT JOIN accounts a ON a.user_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.id`
    )

    return Response.json({ ok: true, customers: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const action = asText(body.action)
    const accountNumber = asText(body.accountNumber)

    if (!accountNumber || !['freeze', 'unfreeze'].includes(action)) {
      return Response.json(
        { ok: false, message: 'Missing fields' },
        { status: 400 }
      )
    }

    const frozen = action === 'freeze'
    await query(
      'UPDATE accounts SET is_frozen = $1 WHERE account_number = $2',
      [frozen, accountNumber]
    )

    await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
      frozen ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN',
      JSON.stringify({ accountNumber })
    ])

    return Response.json({
      ok: true,
      message: `Account ${frozen ? 'frozen' : 'unfrozen'}.`
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
