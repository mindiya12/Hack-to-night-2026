'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Sidebar from '../../components/sidebar'
import {
  CheckCircle2,
  AlertTriangle,
  ChevronLeft
} from '../../components/Icons'
import { ScamShieldModal } from '@/components/ScamShieldModal'
import RouteGuard from '@/components/RouteGuard'

type Biller = {
  id: string
  name: string
  logo: string
}

const billers: Biller[] = [
  { id: 'water', name: 'Water Board', logo: '/billers/water-board.png' },
  { id: 'cable', name: 'Cable TV', logo: '/billers/cable-tv.png' },
  { id: 'ceb', name: 'CEB', logo: '/billers/ceb.png' },
  { id: 'airtel', name: 'Airtel', logo: '/billers/airtel.png' },
  { id: 'dialog', name: 'Dialog', logo: '/billers/dialog.png' },
  { id: 'slt', name: 'Sri Lanka Telecom', logo: '/billers/electricity.png' },
  { id: 'peotv', name: 'PEO TV', logo: '/billers/mpesa.png' },
  { id: 'hutch', name: 'Hutch', logo: '/billers/hutch.png' },
  { id: 'aia', name: 'AIA', logo: '/billers/aia.png' },
  { id: 'lolc', name: 'LOLC', logo: '/billers/lolc.png' },
  { id: 'insurance2', name: 'Insurance', logo: '/billers/insurance2.png' },
  { id: 'hsbc', name: 'HSBC', logo: '/billers/hsbc.png' }
]

type Screen = 'select' | 'form' | 'confirm' | 'success' | 'failed'

