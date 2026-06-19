import { query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserId } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const result = await query(
      `SELECT a.id, a.user_id, a.account_number, a.account_name, a.balance,
              a.account_type, a.is_frozen, a.created_at, u.username, u.full_name
       FROM accounts a
       JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
       ORDER BY a.id`,
      [userId]
    )

    return Response.json({ ok: true, accounts: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
