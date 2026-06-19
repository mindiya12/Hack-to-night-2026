'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Sidebar from '@/components/sidebar'
import RouteGuard from '@/components/RouteGuard'

type Screen = 'select' | 'form' | 'otp' | 'success' | 'failed'

type Biller = { id: string; name: string; logo: string }

const billers: Biller[] = [
  { id: 'water', name: 'Water Board', logo: '/billers/water-board.png' },
  { id: 'cable', name: 'Cable TV', logo: '/billers/cable-tv.png' },
  { id: 'ceb', name: 'CEB', logo: '/billers/ceb.png' },
  { id: 'airtel', name: 'Airtel', logo: '/billers/airtel.png' },
  { id: 'dialog', name: 'Dialog', logo: '/billers/dialog.png' },
  { id: 'slt', name: 'Sri Lanka Telecom', logo: '/billers/electricity.png' },
  { id: 'peotv', name: 'PEO TV', logo: '/billers/mpesa.png' },
  { id: 'hutch', name: 'Hutch', logo: '/billers/hutch.png' },
  { id: 'aia', name: 'AIA Insurance', logo: '/billers/aia.png' },
  { id: 'lolc', name: 'LOLC Finance', logo: '/billers/lolc.png' },
  { id: 'insurance2', name: 'Insurance', logo: '/billers/insurance2.png' },
  { id: 'hsbc', name: 'HSBC', logo: '/billers/hsbc.png' }
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: 12,
  border: '1.5px solid #e8e0e8',
  fontSize: '0.95rem',
  outline: 'none',
  background: 'white',
  color: '#1d0730',
  boxSizing: 'border-box'
}

