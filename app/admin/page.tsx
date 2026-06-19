'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function MetricCard({
  label,
  value,
  sub,
  color
}: {
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${color}`
      }}
    >
      <p
        style={{
          color: '#4F5D75',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '0.5rem'
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#0A2540',
          lineHeight: 1
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{ color: '#A0AAB5', fontSize: '0.75rem', marginTop: '0.4rem' }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const m = data?.metrics

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        <div>
          <h1
            style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A2540' }}
          >
            Admin Dashboard
          </h1>
          <p
            style={{
              color: '#4F5D75',
              fontSize: '0.875rem',
              marginTop: '0.25rem'
            }}
          >
            Nova Bank — Internal Operations
          </p>
        </div>
        <img
          src="/loginlogo.png"
          alt=""
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: '#4F5D75' }}>Loading metrics…</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <MetricCard
              label="Total Customers"
              value={m?.totalCustomers ?? 0}
              color="#0A2540"
            />
            <MetricCard
              label="Deposits Held"
              value={`Rs. ${Number(m?.totalDeposits ?? 0).toLocaleString()}`}
              color="#00D4AA"
              sub="Sum of all balances"
            />
            <MetricCard
              label="Accounts Opened Today"
              value={m?.accountsOpenedToday ?? 0}
              color="#6366f1"
            />
            <MetricCard
              label="Transactions Today"
              value={m?.transactionsToday ?? 0}
              color="#0ea5e9"
            />
            <MetricCard
              label="Pending Applications"
              value={m?.pendingApplications ?? 0}
              color="#f59e0b"
              sub="Awaiting review"
            />
            <MetricCard
              label="Flagged Transactions"
              value={m?.flaggedTransactions ?? 0}
              color="#ef4444"
              sub="Requires attention"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem'
            }}
          >
            {/* Recent Transactions */}
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <h2
                  style={{
                    fontWeight: 700,
                    color: '#0A2540',
                    fontSize: '1rem'
                  }}
                >
                  Recent Transactions
                </h2>
                <button
                  onClick={() => router.push('/admin/transactions')}
                  style={{
                    fontSize: '0.75rem',
                    color: '#00D4AA',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  View all →
                </button>
              </div>
              {(data?.recentTransactions || []).map((t: any) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid #F6F9FC'
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#333'
                      }}
                    >
                      {t.from_account} → {t.to_account}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#999' }}>
                      {t.description || 'Transfer'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontWeight: 700,
                        color: '#0A2540',
                        fontSize: '0.875rem'
                      }}
                    >
                      Rs. {Number(t.amount).toLocaleString()}
                    </p>
                    {t.flagged && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          background: '#fef2f2',
                          color: '#E63946',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 600
                        }}
                      >
                        FLAGGED
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {!data?.recentTransactions?.length && (
                <p style={{ color: '#A0AAB5', fontSize: '0.875rem' }}>
                  No transactions yet.
                </p>
              )}
            </div>

            {/* Recent Applications */}
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <h2
                  style={{
                    fontWeight: 700,
                    color: '#0A2540',
                    fontSize: '1rem'
                  }}
                >
                  Recent Applications
                </h2>
                <button
                  onClick={() => router.push('/admin/applications')}
                  style={{
                    fontSize: '0.75rem',
                    color: '#00D4AA',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  View all →
                </button>
              </div>
              {(data?.recentApplications || []).map((a: any) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid #F6F9FC'
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#333'
                      }}
                    >
                      {a.full_name}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#999' }}>
                      {a.requested_type} account
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 700,
                      background:
                        a.status === 'pending'
                          ? '#FFF4D6'
                          : a.status === 'approved'
                            ? '#D1F2EB'
                            : '#fef2f2',
                      color:
                        a.status === 'pending'
                          ? '#FFB800'
                          : a.status === 'approved'
                            ? '#0D8A6B'
                            : '#E63946'
                    }}
                  >
                    {a.status.toUpperCase()}
                  </span>
                </div>
              ))}
              {!data?.recentApplications?.length && (
                <p style={{ color: '#A0AAB5', fontSize: '0.875rem' }}>
                  No applications yet.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
