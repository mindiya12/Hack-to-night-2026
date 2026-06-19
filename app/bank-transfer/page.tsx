'use client'

import { useEffect, useState } from 'react'
import RouteGuard from '@/components/RouteGuard'
import Sidebar from '@/components/sidebar'

type Step = 'form' | 'otp' | 'success' | 'failure'

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label
        style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#4F5D75',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 12,
  border: '1.5px solid #E3E8EE',
  fontSize: '0.95rem',
  outline: 'none',
  background: 'white',
  color: '#0A2540',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
}

export default function BankTransfer() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [otp, setOtp] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState('')
  const [confirmationId, setConfirmationId] = useState('')
  const [failReason, setFailReason] = useState('')

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.accounts?.length) {
          setAccounts(d.accounts)
          setFromAccount(d.accounts[0].account_number)
        }
      })
  }, [])

  const selectedAccount = accounts.find((a) => a.account_number === fromAccount)

  function validate() {
    if (!fromAccount) {
      setError('Select a source account')
      return false
    }
    if (!toAccount || !/^\d{6,}$/.test(toAccount)) {
      setError('Enter a valid destination account number (min 6 digits)')
      return false
    }
    if (fromAccount === toAccount) {
      setError('Source and destination accounts cannot be the same')
      return false
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount greater than 0')
      return false
    }
    return true
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setSendingOtp(true)
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'transfer' })
      })
      const d = await res.json()
      if (d.ok) {
        setMaskedEmail(d.maskedEmail)
        setStep('otp')
      } else {
        setError(d.message || 'Failed to send OTP')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otp.trim()) {
      setError('Enter the OTP sent to your email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount,
          description,
          otp
        })
      })
      const d = await res.json()
      if (d.ok) {
        setConfirmationId(d.transaction.id.toString())
        setStep('success')
      } else {
        setFailReason(d.message || 'Transfer failed')
        setStep('failure')
      }
    } catch {
      setFailReason('Network error. Try again.')
      setStep('failure')
    } finally {
      setLoading(false)
    }
  }

  async function resendOtp() {
    setError('')
    setSendingOtp(true)
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'transfer' })
      })
      const d = await res.json()
      if (d.ok) setMaskedEmail(d.maskedEmail)
      else setError(d.message || 'Failed to resend OTP')
    } catch {
      setError('Network error.')
    } finally {
      setSendingOtp(false)
    }
  }

  function reset() {
    setFromAccount(accounts[0]?.account_number || '')
    setToAccount('')
    setAmount('')
    setDescription('')
    setOtp('')
    setMaskedEmail('')
    setError('')
    setConfirmationId('')
    setFailReason('')
    setStep('form')
  }

  return (
    <RouteGuard>
      <div
        style={{ display: 'flex', minHeight: '100vh', background: '#F6F9FC' }}
      >
        <Sidebar />
        <main
          style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0A2540',
              marginBottom: '1.5rem'
            }}
          >
            Bank Transfer
          </h1>

          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {step === 'form' && (
              <form
                onSubmit={handleNext}
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '2rem',
                  boxShadow: '0 2px 16px rgba(10,37,64,0.07)'
                }}
              >
                <h2
                  style={{
                    fontWeight: 700,
                    color: '#0A2540',
                    margin: '0 0 1.5rem',
                    fontSize: '1.1rem'
                  }}
                >
                  Transfer Details
                </h2>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}
                >
                  <Field label="From Account">
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      style={{ ...inputStyle, background: 'white' }}
                    >
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a.account_number} value={a.account_number}>
                          {a.account_name} — {a.account_number} (Rs.{' '}
                          {Number(a.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Destination Account Number">
                    <input
                      value={toAccount}
                      onChange={(e) => setToAccount(e.target.value)}
                      placeholder="Enter account number"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Amount (Rs.)">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Description (optional)">
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this for?"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {error && (
                  <p
                    style={{
                      color: '#E63946',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginTop: '1rem',
                      marginBottom: 0
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sendingOtp}
                  style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#0A2540',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    opacity: sendingOtp ? 0.7 : 1
                  }}
                >
                  {sendingOtp ? 'Sending OTP…' : 'Continue →'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '2rem',
                  boxShadow: '0 2px 16px rgba(10,37,64,0.07)'
                }}
              >
                {/* Transfer Summary */}
                <div
                  style={{
                    background: '#F6F9FC',
                    borderRadius: 16,
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 0.75rem',
                      fontWeight: 700,
                      color: '#0A2540',
                      fontSize: '0.9rem'
                    }}
                  >
                    Transfer Summary
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    {[
                      [
                        'From',
                        `${selectedAccount?.account_name || fromAccount} (${fromAccount})`
                      ],
                      ['To', toAccount],
                      ['Amount', `Rs. ${Number(amount).toLocaleString()}`],
                      ...(description ? [['Note', description]] : [])
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span style={{ color: '#4F5D75' }}>{k}</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: '#0A2540',
                            textAlign: 'right',
                            maxWidth: '60%',
                            wordBreak: 'break-all'
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OTP Input */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p
                    style={{
                      color: '#4F5D75',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Enter the 6-digit OTP sent to
                  </p>
                  <p
                    style={{
                      color: '#0A2540',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {maskedEmail}
                  </p>

                  <form onSubmit={handleTransfer}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="000000"
                      style={{
                        ...inputStyle,
                        textAlign: 'center',
                        fontSize: '2rem',
                        fontWeight: 800,
                        letterSpacing: '0.5rem',
                        padding: '0.75rem',
                        color: '#0A2540'
                      }}
                    />

                    {error && (
                      <p
                        style={{
                          color: '#E63946',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          marginTop: '0.75rem'
                        }}
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      style={{
                        marginTop: '1.25rem',
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: 999,
                        border: 'none',
                        background: '#0A2540',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        opacity: loading || otp.length < 6 ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Processing…' : 'Confirm Transfer'}
                    </button>
                  </form>

                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                  >
                    <button
                      onClick={() => {
                        setStep('form')
                        setOtp('')
                        setError('')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4F5D75',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={resendOtp}
                      disabled={sendingOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0A2540',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        opacity: sendingOtp ? 0.6 : 1
                      }}
                    >
                      {sendingOtp ? 'Resending…' : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 16px rgba(10,37,64,0.07)'
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#D1F2EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    margin: '0 auto 1.25rem'
                  }}
                >
                  ✓
                </div>
                <h2
                  style={{
                    fontWeight: 800,
                    color: '#0D8A6B',
                    margin: '0 0 0.5rem'
                  }}
                >
                  Transfer Successful!
                </h2>
                <p
                  style={{
                    color: '#4F5D75',
                    fontSize: '0.875rem',
                    margin: '0 0 1.5rem'
                  }}
                >
                  Confirmation #{confirmationId}
                </p>
                <button
                  onClick={reset}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#0A2540',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Make Another Transfer
                </button>
              </div>
            )}

            {step === 'failure' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 16px rgba(10,37,64,0.07)'
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#FAD2D5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    margin: '0 auto 1.25rem'
                  }}
                >
                  ✕
                </div>
                <h2
                  style={{
                    fontWeight: 800,
                    color: '#E63946',
                    margin: '0 0 0.5rem'
                  }}
                >
                  Transfer Failed
                </h2>
                <p
                  style={{
                    color: '#4F5D75',
                    fontSize: '0.9rem',
                    margin: '0 0 1.5rem'
                  }}
                >
                  {failReason}
                </p>
                <button
                  onClick={reset}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#E63946',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </RouteGuard>
  )
}
