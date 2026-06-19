import { asText, query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserId, getSessionUserRole } from '@/lib/session'
import bcrypt from 'bcryptjs'

function requireAdmin(request: Request) {
  return getSessionUserRole(request) === 'admin'
}

export async function GET(request: Request) {
  try {
    if (!requireAdmin(request))
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const result = await query(
      `SELECT a.id, a.user_id, a.requested_type, a.status, a.reject_reason,
              a.created_at, a.reviewed_at,
              u.username, u.full_name, u.email,
              r.full_name AS reviewed_by_name
       FROM account_applications a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN users r ON r.id = a.reviewed_by
       WHERE a.status = $1
       ORDER BY a.created_at DESC`,
      [status]
    )

    return Response.json({ ok: true, applications: result.rows })
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
    const applicationId = parseInt(asText(body.applicationId))
    const action = asText(body.action)
    const accountType = asText(body.accountType || 'savings')
    const rejectReason = asText(body.rejectReason)

    if (!applicationId || !['approve', 'reject'].includes(action)) {
      return Response.json(
        { ok: false, message: 'Missing fields' },
        { status: 400 }
      )
    }

    const appResult = await query(
      `SELECT * FROM account_applications WHERE id = $1 AND status = 'pending'`,
      [applicationId]
    )
    if (appResult.rows.length === 0) {
      return Response.json(
        { ok: false, message: 'Application not found or already reviewed' },
        { status: 404 }
      )
    }

    const app = appResult.rows[0]

    if (action === 'reject') {
      await query(
        `UPDATE account_applications
         SET status = 'rejected', reject_reason = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3`,
        [rejectReason, adminId, applicationId]
      )
      await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
        'APPLICATION_REJECTED',
        JSON.stringify({
          applicationId,
          userId: app.user_id,
          reason: rejectReason,
          adminId
        })
      ])
      return Response.json({ ok: true, message: 'Application rejected.' })
    }

    // Approve: generate account number and create the real account
    const accountNumber = (
      1000000000n + BigInt(Math.floor(Math.random() * 9000000000))
    ).toString()
    const defaultPin = bcrypt.hashSync('0000', 10)

    // Fetch user's name for account_name
    const userRes = await query('SELECT full_name FROM users WHERE id = $1', [
      app.user_id
    ])
    const accountName = `${userRes.rows[0].full_name} ${accountType.charAt(0).toUpperCase() + accountType.slice(1)}`

    await query(
      `INSERT INTO accounts (user_id, account_number, account_name, account_type, balance, pin)
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [app.user_id, accountNumber, accountName, accountType, defaultPin]
    )

    await query(
      `UPDATE account_applications
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [adminId, applicationId]
    )

    await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
      'APPLICATION_APPROVED',
      JSON.stringify({
        applicationId,
        userId: app.user_id,
        accountNumber,
        accountType,
        adminId
      })
    ])

    return Response.json({
      ok: true,
      message: 'Application approved.',
      accountNumber
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
