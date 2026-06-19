import { asText, query, serviceFailure } from '@/lib/platform-db'
import bcrypt from 'bcryptjs'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const username = asText(body.username)
    const password = asText(body.password)

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    if (!checkRateLimit(`login:${ip}`, 5, 300_000)) {
      return Response.json(
        { ok: false, message: 'Too many attempts. Try again later.' },
        { status: 429 }
      )
    }

    const sql = `
      SELECT id, username, password, role, full_name, email
      FROM users
      WHERE username = $1
      LIMIT 1
    `
    const result = await query(sql, [username])

    if (!result.rows[0]) {
      return Response.json(
        { ok: false, message: 'Invalid login.' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Hash comparison
    if (!bcrypt.compareSync(password, user.password)) {
      return Response.json(
        { ok: false, message: 'Invalid login.' },
        { status: 401 }
      )
    }

    // Don't send password back to the client
    delete user.password

    const headers = new Headers()
    headers.append(
      'set-cookie',
      `user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax`
    )
    headers.append(
      'set-cookie',
      `role=${user.role}; Path=/; HttpOnly; SameSite=Lax`
    )

    return Response.json(
      {
        ok: true,
        user
      },
      { headers }
    )
  } catch (reason) {
    return serviceFailure(reason)
  }
}
