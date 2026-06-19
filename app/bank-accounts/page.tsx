'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import RouteGuard from '@/components/RouteGuard'
import styles from './accounts.module.css'

const typeLabel: Record<string, string> = {
  savings: 'Savings Account',
  current: 'Current Account',
  fixed_deposit: 'Fixed Deposit'
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF4D6', color: '#FFB800' },
  approved: { bg: '#D1F2EB', color: '#0D8A6B' },
  rejected: { bg: '#FAD2D5', color: '#E63946' }
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [showRequest, setShowRequest] = useState(false)
  const [requestedType, setRequestedType] = useState('savings')
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const load = () => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setAccounts(d.accounts || [])
      })
    fetch('/api/account-applications')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setApplications(d.applications || [])
      })
  }

  useEffect(() => {
    load()
  }, [])

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/account-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedType })
      })
      const d = await res.json()
      if (d.ok) {
        setStatusMsg({
          type: 'success',
          text: 'Your application has been submitted. The bank will review it shortly.'
        })
        setShowRequest(false)
        load()
      } else {
        setStatusMsg({
          type: 'error',
          text: d.message || 'Failed to submit application.'
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RouteGuard>
      <main className={styles.accountsPage}>
        <Sidebar />
        <section className={styles.content}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>My Accounts</h1>
            <button
              onClick={() => {
                setShowRequest(!showRequest)
                setStatusMsg(null)
              }}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 999,
                border: 'none',
                background: '#0A2540',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {showRequest ? 'Cancel' : '+ Request New Account'}
            </button>
          </header>

          {/* Inline status message */}
          {statusMsg && (
            <div
              role="alert"
              style={{
                margin: '0.75rem 0',
                padding: '0.75rem 1.25rem',
                borderRadius: 12,
                background:
                  statusMsg.type === 'success' ? '#D1F2EB' : '#FAD2D5',
                color: statusMsg.type === 'success' ? '#0D8A6B' : '#E63946',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{statusMsg.text}</span>
              <button
                onClick={() => setStatusMsg(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Request New Account Form */}
          {showRequest && (
            <div
              style={{
                background: 'white',
                borderRadius: 20,
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                maxWidth: 480
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
                Request a New Account
              </h2>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#4F5D75',
                  marginBottom: '1rem'
                }}
              >
                Account opening is subject to bank review. You will see the
                result in your Applications below.
              </p>
              <form onSubmit={handleRequest}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#4F5D75',
                    marginBottom: '0.4rem'
                  }}
                >
                  Account Type
                </label>
                <select
                  value={requestedType}
                  onChange={(e) => setRequestedType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: 10,
                    border: '1.5px solid #E3E8EE',
                    fontSize: '0.9rem',
                    outline: 'none',
                    marginBottom: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                  <option value="fixed_deposit">Fixed Deposit</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: 999,
                    border: 'none',
                    background: '#0A2540',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </form>
            </div>
          )}

          {/* Account Cards */}
          {accounts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#A0AAB5'
              }}
            >
              <p
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}
              >
                No accounts yet
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                Request a new account above — the bank team will review and open
                it for you.
              </p>
            </div>
          ) : (
            <div className={styles.cardsContainer}>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={styles.accountCard}
                  style={{ opacity: acc.is_frozen ? 0.75 : 1 }}
                >
                  <div className={styles.accountCardContent}>
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        display: 'flex',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end'
                      }}
                    >
                      <span
                        style={{
                          background: '#f3e8f3',
                          color: '#0A2540',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4
                        }}
                      >
                        {typeLabel[acc.account_type] || acc.account_type}
                      </span>
                      {acc.is_frozen && (
                        <span
                          style={{
                            background: '#FAD2D5',
                            color: '#E63946',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4
                          }}
                        >
                          FROZEN
                        </span>
                      )}
                    </div>
                    <h2 className={styles.accountName}>{acc.account_name}</h2>
                    <div className={styles.accountAvatar}>
                      <img
                        src="/account-logo.png"
                        alt="account"
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <p className={styles.accountDetails}>
                      Account: {acc.account_number}
                      <br />
                      Balance: Rs. {Number(acc.balance).toLocaleString()}
                    </p>
                    {acc.is_frozen && (
                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: '#E63946',
                          marginTop: '0.5rem',
                          fontWeight: 600
                        }}
                      >
                        This account is frozen. Contact the bank for assistance.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Applications History */}
          {applications.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h2
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#0A2540',
                  marginBottom: '1rem'
                }}
              >
                My Applications
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                {applications.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: 'white',
                      borderRadius: 14,
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontWeight: 700,
                          color: '#0A2540',
                          fontSize: '0.875rem'
                        }}
                      >
                        {typeLabel[a.requested_type] || a.requested_type}
                      </p>
                      <p
                        style={{
                          color: '#A0AAB5',
                          fontSize: '0.75rem',
                          marginTop: '0.2rem'
                        }}
                      >
                        Applied {new Date(a.created_at).toLocaleDateString()}
                      </p>
                      {a.reject_reason && (
                        <p
                          style={{
                            color: '#E63946',
                            fontSize: '0.75rem',
                            marginTop: '0.2rem'
                          }}
                        >
                          Reason: {a.reject_reason}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 6,
                        background: statusColors[a.status]?.bg || '#f3f4f6',
                        color: statusColors[a.status]?.color || '#4F5D75'
                      }}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </RouteGuard>
  )
}
