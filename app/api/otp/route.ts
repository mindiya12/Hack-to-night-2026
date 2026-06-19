import { sendOTPEmail } from '@/lib/email'
import { asText, query, serviceFailure } from '@/lib/platform-db'
import { checkRateLimit } from '@/lib/rateLimit'
import { getSessionUserId } from '@/lib/session'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    if (!checkRateLimit(`otp:${userId}:${ip}`, 5, 600_000)) {
      return Response.json(
        {
          ok: false,
          message: 'Too many OTP requests. Try again in 10 minutes.'
        },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const purpose = asText(body.purpose || 'transfer') as 'transfer' | 'payment'

    const userRes = await query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    )
    if (userRes.rows.length === 0)
      return Response.json(
        { ok: false, message: 'User not found' },
        { status: 404 }
      )

    const { email, full_name } = userRes.rows[0]
    if (!email)
      return Response.json(
        {
          ok: false,
          message:
            'No email address on your account. Contact the bank to add one.'
        },
        { status: 400 }
      )

    // Invalidate any previous unused OTPs for this user + purpose
    await query(
      `UPDATE otps SET used = true WHERE user_id = $1 AND purpose = $2 AND used = false`,
      [userId, purpose]
    )

    const code = generateOTP()
    await query(
      `INSERT INTO otps (user_id, code, purpose, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [userId, code, purpose]
    )

    await sendOTPEmail(email, code, full_name, purpose)

    // Mask the email for display: ab***@domain.com
    const [local, domain] = email.split('@')
    const maskedEmail =
      local.slice(0, Math.min(2, local.length)) + '***@' + domain

    return Response.json({ ok: true, maskedEmail })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
