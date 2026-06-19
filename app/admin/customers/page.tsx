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
        background: type === 'success' ? '#16a34a' : '#dc2626',
        color: 'white',
        padding: '0.75rem 1.25rem',
        borderRadius: 12,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        maxWidth: 360
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const [search, setSearch] = useState('')

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadCustomers = () => {
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCustomers(d.customers)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomer = (id: number) => {
    fetch(`/api/admin/customers?userId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setSelected(d.user)
          setAccounts(d.accounts)
        }
      })
  }

  const handleFreezeToggle = async (
    accountNumber: string,
    isFrozen: boolean
  ) => {
    const action = isFrozen ? 'unfreeze' : 'freeze'
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, accountNumber })
    })
    const d = await res.json()
    if (d.ok) {
      showToast(d.message, 'success')
      if (selected) loadCustomer(selected.id)
    } else {
      showToast(d.message || 'Failed', 'error')
    }
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.username.includes(search) ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.includes(search)
  )

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
          color: '#1d0730',
          marginBottom: '1.5rem'
        }}
      >
        Customer Management
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr',
          gap: '1.5rem'
        }}
      >
        {/* Customer List */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <input
            placeholder="Search by name, username, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: 10,
              border: '1.5px solid #e5e7eb',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {loading ? (
            <p style={{ color: '#aaa' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#aaa' }}>No customers found.</p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadCustomer(c.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.9rem 1rem',
                    borderRadius: 12,
                    border: '1.5px solid',
                    borderColor: selected?.id === c.id ? '#9a5c97' : '#f3f0f6',
                    background: selected?.id === c.id ? '#faf0fa' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 700,
                        color: '#1d0730',
                        fontSize: '0.875rem'
                      }}
                    >
                      {c.full_name}
                    </p>
                    <p style={{ color: '#888', fontSize: '0.75rem' }}>
                      @{c.username} · {c.email}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>
                      {c.account_count} account
                      {c.account_count !== 1 ? 's' : ''}
                    </p>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#450043'
                      }}
                    >
                      Rs. {Number(c.total_balance).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer Detail */}
        {selected && (
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
                alignItems: 'flex-start',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <h2
                  style={{
                    fontWeight: 800,
                    color: '#1d0730',
                    fontSize: '1.1rem'
                  }}
                >
                  {selected.full_name}
                </h2>
                <p style={{ color: '#888', fontSize: '0.8rem' }}>
                  @{selected.username} · {selected.email}
                </p>
                {selected.nic && (
                  <p style={{ color: '#aaa', fontSize: '0.75rem' }}>
                    NIC: {selected.nic}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelected(null)
                  setAccounts([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                ×
              </button>
            </div>

            <h3
              style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.75rem'
              }}
            >
              Accounts
            </h3>

            {accounts.length === 0 ? (
              <p style={{ color: '#bbb', fontSize: '0.875rem' }}>
                No accounts.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 12,
                      background: a.is_frozen ? '#fff5f5' : '#faf0fa',
                      border: `1.5px solid ${a.is_frozen ? '#fecaca' : '#f3e8f3'}`
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            color: '#1d0730',
                            fontSize: '0.875rem'
                          }}
                        >
                          {a.account_name}
                        </p>
                        <p style={{ color: '#888', fontSize: '0.75rem' }}>
                          {a.account_number} · {a.account_type}
                        </p>
                        <p
                          style={{
                            fontWeight: 700,
                            color: '#450043',
                            fontSize: '0.95rem',
                            marginTop: '0.3rem'
                          }}
                        >
                          Rs. {Number(a.balance).toLocaleString()}
                        </p>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.4rem'
                        }}
                      >
                        {a.is_frozen && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              background: '#fef2f2',
                              color: '#dc2626',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 700
                            }}
                          >
                            FROZEN
                          </span>
                        )}
                        <button
                          onClick={() =>
                            handleFreezeToggle(a.account_number, a.is_frozen)
                          }
                          style={{
                            padding: '0.4rem 0.9rem',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            background: a.is_frozen ? '#dcfce7' : '#fee2e2',
                            color: a.is_frozen ? '#16a34a' : '#dc2626'
                          }}
                        >
                          {a.is_frozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
