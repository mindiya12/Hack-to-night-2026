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
        alignItems: 'center'
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

const typeLabels: Record<string, string> = {
  savings: 'Savings Account',
  current: 'Current Account',
  fixed_deposit: 'Fixed Deposit'
}

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>(
    'pending'
  )
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const [modal, setModal] = useState<{
    app: any
    action: 'approve' | 'reject'
  } | null>(null)
  const [accountType, setAccountType] = useState('savings')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadApps = () => {
    setLoading(true)
    fetch(`/api/admin/applications?status=${filter}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setApps(d.applications)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    loadApps()
  }, [filter])

  const handleSubmit = async () => {
    if (!modal) return
    if (modal.action === 'reject' && !rejectReason.trim()) {
      showToast('Please enter a reason for rejection.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: modal.app.id,
          action: modal.action,
          accountType,
          rejectReason
        })
      })
      const d = await res.json()
      if (d.ok) {
        showToast(
          d.message + (d.accountNumber ? ` Account: ${d.accountNumber}` : ''),
          'success'
        )
        setModal(null)
        setRejectReason('')
        loadApps()
      } else {
        showToast(d.message || 'Failed', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const tabStyle = (t: string) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    background: filter === t ? '#0A2540' : 'white',
    color: filter === t ? 'white' : '#4F5D75',
    boxShadow: filter === t ? '0 2px 8px rgba(69,0,67,0.3)' : 'none',
    transition: 'all 0.15s'
  })

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
          marginBottom: '1.5rem'
        }}
      >
        Account Applications
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          background: 'white',
          padding: '0.4rem',
          borderRadius: 12,
          width: 'fit-content',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)} style={tabStyle(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        {loading ? (
          <div
            style={{ padding: '3rem', textAlign: 'center', color: '#A0AAB5' }}
          >
            Loading…
          </div>
        ) : apps.length === 0 ? (
          <div
            style={{ padding: '3rem', textAlign: 'center', color: '#A0AAB5' }}
          >
            No {filter} applications.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: '#F6F9FC',
                  borderBottom: '2px solid #f3e8f3'
                }}
              >
                {[
                  '#',
                  'Applicant',
                  'Type',
                  'Requested',
                  'Status',
                  filter === 'pending' ? 'Actions' : 'Outcome'
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.85rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#4F5D75',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f9f5f9' }}>
                  <td
                    style={{
                      padding: '0.9rem 1rem',
                      color: '#A0AAB5',
                      fontSize: '0.8rem'
                    }}
                  >
                    #{a.id}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <p
                      style={{
                        fontWeight: 700,
                        color: '#0A2540',
                        fontSize: '0.875rem'
                      }}
                    >
                      {a.full_name}
                    </p>
                    <p style={{ color: '#4F5D75', fontSize: '0.75rem' }}>
                      @{a.username}
                    </p>
                  </td>
                  <td
                    style={{
                      padding: '0.9rem 1rem',
                      fontSize: '0.875rem',
                      color: '#444',
                      fontWeight: 600
                    }}
                  >
                    {typeLabels[a.requested_type] || a.requested_type}
                  </td>
                  <td
                    style={{
                      padding: '0.9rem 1rem',
                      color: '#4F5D75',
                      fontSize: '0.8rem'
                    }}
                  >
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
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
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    {a.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setModal({ app: a, action: 'approve' })
                            setAccountType(a.requested_type)
                          }}
                          style={{
                            padding: '0.35rem 0.9rem',
                            borderRadius: 8,
                            border: 'none',
                            background: '#D1F2EB',
                            color: '#0D8A6B',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setModal({ app: a, action: 'reject' })
                            setRejectReason('')
                          }}
                          style={{
                            padding: '0.35rem 0.9rem',
                            borderRadius: 8,
                            border: 'none',
                            background: '#FAD2D5',
                            color: '#E63946',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: '#4F5D75' }}>
                        {a.status === 'rejected'
                          ? a.reject_reason || '—'
                          : `Approved by ${a.reviewed_by_name || 'admin'}`}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
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
                color: '#0A2540',
                marginBottom: '0.5rem',
                fontSize: '1.2rem'
              }}
            >
              {modal.action === 'approve'
                ? 'Approve Application'
                : 'Reject Application'}
            </h2>
            <p
              style={{
                color: '#4F5D75',
                fontSize: '0.875rem',
                marginBottom: '1.25rem'
              }}
            >
              {modal.app.full_name} ·{' '}
              {typeLabels[modal.app.requested_type] || modal.app.requested_type}
            </p>

            {modal.action === 'approve' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#4F5D75',
                    marginBottom: '0.4rem'
                  }}
                >
                  Account Type to Open
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 10,
                    border: '1.5px solid #E3E8EE',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                  <option value="fixed_deposit">Fixed Deposit</option>
                </select>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#A0AAB5',
                    marginTop: '0.5rem'
                  }}
                >
                  Account opens with Rs. 0 balance. Use Teller Ops to deposit
                  funds.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#4F5D75',
                    marginBottom: '0.4rem'
                  }}
                >
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 10,
                    border: '1.5px solid #E3E8EE',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g. Insufficient documentation provided"
                />
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => setModal(null)}
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
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  background:
                    modal.action === 'approve' ? '#0A2540' : '#E63946',
                  color: 'white'
                }}
              >
                {submitting
                  ? '…'
                  : modal.action === 'approve'
                    ? 'Approve & Create Account'
                    : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
