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
        maxWidth: 400
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

type ModalState = { tx: any; action: 'flag' | 'reverse' } | null

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const load = () => {
    setLoading(true)
    fetch(
      `/api/admin/transactions?limit=100${showFlaggedOnly ? '&flagged=true' : ''}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTransactions(d.transactions)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [showFlaggedOnly])

  const handleAction = async () => {
    if (!modal) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modal.action,
          transactionId: modal.tx.id,
          reason
        })
      })
      const d = await res.json()
      if (d.ok) {
        showToast(d.message, 'success')
        setModal(null)
        setReason('')
        load()
      } else {
        showToast(d.message || 'Failed', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnflag = async (id: number) => {
    const res = await fetch('/api/admin/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unflag', transactionId: id })
    })
    const d = await res.json()
    if (d.ok) {
      showToast('Transaction unflagged.', 'success')
      load()
    } else showToast(d.message, 'error')
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d0730' }}>
          Transaction Monitor
        </h1>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#555'
          }}
        >
          <input
            type="checkbox"
            checked={showFlaggedOnly}
            onChange={(e) => setShowFlaggedOnly(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Flagged only
        </label>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>
            Loading…
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#bbb' }}>
            No transactions found.
          </div>
        ) : (
          <table
            style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}
          >
            <thead>
              <tr
                style={{
                  background: '#faf0fa',
                  borderBottom: '2px solid #f3e8f3'
                }}
              >
                {[
                  '#',
                  'From',
                  'To',
                  'Amount',
                  'Description',
                  'Date',
                  'Status',
                  'Actions'
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.85rem 0.9rem',
                      textAlign: 'left',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid #f9f5f9',
                    background: t.flagged ? '#fffbeb' : 'white'
                  }}
                >
                  <td
                    style={{
                      padding: '0.8rem 0.9rem',
                      color: '#aaa',
                      fontSize: '0.75rem'
                    }}
                  >
                    #{t.id}
                  </td>
                  <td
                    style={{
                      padding: '0.8rem 0.9rem',
                      fontSize: '0.8rem',
                      color: '#444',
                      fontFamily: 'monospace'
                    }}
                  >
                    {t.from_account}
                  </td>
                  <td
                    style={{
                      padding: '0.8rem 0.9rem',
                      fontSize: '0.8rem',
                      color: '#444',
                      fontFamily: 'monospace'
                    }}
                  >
                    {t.to_account}
                  </td>
                  <td
                    style={{
                      padding: '0.8rem 0.9rem',
                      fontWeight: 700,
                      color: '#450043',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Rs. {Number(t.amount).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '0.8rem 0.9rem',
                      fontSize: '0.8rem',
                      color: '#666',
                      maxWidth: 180
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t.description || '—'}
                    </span>
                    {t.flag_reason && (
                      <span style={{ fontSize: '0.7rem', color: '#d97706' }}>
                        ⚑ {t.flag_reason}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '0.8rem 0.9rem',
                      fontSize: '0.75rem',
                      color: '#888',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.8rem 0.9rem' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 7px',
                        borderRadius: 4,
                        fontWeight: 700,
                        background:
                          t.status === 'REVERSED'
                            ? '#f3f4f6'
                            : t.flagged
                              ? '#fef3c7'
                              : '#dcfce7',
                        color:
                          t.status === 'REVERSED'
                            ? '#9ca3af'
                            : t.flagged
                              ? '#d97706'
                              : '#16a34a'
                      }}
                    >
                      {t.flagged ? 'FLAGGED' : t.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem 0.9rem' }}>
                    {t.status !== 'REVERSED' && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.4rem',
                          flexWrap: 'nowrap'
                        }}
                      >
                        {t.flagged ? (
                          <button
                            onClick={() => handleUnflag(t.id)}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: 6,
                              border: 'none',
                              background: '#f3f4f6',
                              color: '#666',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Unflag
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setModal({ tx: t, action: 'flag' })
                              setReason('')
                            }}
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: 6,
                              border: 'none',
                              background: '#fef3c7',
                              color: '#d97706',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Flag
                          </button>
                        )}
                        {t.from_account !== 'BANK_SYSTEM' &&
                          t.to_account !== 'BANK_SYSTEM' && (
                            <button
                              onClick={() => {
                                setModal({ tx: t, action: 'reverse' })
                                setReason('')
                              }}
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: 6,
                                border: 'none',
                                background: '#fee2e2',
                                color: '#dc2626',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Reverse
                            </button>
                          )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Modal */}
      {modal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '2rem',
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
          >
            <h2
              style={{
                fontWeight: 800,
                color: '#1d0730',
                marginBottom: '0.5rem',
                fontSize: '1.1rem'
              }}
            >
              {modal.action === 'flag'
                ? 'Flag Transaction'
                : 'Reverse Transaction'}
            </h2>
            <p
              style={{
                color: '#888',
                fontSize: '0.8rem',
                marginBottom: '1rem'
              }}
            >
              #{modal.tx.id} · Rs. {Number(modal.tx.amount).toLocaleString()} ·{' '}
              {modal.tx.from_account} → {modal.tx.to_account}
            </p>
            {modal.action === 'reverse' && (
              <p
                style={{
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '0.6rem 0.9rem',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  marginBottom: '1rem'
                }}
              >
                ⚠ This will create a counter-transaction and adjust both account
                balances. This action is irreversible.
              </p>
            )}
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: '#555',
                marginBottom: '0.4rem'
              }}
            >
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: 10,
                border: '1.5px solid #e5e7eb',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter reason…"
            />
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}
            >
              <button
                onClick={() => setModal(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 10,
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting || !reason.trim()}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: submitting || !reason.trim() ? 0.6 : 1,
                  background: modal.action === 'flag' ? '#d97706' : '#dc2626',
                  color: 'white'
                }}
              >
                {submitting
                  ? '…'
                  : modal.action === 'flag'
                    ? 'Flag It'
                    : 'Reverse Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