function Field({
  label,
  error,
  children
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label
        style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#555',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <span
          style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600 }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

export default function PayBillsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [screen, setScreen] = useState<Screen>('select')
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [billId, setBillId] = useState('')
  const [dueAmount, setDueAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [otp, setOtp] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [failReason, setFailReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState('')

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

  function validateForm() {
    const e: Record<string, string> = {}
    if (!fromAccount) e.fromAccount = 'Select a source account'
    if (!accountNumber.trim()) e.accountNumber = 'Account number is required'
    if (!billId.trim()) e.billId = 'Bill ID is required'
    if (!dueAmount || isNaN(Number(dueAmount)) || Number(dueAmount) <= 0)
      e.dueAmount = 'Enter a valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleNext() {
    if (!validateForm()) return
    setIsProcessing(true)
    setError('')
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'payment' })
      })
      const d = await res.json()
      if (d.ok) {
        setMaskedEmail(d.maskedEmail)
        setOtp('')
        setScreen('otp')
      } else setError(d.message || 'Failed to send OTP')
    } catch {
      setError('Network error. Try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (otp.length < 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    setIsProcessing(true)
    try {
      const description = `BILL PAY: ${selectedBiller?.name} — Acct ${accountNumber} — Bill ${billId}${remarks ? ' — ' + remarks : ''}`
      const res = await fetch('/api/pay-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          amount: dueAmount,
          description,
          otp
        })
      })
      const d = await res.json()
      if (d.ok) {
        setConfirmationNumber(d.transaction.id.toString())
        setScreen('success')
      } else {
        setFailReason(d.message || 'Payment failed')
        setScreen('failed')
      }
    } catch {
      setFailReason('Network error. Try again.')
      setScreen('failed')
    } finally {
      setIsProcessing(false)
    }
  }

  async function resendOtp() {
    setSendingOtp(true)
    setError('')
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'payment' })
      })
      const d = await res.json()
      if (d.ok) setMaskedEmail(d.maskedEmail)
      else setError(d.message || 'Failed to resend')
    } catch {
      setError('Network error.')
    } finally {
      setSendingOtp(false)
    }
  }

  function resetToHome() {
    setScreen('select')
    setSelectedBiller(null)
    setAccountNumber('')
    setBillId('')
    setDueAmount('')
    setRemarks('')
    setOtp('')
    setErrors({})
    setError('')
  }

  return (
    <RouteGuard>
      <div
        style={{ display: 'flex', minHeight: '100vh', background: '#f5f0f7' }}
      >
        <Sidebar />
        <main
          style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#1d0730',
              marginBottom: '1.5rem'
            }}
          >
            Pay Bills
          </h1>

          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {/* Biller Selection */}
            {screen === 'select' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '1.5rem',
                  boxShadow: '0 2px 16px rgba(69,0,67,0.07)'
                }}
              >
                <p
                  style={{
                    color: '#888',
                    fontSize: '0.875rem',
                    marginBottom: '1.25rem',
                    marginTop: 0
                  }}
                >
                  Select a biller to get started
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem'
                  }}
                >
                  {billers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBiller(b)
                        setScreen('form')
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 0.5rem',
                        borderRadius: 16,
                        border: '1.5px solid #f0e8f0',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        ;(
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = '#9a5c97'
                        ;(
                          e.currentTarget as HTMLButtonElement
                        ).style.background = '#faf0fa'
                      }}
                      onMouseOut={(e) => {
                        ;(
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = '#f0e8f0'
                        ;(
                          e.currentTarget as HTMLButtonElement
                        ).style.background = 'white'
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: '#f9f0f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                      >
                        <Image
                          src={b.logo}
                          alt={b.name}
                          width={36}
                          height={36}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#1d0730',
                          textAlign: 'center',
                          lineHeight: 1.3
                        }}
                      >
                        {b.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bill Form */}
            {screen === 'form' && selectedBiller && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '2rem',
                  boxShadow: '0 2px 16px rgba(69,0,67,0.07)'
                }}
              >
                <button
                  onClick={() => setScreen('select')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  ← Back to billers
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: '#f9f0f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    <Image
                      src={selectedBiller.logo}
                      alt={selectedBiller.name}
                      width={36}
                      height={36}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontWeight: 800,
                        color: '#1d0730',
                        fontSize: '1.05rem',
                        margin: 0
                      }}
                    >
                      {selectedBiller.name}
                    </p>
                    <p
                      style={{
                        color: '#9a5c97',
                        fontSize: '0.8rem',
                        margin: 0
                      }}
                    >
                      Bill Payment
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <Field label="Pay From Account" error={errors.fromAccount}>
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

                  <Field label="Account Number" error={errors.accountNumber}>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Customer account number"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Bill ID / Reference" error={errors.billId}>
                    <input
                      value={billId}
                      onChange={(e) => setBillId(e.target.value)}
                      placeholder="Bill reference number"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Amount (Rs.)" error={errors.dueAmount}>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={dueAmount}
                      onChange={(e) => setDueAmount(e.target.value)}
                      placeholder="0.00"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Remarks (optional)">
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional note"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {error && (
                  <p
                    style={{
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginTop: '0.75rem'
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  onClick={handleNext}
                  disabled={isProcessing}
                  style={{
                    marginTop: '1.5rem',
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#450043',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? 'Sending OTP…' : 'Continue →'}
                </button>
              </div>
            )}

            {/* OTP Screen */}
            {screen === 'otp' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '2rem',
                  boxShadow: '0 2px 16px rgba(69,0,67,0.07)'
                }}
              >
                {/* Payment Summary */}
                <div
                  style={{
                    background: '#f9f0f9',
                    borderRadius: 16,
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 0.75rem',
                      fontWeight: 700,
                      color: '#1d0730',
                      fontSize: '0.9rem'
                    }}
                  >
                    Payment Summary
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    {[
                      ['Biller', selectedBiller?.name || ''],
                      [
                        'From',
                        `${selectedAccount?.account_name || fromAccount} (${fromAccount})`
                      ],
                      ['Amount', `Rs. ${Number(dueAmount).toLocaleString()}`],
                      ['Bill ID', billId],
                      ...(remarks ? [['Remarks', remarks]] : [])
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span style={{ color: '#888', flexShrink: 0 }}>
                          {k}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: '#1d0730',
                            textAlign: 'right',
                            marginLeft: '1rem',
                            wordBreak: 'break-word'
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OTP Input */}
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      color: '#555',
                      fontSize: '0.9rem',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Enter the 6-digit OTP sent to
                  </p>
                  <p
                    style={{
                      color: '#450043',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {maskedEmail}
                  </p>

                  <form onSubmit={handlePay}>
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
                        color: '#450043'
                      }}
                    />

                    {error && (
                      <p
                        style={{
                          color: '#dc2626',
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
                      disabled={isProcessing || otp.length < 6}
                      style={{
                        marginTop: '1.25rem',
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: 999,
                        border: 'none',
                        background: '#450043',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        opacity: isProcessing || otp.length < 6 ? 0.6 : 1
                      }}
                    >
                      {isProcessing ? 'Processing…' : 'Confirm Payment'}
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
                        setScreen('form')
                        setOtp('')
                        setError('')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
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
                        color: '#450043',
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

            {/* Success */}
            {screen === 'success' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 16px rgba(69,0,67,0.07)'
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#dcfce7',
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
                    color: '#166534',
                    margin: '0 0 0.5rem'
                  }}
                >
                  Payment Successful!
                </h2>
                <p
                  style={{
                    color: '#888',
                    fontSize: '0.875rem',
                    margin: '0 0 1.5rem'
                  }}
                >
                  Confirmation #{confirmationNumber}
                </p>
                <button
                  onClick={resetToHome}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#450043',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Pay Another Bill
                </button>
              </div>
            )}

            {/* Failed */}
            {screen === 'failed' && (
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 16px rgba(69,0,67,0.07)'
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#fee2e2',
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
                    color: '#991b1b',
                    margin: '0 0 0.5rem'
                  }}
                >
                  Payment Failed
                </h2>
                <p
                  style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    margin: '0 0 1.5rem'
                  }}
                >
                  {failReason}
                </p>
                <button
                  onClick={resetToHome}
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#dc2626',
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
