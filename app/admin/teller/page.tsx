'use client'

import { useEffect, useState } from 'react'

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

export default function TellerPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountNumber, setAccountNumber] = useState('')
  const [opType, setOpType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    ok: boolean
    message: string
    newBalance?: string
    transactionId?: number
  } | null>(null)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCustomers(d.customers)
      })
  }, [])

  useEffect(() => {
    if (!selectedCustomerId) {
      setAccounts([])
      setAccountNumber('')
      return
    }
    fetch(`/api/admin/customers?userId=${selectedCustomerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setAccounts(d.accounts)
          if (d.accounts.length > 0)
            setAccountNumber(d.accounts[0].account_number)
        }
      })
  }, [selectedCustomerId])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountNumber) {
      showToast('Select an account', 'error')
      return
    }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }

    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          amount,
          type: opType,
          description: description || `Admin ${opType}`
        })
      })
      const d = await res.json()
      if (d.ok) {
        setResult({
          ok: true,
          message: d.message,
          newBalance: d.newBalance,
          transactionId: d.transactionId
        })
        setAmount('')
        setDescription('')
      } else {
        setResult({ ok: false, message: d.message || 'Operation failed' })
      }
    } catch {
      setResult({ ok: false, message: 'Network error' })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedAccount = accounts.find(
    (a) => a.account_number === accountNumber
  )

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.9rem',
    borderRadius: 10,
    border: '1.5px solid #E3E8EE',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const
  }
  const labelStyle = {
    display: 'block' as const,
    fontWeight: 600,
    fontSize: '0.8rem',
    color: '#4F5D75',
    marginBottom: '0.4rem'
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

      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#0A2540',
          marginBottom: '0.4rem'
        }}
      >
        Teller Operations
      </h1>
      <p
        style={{ color: '#4F5D75', fontSize: '0.875rem', marginBottom: '2rem' }}
      >
        Post deposits and withdrawals to customer accounts. Every operation is
        audited.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          maxWidth: 900
        }}
      >
        {/* Form */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <h2
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: '#0A2540',
              marginBottom: '1.25rem'
            }}
          >
            New Posting
          </h2>
          <form
            onSubmit={handlePost}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label style={labelStyle}>Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} (@{c.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Account</label>
              <select
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={inputStyle}
                disabled={accounts.length === 0}
              >
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.account_number} value={a.account_number}>
                    {a.account_name} — {a.account_number} (Rs.{' '}
                    {Number(a.balance).toLocaleString()}){' '}
                    {a.is_frozen ? '[FROZEN]' : ''}
                  </option>
                ))}
              </select>
              {selectedAccount?.is_frozen && (
                <p
                  style={{
                    color: '#E63946',
                    fontSize: '0.75rem',
                    marginTop: '0.3rem'
                  }}
                >
                  ⚠ This account is frozen. Unfreeze it in Customer Management
                  before posting.
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Operation Type</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(['deposit', 'withdrawal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOpType(t)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: 10,
                      border: '1.5px solid',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      borderColor:
                        opType === t
                          ? t === 'deposit'
                            ? '#0D8A6B'
                            : '#E63946'
                          : '#E3E8EE',
                      background:
                        opType === t
                          ? t === 'deposit'
                            ? '#D1F2EB'
                            : '#FAD2D5'
                          : 'white',
                      color:
                        opType === t
                          ? t === 'deposit'
                            ? '#0D8A6B'
                            : '#E63946'
                          : '#4F5D75'
                    }}
                  >
                    {t === 'deposit' ? '+ Deposit' : '− Withdrawal'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Amount (Rs.)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Description / Reason</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Admin ${opType}`}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || selectedAccount?.is_frozen}
              style={{
                padding: '0.75rem',
                borderRadius: 12,
                border: 'none',
                background: '#0A2540',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                opacity: submitting ? 0.7 : 1,
                marginTop: '0.25rem',
                transition: 'opacity 0.2s'
              }}
            >
              {submitting
                ? 'Processing…'
                : `Post ${opType.charAt(0).toUpperCase() + opType.slice(1)}`}
            </button>
          </form>
        </div>

        {/* Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result && (
            <div
              style={{
                background: result.ok ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${result.ok ? '#86efac' : '#fca5a5'}`,
                borderRadius: 16,
                padding: '1.5rem'
              }}
            >
              <p
                style={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: result.ok ? '#0D8A6B' : '#E63946',
                  marginBottom: '0.5rem'
                }}
              >
                {result.ok ? '✓ Posted Successfully' : '✗ Operation Failed'}
              </p>
              <p
                style={{
                  color: '#4F5D75',
                  fontSize: '0.875rem',
                  marginBottom: result.ok ? '0.75rem' : 0
                }}
              >
                {result.message}
              </p>
              {result.ok && (
                <div style={{ fontSize: '0.8rem', color: '#4F5D75' }}>
                  <p>
                    New Balance:{' '}
                    <strong style={{ color: '#0A2540' }}>
                      Rs. {Number(result.newBalance).toLocaleString()}
                    </strong>
                  </p>
                  <p style={{ marginTop: '0.25rem' }}>
                    Transaction ID: <strong>#{result.transactionId}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedAccount && (
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <h3
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#4F5D75',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '1rem'
                }}
              >
                Selected Account
              </h3>
              <p
                style={{ fontWeight: 700, color: '#0A2540', fontSize: '1rem' }}
              >
                {selectedAccount.account_name}
              </p>
              <p
                style={{
                  color: '#4F5D75',
                  fontSize: '0.8rem',
                  marginTop: '0.2rem'
                }}
              >
                {selectedAccount.account_number}
              </p>
              <p style={{ color: '#4F5D75', fontSize: '0.8rem' }}>
                {selectedAccount.account_type}
              </p>
              <p
                style={{
                  fontWeight: 800,
                  color: '#0A2540',
                  fontSize: '1.5rem',
                  marginTop: '0.75rem'
                }}
              >
                Rs. {Number(selectedAccount.balance).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
