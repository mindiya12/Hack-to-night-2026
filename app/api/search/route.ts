import { asText, query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserRole } from '@/lib/session'

export async function GET(request: Request) {
  try {
    if (getSessionUserRole(request) !== 'admin') {
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = asText(searchParams.get('q'))
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