type FormErrors = {
  fromAccount?: string
  accountNumber?: string
  billId?: string
  dueAmount?: string
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
  const [pin, setPin] = useState('')
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [failReason, setFailReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const [riskResult, setRiskResult] = useState<any>(null)
  const [showScamModal, setShowScamModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.accounts) {
          setAccounts(data.accounts)
          if (data.accounts.length > 0)
            setFromAccount(data.accounts[0].account_number)
        }
      })
  }, [])

  function handleSelectBiller(biller: Biller) {
    setSelectedBiller(biller)
    setErrors({})
    setScreen('form')
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {}

    if (!fromAccount) newErrors.fromAccount = 'Select a source account'
    if (!accountNumber.trim())
      newErrors.accountNumber = 'Account number is required'
    if (!billId.trim()) newErrors.billId = 'Bill ID is required'
    if (
      !dueAmount.trim() ||
      isNaN(Number(dueAmount)) ||
      Number(dueAmount) <= 0
    ) {
      newErrors.dueAmount = 'Enter a valid amount greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleNextStep() {
    if (!validateForm()) return
    setIsProcessing(true)

    // Risk Check for Billers too!
    try {
      // In a real system, biller accounts are pre-verified. We use Admin Vault as mock biller destination.
      const toAccount = '9999999999'

      const res = await fetch('/api/risk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          toAccount,
          amount: dueAmount
        })
      })
      const risk = await res.json()

      if (risk.ok && risk.level !== 'LOW') {
        setRiskResult(risk)
        setShowScamModal(true)
      } else {
        setScreen('confirm')
      }
    } catch {
      setScreen('confirm')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handlePayNow() {
    if (!pin) {
      setFailReason('PIN is required')
      setScreen('failed')
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          toAccount: '9999999999', // Mock Biller Destination
          amount: dueAmount,
          description: `BILL PAY: ${selectedBiller?.name} - ${billId} ${remarks}`,
          pin
        })
      })
      const data = await res.json()
      if (data.ok) {
        setConfirmationNumber(data.transaction.id.toString())
        setScreen('success')
      } else {
        setFailReason(data.message || 'Payment failed')
        setScreen('failed')
      }
    } catch {
      setFailReason('Network error')
      setScreen('failed')
    } finally {
      setIsProcessing(false)
    }
  }

  function resetToHome() {
    setScreen('select')
    setSelectedBiller(null)
    setAccountNumber('')
    setBillId('')
    setDueAmount('')
    setRemarks('')
    setPin('')
    setErrors({})
  }

  return (
    <RouteGuard>
      <div className="page">
        <Sidebar />

        <div className="content">
          <header className="topbar">
            <h1>Pay Bills</h1>
            <div className="topbar-icons">
              <div className="avatar">
                <Image
                  src="/avatar.png"
                  alt="Profile"
                  width={36}
                  height={36}
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
            </div>
          </header>

          <main className="main">
            <div className="card-wrapper">
              {screen === 'select' && (
                <div className="card">
                  <div className="biller-grid">
                    {billers.map((biller) => (
                      <button
                        key={biller.id}
                        onClick={() => handleSelectBiller(biller)}
                        className="biller-btn"
                      >
                        <div className="biller-icon logo-circle">
                          <Image
                            src={biller.logo}
                            alt={biller.name}
                            width={44}
                            height={44}
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                        <span className="biller-name">{biller.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {screen === 'form' && selectedBiller && (
                <div className="card">
                  <button
                    className="back-btn"
                    onClick={() => setScreen('select')}
                  >
                    <ChevronLeft size={16} /> Back to billers
                  </button>

                  <div className="biller-header">
                    <div className="biller-icon small logo-circle">
                      <Image
                        src={selectedBiller.logo}
                        alt={selectedBiller.name}
                        width={28}
                        height={28}
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                    <span className="biller-header-name">
                      {selectedBiller.name}
                    </span>
                  </div>

                  <div className="field">
                    <label>Pay From Account</label>
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      className={
                        errors.fromAccount ? 'input-error bg-white' : 'bg-white'
                      }
                      style={{
                        padding: '0.85rem 1.1rem',
                        borderRadius: '12px',
                        border: '1.5px solid transparent'
                      }}
                    >
                      {accounts.map((a) => (
                        <option key={a.account_number} value={a.account_number}>
                          {a.account_name} - {a.account_number} (Rs.{' '}
                          {Number(a.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                    {errors.fromAccount && (
                      <span className="error-text">{errors.fromAccount}</span>
                    )}
                  </div>

                  <div className="field">
                    <label>Account number</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className={errors.accountNumber ? 'input-error' : ''}
                    />
                    {errors.accountNumber && (
                      <span className="error-text">{errors.accountNumber}</span>
                    )}
                  </div>

                  <div className="field">
                    <label>Bill ID</label>
                    <input
                      value={billId}
                      onChange={(e) => setBillId(e.target.value)}
                      placeholder="Enter bill ID"
                      className={errors.billId ? 'input-error' : ''}
                    />
                    {errors.billId && (
                      <span className="error-text">{errors.billId}</span>
                    )}
                  </div>

                  <div className="field">
                    <label>Amount (Rs.)</label>
                    <input
                      type="number"
                      value={dueAmount}
                      onChange={(e) => setDueAmount(e.target.value)}
                      placeholder="0.00"
                      className={errors.dueAmount ? 'input-error' : ''}
                    />
                    {errors.dueAmount && (
                      <span className="error-text">{errors.dueAmount}</span>
                    )}
                  </div>

                  <div className="field">
                    <label>Remarks</label>
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <button
                    className="pay-now-btn"
                    disabled={isProcessing}
                    onClick={handleNextStep}
                  >
                    {isProcessing ? 'CHECKING...' : 'CONTINUE'}
                  </button>
                </div>
              )}

              {screen === 'confirm' && (
                <div className="card status-card">
                  <h2>Confirm Payment</h2>
                  <p className="status-sub mb-4">
                    Pay{' '}
                    <strong>Rs. {Number(dueAmount).toLocaleString()}</strong> to{' '}
                    <strong>{selectedBiller?.name}</strong>
                  </p>

                  <div className="mb-6 w-full text-left">
                    <label className="block text-gray-700 mb-2 font-semibold">
                      Enter 4-digit PIN to confirm:
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full text-center text-2xl tracking-[1em] h-14 bg-gray-100 rounded-xl border border-gray-300 outline-none focus:border-purple-500"
                      placeholder="****"
                    />
                  </div>

                  <button
                    className="pay-now-btn"
                    disabled={isProcessing}
                    onClick={handlePayNow}
                  >
                    {isProcessing ? 'PROCESSING...' : 'CONFIRM & PAY NOW'}
                  </button>
                  <button
                    className="back-home-btn !bg-transparent !text-gray-500 mt-4"
                    onClick={() => setScreen('form')}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {screen === 'success' && (
                <div className="card status-card">
                  <div className="status-circle success">
                    <CheckCircle2 size={64} />
                  </div>
                  <h2>Payment Successful!</h2>
                  <p className="status-sub">
                    Confirmation number : {confirmationNumber}
                  </p>
                  <button className="back-home-btn" onClick={resetToHome}>
                    <ChevronLeft size={16} /> BACK TO HOME
                  </button>
                </div>
              )}

              {screen === 'failed' && (
                <div className="card status-card">
                  <div className="status-circle failed">
                    <AlertTriangle size={64} />
                  </div>
                  <h2>Payment Failed!</h2>
                  <p className="status-sub">{failReason}</p>
                  <button className="back-home-btn" onClick={resetToHome}>
                    <ChevronLeft size={16} /> BACK TO HOME
                  </button>
                </div>
              )}

              {showScamModal && riskResult && (
                <ScamShieldModal
                  riskResult={riskResult}
                  transactionCtx={{
                    amount: dueAmount,
                    toAccount: '9999999999',
                    reasons: riskResult.reasons,
                    firstTime: riskResult.firstTime
                  }}
                  onProceed={() => {
                    setShowScamModal(false)
                    setScreen('confirm')
                  }}
                  onCancel={() => {
                    setShowScamModal(false)
                    setScreen('form')
                  }}
                />
              )}
            </div>
          </main>
        </div>

        <style jsx>{`
        .page {
          display: flex;
          min-height: 100vh;
          background: #f3f4f6;
        }
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          padding: 1.1rem 2.5rem;
          border-bottom: 1px solid #eee;
        }
        .topbar h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
        }
        .topbar-icons {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          color: #666;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 3rem;
        }
        .card-wrapper {
          width: 100%;
          max-width: 760px;
        }
        .card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
          padding: 3rem;
        }
        .biller-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5rem 2rem;
        }
        .biller-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          background: none;
          border: none;
          cursor: pointer;
        }
        .biller-icon {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .biller-icon.small {
          width: 48px;
          height: 48px;
        }
        .logo-circle {
          background: white;
          border: 1px solid #eee;
        }
        .biller-btn:hover .biller-icon {
          transform: scale(1.07);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }
        .biller-name {
          font-size: 0.82rem;
          color: #555;
          text-align: center;
          line-height: 1.25;
          font-weight: 500;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          color: #888;
          font-size: 0.9rem;
          cursor: pointer;
          margin-bottom: 1.75rem;
          padding: 0;
        }
        .back-btn:hover {
          color: #555;
        }
        .biller-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-bottom: 2.25rem;
        }
        .biller-header-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: #333;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1.4rem;
        }
        .field label {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }
        .field input {
          background: #f3f4f6;
          border: 1.5px solid transparent;
          border-radius: 12px;
          padding: 0.85rem 1.1rem;
          font-size: 0.95rem;
          color: #333;
          outline: none;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .field input:focus {
          box-shadow: 0 0 0 2px #d8b9d6;
        }
        .field input.input-error {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .error-text {
          font-size: 0.78rem;
          color: #ef4444;
          margin-top: 0.15rem;
        }
        .pay-now-btn {
          margin-top: 1.75rem;
          width: 100%;
          background: #9a5c97;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          padding: 1rem;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .pay-now-btn:hover {
          background: #450043;
        }
        .status-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 3rem;
        }
        .status-circle {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.75rem;
        }
        .status-circle.success {
          background: #dcfce7;
          color: #22c55e;
        }
        .status-circle.failed {
          background: #fee2e2;
          color: #ef4444;
        }
        .status-card h2 {
          font-size: 1.4rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.6rem;
        }
        .status-sub {
          font-size: 0.9rem;
          color: #999;
          margin-bottom: 2.25rem;
          white-space: pre-line;
        }
        .back-home-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #9a5c97;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.85rem 2.25rem;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .back-home-btn:hover {
          background: #450043;
        }
      `}</style>
      </div>
    </RouteGuard>
  )
}
