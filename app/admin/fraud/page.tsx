'use client'

import { useState, useEffect } from 'react'

function Toast({
  msg,
  type,
  onClose
}: {
  msg: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 100,
        background: type === 'success' ? '#0D8A6B' : '#E63946',
        color: 'white',
        padding: '0.75rem 1.25rem',
        borderRadius: 12,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        maxWidth: 380
      }}
    >
      <span>{msg}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '1.1rem'
        }}
      >
        ×
      </button>
    </div>
  )
}

const riskRules = [
  {
    rule: 'Known Scam Account',
    points: 60,
    desc: 'Recipient is in the admin-managed scam blocklist.'
  },
  {
    rule: 'Rapid Transfers',
    points: 35,
    desc: '3+ transfers from this account within the last 10 minutes.'
  },
  {
    rule: 'First-Time Recipient',
    points: 30,
    desc: 'No previous transaction to this account from the sender.'
  },
  {
    rule: 'Unusually High Amount',
    points: 25,
    desc: "Amount exceeds 3× the sender's average transfer value."
  },
  {
    rule: 'Prize-Like Round Amount',
    points: 15,
    desc: 'Amount matches common scam patterns (Rs.100k, 500k, 1M).'
  },
  {
    rule: 'Late-Night Transfer',
    points: 10,
    desc: 'Transfer placed between 11 PM and 5 AM local time.'
  }
]

const thresholds = [
  {
    level: 'LOW',
    range: '0–30',
    color: '#0D8A6B',
    bg: '#D1F2EB',
    desc: 'Subtle green banner. Proceed normally.'
  },
  {
    level: 'MEDIUM',
    range: '31–59',
    color: '#FFB800',
    bg: '#FFF4D6',
    desc: 'Amber warning modal. "Ask Guardian" available.'
  },
  {
    level: 'HIGH',
    range: '60+',
    color: '#E63946',
    bg: '#FAD2D5',
    desc: 'Red block. Transfer paused. Guardian required to proceed.'
  }
]

export default function FraudPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accountNumber, setAccountNumber] = useState('')
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadReports = () => {
    fetch('/api/admin/scam-reports')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setReports(d.reports)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountNumber.trim() || !reason.trim()) {
      showToast('Both fields required', 'error')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/scam-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: accountNumber.trim(),
          reason: reason.trim()
        })
      })
      const d = await res.json()
      if (d.ok) {
        showToast(d.message, 'success')
        setAccountNumber('')
        setReason('')
        loadReports()
      } else showToast(d.message || 'Failed', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async () => {
    if (!pendingRemove) return
    const res = await fetch('/api/admin/scam-reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber: pendingRemove })
    })
    const d = await res.json()
    if (d.ok) {
      showToast(d.message, 'success')
      loadReports()
    } else showToast(d.message, 'error')
    setPendingRemove(null)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    borderRadius: 10,
    border: '1.5px solid #E3E8EE',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  return (
    <div style={{ padding: '2rem' }}>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {pendingRemove && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '2rem',
              maxWidth: 380,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                marginBottom: '0.5rem',
                color: '#0A2540'
              }}
            >
              Remove from blocklist?
            </p>
            <p
              style={{
                color: '#4F5D75',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}
            >
              {pendingRemove} will no longer be flagged during transfers.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}
            >
              <button
                onClick={() => setPendingRemove(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 10,
                  border: '1.5px solid #E3E8EE',
                  background: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#E63946',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#0A2540',
          marginBottom: '1.75rem'
        }}
      >
        Fraud Console
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '1.5rem'
        }}
      >
        {/* Left column */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Scam Blocklist */}
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#0A2540',
                marginBottom: '1rem'
              }}
            >
              Scam Account Blocklist
            </h2>

            <form
              onSubmit={handleAdd}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr auto',
                gap: '0.5rem',
                marginBottom: '1.25rem',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#4F5D75',
                    marginBottom: '0.3rem'
                  }}
                >
                  Account Number
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{ ...inputStyle, fontSize: '0.8rem' }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#4F5D75',
                    marginBottom: '0.3rem'
                  }}
                >
                  Reason
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Lottery scam"
                  style={{ ...inputStyle, fontSize: '0.8rem' }}
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0A2540',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  opacity: adding ? 0.7 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                + Add
              </button>
            </form>

            {loading ? (
              <p style={{ color: '#A0AAB5', fontSize: '0.875rem' }}>Loading…</p>
            ) : reports.length === 0 ? (
              <p style={{ color: '#A0AAB5', fontSize: '0.875rem' }}>
                No accounts on the blocklist.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxHeight: 320,
                  overflowY: 'auto'
                }}
              >
                {reports.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.7rem 0.9rem',
                      borderRadius: 10,
                      background: '#fef2f2',
                      border: '1px solid #fecaca'
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontWeight: 700,
                          color: '#E63946',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}
                      >
                        {r.account_number}
                      </p>
                      <p
                        style={{
                          color: '#4F5D75',
                          fontSize: '0.72rem',
                          marginTop: '0.1rem'
                        }}
                      >
                        {r.reason}
                      </p>
                      {r.reported_by_name && (
                        <p style={{ color: '#A0AAB5', fontSize: '0.68rem' }}>
                          Added by {r.reported_by_name} ·{' '}
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setPendingRemove(r.account_number)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E63946',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        opacity: 0.6,
                        transition: 'opacity 0.15s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseOut={(e) =>
                        (e.currentTarget.style.opacity = '0.6')
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Risk rules */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#0A2540',
                marginBottom: '1rem'
              }}
            >
              Risk Score Thresholds
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {thresholds.map((t) => (
                <div
                  key={t.level}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 10,
                    background: t.bg
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      color: t.color,
                      minWidth: 60
                    }}
                  >
                    {t.level} ({t.range})
                  </span>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: '#4F5D75',
                      lineHeight: 1.5
                    }}
                  >
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#0A2540',
                marginBottom: '1rem'
              }}
            >
              Active Detection Rules
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}
            >
              {riskRules.map((r) => (
                <div
                  key={r.rule}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 10,
                    background: '#F6F9FC',
                    border: '1px solid #f3e8f3'
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: '#0A2540'
                      }}
                    >
                      {r.rule}
                    </p>
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: '#4F5D75',
                        marginTop: '0.15rem',
                        lineHeight: 1.4
                      }}
                    >
                      {r.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      color:
                        r.points >= 50
                          ? '#E63946'
                          : r.points >= 25
                            ? '#FFB800'
                            : '#0D8A6B',
                      marginLeft: '0.75rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    +{r.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
