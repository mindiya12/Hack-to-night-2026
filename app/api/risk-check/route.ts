import { asText, query, serviceFailure } from '@/lib/platform-db'
import { getSessionUserId } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const body = await request.json().catch(() => ({}))
    const fromAccount = asText(body.fromAccount || body.from)
    const toAccount = asText(body.toAccount || body.to)
    const amount = parseFloat(asText(body.amount || '0'))

    let riskScore = 0
    let reasons: string[] = []
    let firstTime = false

    // 1. Check if recipient is in scam list
    const scamCheck = await query(
      'SELECT reason FROM scam_accounts WHERE account_number = $1',
      [toAccount]
    )
    if (scamCheck.rows.length > 0) {
      riskScore += 60
      reasons.push(
        `Recipient is flagged as a known scam account: ${scamCheck.rows[0].reason}`
      )
    }

    // 2. Check if first time recipient
    const prevTx = await query(
      'SELECT COUNT(*) FROM transactions WHERE from_account = $1 AND to_account = $2',
      [fromAccount, toAccount]
    )
    if (parseInt(prevTx.rows[0].count) === 0) {
      firstTime = true
      riskScore += 30
      reasons.push('You have never sent money to this account before.')
    }

    // 3. Amount > 3x average
    const avgTx = await query(
      'SELECT AVG(amount) as avg FROM transactions WHERE from_account = $1',
      [fromAccount]
    )
    const avg = parseFloat(avgTx.rows[0].avg || '0')
    if (avg > 0 && amount > avg * 3) {
      riskScore += 25
      reasons.push(
        `Amount is unusually high compared to your typical transfers.`
      )
    }

    // 4. Round "prize-like" amounts
    if (amount === 500000 || amount === 1000000 || amount === 100000) {
      riskScore += 15
      reasons.push(
        'The amount matches patterns often used in prize/lottery scams.'
      )
    }

    // 5. Time between 11pm - 5am local time. Assume server time.
    const hour = new Date().getHours()
    if (hour >= 23 || hour < 5) {
      riskScore += 10
      reasons.push(
        'Transfer is occurring late at night, which is typical for emergency scams.'
      )
    }

    // 6. 3+ transfers from this account in the last 10 minutes
    const rapidCheck = await query(
      `SELECT COUNT(*) FROM transactions
       WHERE from_account = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
      [fromAccount]
    )
    if (parseInt(rapidCheck.rows[0].count) >= 3) {
      riskScore += 35
      reasons.push(
        'Multiple transfers have been made from this account in the last 10 minutes — unusual activity.'
      )
    }

    let level = 'LOW'
    if (riskScore >= 60) level = 'HIGH'
    else if (riskScore >= 30) level = 'MEDIUM'

    return Response.json({
      ok: true,
      riskScore,
      level,
      reasons,
      firstTime
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}
