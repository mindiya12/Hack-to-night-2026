'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../components/sidebar'
import { getSession, SessionUser, useHydrated } from '@/lib/auth'
import RouteGuard from '@/components/RouteGuard'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function QuickAction({
  icon,
  label,
  href
}: {
  icon: string
  label: string
  href: string
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '1rem 0.75rem',
        borderRadius: 20,
        border: '1.5px solid #E3E8EE',
        background: 'white',
        cursor: 'pointer',
        flex: 1,
        minWidth: 80,
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#00D4AA'
        ;(e.currentTarget as HTMLButtonElement).style.background = '#F6F9FC'
      }}
      onMouseOut={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#E3E8EE'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
      }}
    >
      <span style={{ fontSize: '1.6rem' }}>{icon}</span>
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#0A2540',
          textAlign: 'center',
          lineHeight: 1.3
        }}
      >
        {label}
      </span>
    </button>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const isHydrated = useHydrated()
  const user = typeof window !== 'undefined' ? getSession() : null
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(0)

  useEffect(() => {
    if (!isHydrated || !user) return

    fetch('/api/accounts')
      .then((r) => r.json())
      .then((accRes) => {
        if (accRes.ok && accRes.accounts?.length) {
          setAccounts(accRes.accounts)
          return fetch(
            `/api/transactions?account=${accRes.accounts[0].account_number}&limit=6`
          )
            .then((r) => r.json())
            .then((t) => {
              if (t.ok) setTransactions(t.transactions)
            })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, isHydrated])

  const totalBalance = accounts.reduce(
    (s, a) => s + parseFloat(a.balance || '0'),
    0
  )
  const selectedAccount = accounts[selectedAccountIdx]

  function loadTransactions(acc: any) {
    fetch(`/api/transactions?account=${acc.account_number}&limit=6`)
      .then((r) => r.json())
      .then((t) => {
        if (t.ok) setTransactions(t.transactions)
      })
      .catch(() => {})
  }

  function switchAccount(i: number) {
    setSelectedAccountIdx(i)
    loadTransactions(accounts[i])
  }

  if (!isHydrated || !user) return null

  return (
    <RouteGuard>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#F6F9FC',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            padding: '1.75rem 2rem',
            overflowY: 'auto',
            minWidth: 0
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <p
                style={{
                  color: '#00D4AA',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: 0
                }}
              >
                {greeting()}
              </p>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#0A2540',
                  margin: '0.2rem 0 0'
                }}
              >
                {user.full_name.split(' ')[0]} 👋
              </h1>
            </div>
            <img
              src="/person-logo.png"
              alt="profile"
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #E3E8EE'
              }}
            />
          </div>

          {loading ? (
            <div
              style={{
                color: '#00D4AA',
                fontSize: '0.9rem',
                padding: '2rem 0'
              }}
            >
              Loading your dashboard…
            </div>
          ) : (
            <>
              {/* Hero Balance Card */}
              <div
                style={{
                  background:
                    'linear-gradient(135deg, #0A2540 0%, #0A2540 55%, #6b2568 100%)',
                  borderRadius: 28,
                  padding: '2rem',
                  color: 'white',
                  marginBottom: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: -30,
                    top: -30,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 40,
                    bottom: -50,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)'
                  }}
                />
                <p
                  style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    margin: '0 0 0.5rem'
                  }}
                >
                  Total Portfolio Balance
                </p>
                <p
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    margin: '0 0 1.25rem',
                    letterSpacing: '-1px'
                  }}
                >
                  Rs.{' '}
                  {totalBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>

                {/* Account Tabs */}
                {accounts.length > 0 && (
                  <div
                    style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
                  >
                    {accounts.map((a, i) => (
                      <button
                        key={a.account_number}
                        onClick={() => switchAccount(i)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: 999,
                          border: `1.5px solid ${selectedAccountIdx === i ? 'white' : 'rgba(255,255,255,0.3)'}`,
                          background:
                            selectedAccountIdx === i
                              ? 'rgba(255,255,255,0.18)'
                              : 'transparent',
                          color:
                            selectedAccountIdx === i
                              ? 'white'
                              : 'rgba(255,255,255,0.6)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {a.account_name}
                      </button>
                    ))}
                  </div>
                )}

                {selectedAccount && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.9rem 1.25rem',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 16,
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: '0 0 0.2rem'
                        }}
                      >
                        {selectedAccount.account_type || 'Account'} ·{' '}
                        {selectedAccount.account_number}
                      </p>
                      <p
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          color: 'white',
                          margin: 0
                        }}
                      >
                        Rs.{' '}
                        {Number(selectedAccount.balance).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 }
                        )}
                      </p>
                    </div>
                    {selectedAccount.is_frozen && (
                      <span
                        style={{
                          background: '#FAD2D5',
                          color: '#E63946',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.3rem 0.75rem',
                          borderRadius: 999,
                          letterSpacing: '0.5px'
                        }}
                      >
                        FROZEN
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 12px rgba(10,37,64,0.06)'
                }}
              >
                <p
                  style={{
                    color: '#4F5D75',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    margin: '0 0 1rem'
                  }}
                >
                  Quick Actions
                </p>
                <div
                  style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
                >
                  <QuickAction
                    icon="💸"
                    label="Transfer"
                    href="/bank-transfer"
                  />
                  <QuickAction icon="📋" label="Pay Bills" href="/pay-bills" />
                  <QuickAction
                    icon="📊"
                    label="Statement"
                    href="/e-statement"
                  />
                  <QuickAction
                    icon="🏦"
                    label="Accounts"
                    href="/bank-accounts"
                  />
                  <QuickAction
                    icon="💡"
                    label="Smart Spend"
                    href="/smart-spend"
                  />
                </div>
              </div>

              {/* Recent Transactions */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 24,
                  padding: '1.5rem',
                  boxShadow: '0 2px 12px rgba(10,37,64,0.06)',
                  overflowX: 'auto'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    minWidth: 0
                  }}
                >
                  <p
                    style={{
                      color: '#0A2540',
                      fontWeight: 800,
                      fontSize: '1rem',
                      margin: 0
                    }}
                  >
                    Recent Transactions
                  </p>
                  <button
                    onClick={() => router.push('/e-statement')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#00D4AA',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    View all →
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2rem 0',
                      color: '#A0AAB5',
                      fontSize: '0.9rem'
                    }}
                  >
                    <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>💳</p>
                    No transactions yet. Make a transfer to get started.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      minWidth: 0
                    }}
                  >
                    {transactions.map((t, i) => {
                      const isDebit =
                        t.from_account === selectedAccount?.account_number
                      const date = new Date(t.created_at).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric' }
                      )
                      const counterparty = isDebit
                        ? t.to_account
                        : t.from_account
                      const isBill = t.to_account === 'BILLER_SYSTEM'
                      const displayParty = isBill
                        ? t.description
                            ?.split('—')[0]
                            ?.replace('BILL PAY:', '')
                            .trim() || 'Bill Payment'
                        : counterparty
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: 12,
                            background: '#F6F9FC',
                            minWidth: 0
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              background: isDebit ? '#FAD2D5' : '#D1F2EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              flexShrink: 0
                            }}
                          >
                            {isBill ? '🏢' : isDebit ? '↑' : '↓'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontWeight: 700,
                                color: '#0A2540',
                                fontSize: '0.85rem',
                                margin: '0 0 0.1rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {displayParty}
                            </p>
                            <p
                              style={{
                                color: '#A0AAB5',
                                fontSize: '0.75rem',
                                margin: 0
                              }}
                            >
                              {date} · {t.status || 'Success'}
                            </p>
                          </div>
                          <p
                            style={{
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              color: isDebit ? '#E63946' : '#0D8A6B',
                              margin: 0,
                              flexShrink: 0
                            }}
                          >
                            {isDebit ? '-' : '+'}Rs.
                            {Number(t.amount).toLocaleString()}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </RouteGuard>
  )
}
