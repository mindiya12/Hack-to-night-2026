import { asText, query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserId, getSessionUserRole } from '@/lib/session'

function requireAdmin(request: Request) {
  return getSessionUserRole(request) === 'admin'
}

export async function GET(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const result = await query(
      `SELECT s.*, u.username AS reported_by_name
       FROM scam_accounts s
       LEFT JOIN users u ON u.id = s.reported_by
       ORDER BY s.created_at DESC`
    )

    return Response.json({ ok: true, reports: result.rows })
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
    const accountNumber = asText(body.accountNumber)
    const reason = asText(body.reason)

    if (!accountNumber || !reason) {
      return Response.json(
        { ok: false, message: 'Account number and reason are required' },
        { status: 400 }
      )
    }

    if (!/^\w+$/.test(accountNumber)) {
      return Response.json(
        { ok: false, message: 'Invalid account number format' },
        { status: 400 }
      )
    }

    await query(
      `INSERT INTO scam_accounts (account_number, reason, reported_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (account_number) DO UPDATE SET reason = EXCLUDED.reason`,
      [accountNumber, reason, adminId]
    )

    await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
      'SCAM_REPORT_ADDED',
      JSON.stringify({ accountNumber, reason, adminId })
    ])

    return Response.json({
      ok: true,
      message: 'Account added to scam blocklist.'
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const adminId = getSessionUserId(request)
    const body = await request.json().catch(() => ({}))
    const accountNumber = asText(body.accountNumber)

    if (!accountNumber)
      return Response.json(
        { ok: false, message: 'Account number required' },
        { status: 400 }
      )

    await query('DELETE FROM scam_accounts WHERE account_number = $1', [
      accountNumber
    ])

    await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
      'SCAM_REPORT_REMOVED',
      JSON.stringify({ accountNumber, adminId })
    ])

    return Response.json({ ok: true, message: 'Removed from scam blocklist.' })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
