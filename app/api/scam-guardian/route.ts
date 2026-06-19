import { getSessionUserId } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const userId = getSessionUserId(request)
    if (!userId)
      return Response.json(
        { ok: false, message: 'Unauthorized' },
        { status: 401 }
      )

    const { amount, toAccount, reasons, firstTime } = await request.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({
        ok: false,
        message:
          'Guardian is currently offline. Add ANTHROPIC_API_KEY to .env.local to enable.'
      })
    }

    const systemPrompt = `You are the Nova Bank Scam Guardian. You protect Sri Lankan bank customers from fraud. Known SL scam patterns: fake prize wins, fake CEB/utility bills, fake bank OTP calls, loan scams, job offer advance-fee fraud. Given a transaction context, explain in simple English (and optionally Sinhala) why this transfer might be risky and what the customer should check. Be direct, warm, and under 120 words.`

    const userPrompt = `Transfer of Rs.${amount} to account ${toAccount}.
Risk factors detected: ${reasons.join(', ')}.
First time sending to this recipient: ${firstTime}.
Is this suspicious? What should I check?`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    const data = await response.json()
    return Response.json({
      ok: true,
      explanation:
        data.content?.[0]?.text || "We couldn't generate an explanation."
    })
  } catch (e) {
    return Response.json({ ok: false, message: 'Guardian error' })
  }
}
