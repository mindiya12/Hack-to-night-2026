export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const { messages } = await req.json()

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are Nova, an intelligent, professional, and helpful customer support AI for Nova Bank. You provide concise, clear, and reassuring answers to banking customers. Do not make up personal user data. Keep responses brief and friendly.'
          },
          ...messages
        ],
        stream: true
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Groq API error:', err)
      return new Response(JSON.stringify({ error: 'Groq API error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Pipe the Groq SSE stream directly to the client
    return new Response(res.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
