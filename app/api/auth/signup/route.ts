import bcrypt from 'bcryptjs'
import { asText, query, serviceFailure } from '@/lib/platform-db'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    if (!checkRateLimit(`signup:${ip}`, 5, 3_600_000)) {
      return Response.json(
        { ok: false, message: 'Too many sign-up attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const username = asText(body.username)
    const password = asText(body.password)
    const fullName = asText(body.fullName)
    const email = asText(body.email)
    const nic = asText(body.nic)

    if (!username || !password || !fullName || !email) {
      return Response.json(
        { ok: false, message: 'Missing fields.' },
        { status: 400 }
      )
    }

    const hashedPwd = bcrypt.hashSync(password, 10)

    const sql = `
      INSERT INTO users (username, password, full_name, email, nic)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, role, full_name, email
    `
    try {
      const result = await query(sql, [
        username,
        hashedPwd,
        fullName,
        email,
        nic
      ])
      const user = result.rows[0]

      const headers = new Headers()
      headers.append(
        'set-cookie',
        `user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax`
      )
      headers.append(
        'set-cookie',
        `role=${user.role}; Path=/; HttpOnly; SameSite=Lax`
      )

      return Response.json({ ok: true, user }, { headers })
    } catch (e: any) {
      if (e.code === '23505') {
        // Unique violation
        return Response.json(
          { ok: false, message: 'Username or email already exists.' },
          { status: 409 }
        )
      }
      throw e
    }
  } catch (reason) {
    return serviceFailure(reason)
  }
}
