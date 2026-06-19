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
    const q = asText(searchParams.get('q'))

    // A more secure implementation could restrict searches, but for now we just fix the SQLi
    // by using parameterized queries.
    const searchPattern = `%${q}%`
    const sql = `
      SELECT 'user' AS type, id::text, username AS label, email AS detail FROM users
      WHERE username ILIKE $1 OR full_name ILIKE $1
      UNION ALL
      SELECT 'account' AS type, id::text, account_number AS label, account_name AS detail FROM accounts
      WHERE account_number ILIKE $1 OR account_name ILIKE $1
      UNION ALL
      SELECT 'transaction' AS type, id::text, from_account || ' -> ' || to_account AS label, description AS detail FROM transactions
      WHERE description ILIKE $1
      LIMIT 25
    `
    const result = await query(sql, [searchPattern])

    return Response.json({
      ok: true,
      query: q,
      results: result.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
