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

    const result = await query(
      `SELECT a.id, a.requested_type, a.status, a.reject_reason, a.created_at, a.reviewed_at,
              u.full_name AS reviewed_by_name
       FROM account_applications a
       LEFT JOIN users u ON u.id = a.reviewed_by
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    )

    return Response.json({ ok: true, applications: result.rows })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const body = await request.json().catch(() => ({}))
    const requestedType = asText(body.requestedType || 'savings')

    const allowed = ['savings', 'current', 'fixed_deposit']
    if (!allowed.includes(requestedType)) {
      return Response.json(
        { ok: false, message: 'Invalid account type' },
        { status: 400 }
      )
    }

    // Limit: no more than 2 pending applications at once
    const pending = await query(
      `SELECT COUNT(*) FROM account_applications WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    )
    if (parseInt(pending.rows[0].count) >= 2) {
      return Response.json(
        {
          ok: false,
          message:
            'You already have pending applications. Please wait for them to be reviewed.'
        },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO account_applications (user_id, requested_type)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, requestedType]
    )

    await query('INSERT INTO audit_logs (event, payload) VALUES ($1, $2)', [
      'ACCOUNT_APPLICATION_SUBMITTED',
      JSON.stringify({
        userId,
        requestedType,
        applicationId: result.rows[0].id
      })
    ])

    return Response.json({ ok: true, application: result.rows[0] })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
