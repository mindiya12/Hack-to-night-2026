import { query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserRole } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const role = getSessionUserRole(request)
    if (role !== 'admin') {
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    const users = await query(
      'SELECT id, username, role, full_name, nic, email, created_at FROM users ORDER BY id'
    )
    const accounts = await query(
      'SELECT id, user_id, account_number, account_name, balance FROM accounts ORDER BY id'
    )
    const logs = await query(
      'SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10'
    )

    return Response.json({
      ok: true,
      message: 'System overview.',
      users: users.rows,
      accounts: accounts.rows,
      auditLogs: logs.rows
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
