'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Message = { role: 'user' | 'assistant'; content: string }

const HIDDEN_PATHS = [
  '/login',
  '/sign-up',
  '/signup',
  '/register',
  '/forgot-password',
  '/reset-password'
]

export default function Chatbot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Hide on auth pages — after all hooks
  const shouldHide = HIDDEN_PATHS.some((p) => pathname?.includes(p))
  if (shouldHide) return null

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = userInput.trim()
    if (!text || isLoading) return

    const updated: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setUserInput('')
    setIsLoading(true)

    // Placeholder for the streaming assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated })
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.'
          }
          return copy
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const json = JSON.parse(data)
            const token: string = json?.choices?.[0]?.delta?.content ?? ''
            if (token) {
              fullText += token
              setMessages((prev) => {
                const copy = [...prev]
                copy[copy.length - 1] = { role: 'assistant', content: fullText }
                return copy
              })
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (!fullText) {
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: 'I did not receive a response. Please try again.'
          }
          return copy
        })
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          content: 'Network error. Please check your connection.'
        }
        return copy
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canSend = userInput.trim().length > 0 && !isLoading

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          backgroundColor: '#0A2540',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 4px 16px rgba(10,37,64,0.35)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(10,37,64,0.4)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,37,64,0.35)'
        }}
        aria-label="Toggle AI Support Chat"
      >
        {isOpen ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '360px',
            height: '520px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            border: '1px solid #E3E8EE'
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#0A2540',
              padding: '14px 20px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#00D4AA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A2540"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                Nova Assistant
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.75 }}>
                Powered by Groq · Always online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#F6F9FC',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {messages.length === 0 && !isLoading && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#4F5D75',
                  marginTop: 'auto',
                  marginBottom: 'auto',
                  fontSize: '0.875rem',
                  lineHeight: 1.6
                }}
              >
                👋 Hi! I&apos;m <strong>Nova</strong>, your banking assistant.
                <br />
                How can I help you today?
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.role === 'user' ? '#0A2540' : '#FFFFFF',
                  color: m.role === 'user' ? '#FFFFFF' : '#0A2540',
                  padding: '10px 14px',
                  borderRadius:
                    m.role === 'user'
                      ? '12px 12px 4px 12px'
                      : '12px 12px 12px 4px',
                  maxWidth: '82%',
                  border: m.role === 'user' ? 'none' : '1px solid #E3E8EE',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  boxShadow:
                    m.role === 'user'
                      ? '0 2px 8px rgba(10,37,64,0.15)'
                      : '0 1px 4px rgba(0,0,0,0.04)',
                  minHeight: '20px'
                }}
              >
                {m.content ||
                  (isLoading && i === messages.length - 1 ? (
                    <span
                      style={{
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                        padding: '2px 0'
                      }}
                    >
                      {[0, 0.15, 0.3].map((delay, j) => (
                        <span
                          key={j}
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#00D4AA',
                            display: 'inline-block',
                            animation: `chatbotBounce 1s ${delay}s infinite`
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    ''
                  ))}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '12px 16px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E3E8EE',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask Nova anything…"
              autoComplete="off"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #E3E8EE',
                outline: 'none',
                fontSize: '0.875rem',
                backgroundColor: '#F6F9FC',
                color: '#0A2540',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00D4AA')}
              onBlur={(e) => (e.target.style.borderColor = '#E3E8EE')}
            />
            <button
              type="submit"
              disabled={!canSend}
              style={{
                backgroundColor: canSend ? '#0A2540' : '#A0AAB5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) =>
                canSend && (e.currentTarget.style.backgroundColor = '#143A5C')
              }
              onMouseOut={(e) =>
                canSend && (e.currentTarget.style.backgroundColor = '#0A2540')
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes chatbotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
