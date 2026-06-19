import { asText, query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserId } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const { searchParams } = new URL(request.url)
    const account = asText(searchParams.get('account'))
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!account)
      return Response.json(
        { ok: false, message: 'Account required' },
        { status: 400 }
      )

    // Verify ownership
    const ownCheck = await query(
      'SELECT id FROM accounts WHERE account_number = $1 AND user_id = $2',
      [account, userId]
    )
    if (ownCheck.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Forbidden or account not found' },
        { status: 403 }
      )
    }

    const sql = `
      SELECT *
      FROM transactions
      WHERE from_account = $1 OR to_account = $1
      ORDER BY created_at DESC
      LIMIT $2
    `
    const result = await query(sql, [account, limit])

    return Response.json({
      ok: true,
      account,
      transactions: result.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
