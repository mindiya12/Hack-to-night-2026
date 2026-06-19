import { query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserRole } from '@/lib/session'

export async function GET(request: Request) {
  try {
    if (getSessionUserRole(request) !== 'admin') {
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    const [customers, deposits, accountsToday, txToday, pendingApps, flagged] =
      await Promise.all([
        query(
          `SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'`
        ),
        query(
          `SELECT COALESCE(SUM(balance), 0)::numeric AS total FROM accounts`
        ),
        query(
          `SELECT COUNT(*)::int AS count FROM accounts WHERE created_at >= CURRENT_DATE`
        ),
        query(
          `SELECT COUNT(*)::int AS count FROM transactions WHERE created_at >= CURRENT_DATE`
        ),
        query(
          `SELECT COUNT(*)::int AS count FROM account_applications WHERE status = 'pending'`
        ),
        query(
          `SELECT COUNT(*)::int AS count FROM transactions WHERE flagged = true`
        )
      ])

    const recentTx = await query(
      `SELECT t.id, t.from_account, t.to_account, t.amount, t.description,
              t.flagged, t.status, t.created_at, u.username AS created_by_name
       FROM transactions t
       LEFT JOIN users u ON u.id = t.created_by
       ORDER BY t.created_at DESC LIMIT 5`
    )

    const recentApps = await query(
      `SELECT a.id, a.requested_type, a.status, a.created_at, u.full_name, u.username
       FROM account_applications a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT 5`
    )

    return Response.json({
      ok: true,
      metrics: {
        totalCustomers: customers.rows[0].count,
        totalDeposits: deposits.rows[0].total,
        accountsOpenedToday: accountsToday.rows[0].count,
        transactionsToday: txToday.rows[0].count,
        pendingApplications: pendingApps.rows[0].count,
        flaggedTransactions: flagged.rows[0].count
      },
      recentTransactions: recentTx.rows,
      recentApplications: recentApps.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
