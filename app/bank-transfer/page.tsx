'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import { ScamShieldModal } from '@/components/ScamShieldModal'
import RouteGuard from '@/components/RouteGuard'

type Errors = Partial<{
  fromAccount: string
  amount: string
  accountNumber: string
  accountName: string
  bank: string
}>

export default function BankTransfer() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bank, setBank] = useState('')
  const [description, setDescription] = useState('')
  const [pin, setPin] = useState('')

  const [errors, setErrors] = useState<Errors>({})
  const [transferError, setTransferError] = useState('')

  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'failure'>(
    'form'
  )
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const [riskResult, setRiskResult] = useState<any>(null)
  const [showScamModal, setShowScamModal] = useState(false)
  const [isRiskChecking, setIsRiskChecking] = useState(false)

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
      .catch(console.error)
  }, [])

  function validate() {
    const e: Errors = {}
    if (!fromAccount) e.fromAccount = 'Select an account'
    if (!amount) e.amount = 'Amount is required'
    else if (Number(amount) <= 0 || isNaN(Number(amount)))
      e.amount = 'Enter a valid positive amount'

    if (!accountNumber) e.accountNumber = 'Account number is required'
    else if (!/^\d{6,}$/.test(accountNumber))
      e.accountNumber = 'Enter a valid account number'

    if (!accountName) e.accountName = 'Account name is required'
    if (!bank) e.bank = 'Select a bank'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsRiskChecking(true)
    try {
      const res = await fetch('/api/risk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          toAccount: accountNumber,
          amount
        })
      })
      const risk = await res.json()

      if (risk.ok && risk.level !== 'LOW') {
        setRiskResult(risk)
        setShowScamModal(true)
      } else {
        setStep('confirm')
      }
    } catch (err) {
      // Fallback to confirm if risk check fails
      setStep('confirm')
    } finally {
      setIsRiskChecking(false)
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTransferError('')

    if (!pin) {
      setTransferError('PIN is required to confirm transfer')
      return
    }

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccount,
          toAccount: accountNumber,
          amount,
          description,
          pin
        })
      })
      const data = await res.json()

      if (data.ok) {
        setConfirmation(data.transaction.id.toString())
        setStep('success')
      } else {
        setTransferError(data.message || 'Transfer failed')
        if (data.message === 'Insufficient balance') {
          setStep('failure')
        }
      }
    } catch (err) {
      setTransferError('Network error')
    }
  }

  function resetForm() {
    setAmount('')
    setAccountNumber('')
    setAccountName('')
    setBank('')
    setDescription('')
    setPin('')
    setErrors({})
    setTransferError('')
    setConfirmation(null)
    setStep('form')
  }

  return (
    <RouteGuard>
      <div className="min-h-screen bg-bg-light font-geist p-0">
        <div className="flex min-h-screen">
          <Sidebar />

          <main className="flex-1 p-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Bank Transfer</h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src="/avatar.png"
                    alt="avatar"
                    className="w-full h-full object-cover bg-white"
                  />
                </div>
              </div>
            </div>

            {step === 'form' ? (
              <form onSubmit={handleNext} className="transfer-card p-8">
                <div className="grid grid-cols-12 gap-y-6 gap-x-8 items-center">
                  <label className="col-span-3 text-gray-700">
                    From Account :
                  </label>
                  <div className="col-span-9">
                    <select
                      value={fromAccount}
                      onChange={(e) => setFromAccount(e.target.value)}
                      className="underline-input bg-transparent"
                    >
                      <option value="">Select your account</option>
                      {accounts.map((a) => (
                        <option key={a.account_number} value={a.account_number}>
                          {a.account_name} - {a.account_number} (Rs.{' '}
                          {Number(a.balance).toLocaleString()})
                        </option>
                      ))}
                    </select>
                    {errors.fromAccount && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.fromAccount}
                      </div>
                    )}
                  </div>

                  <label className="col-span-3 text-gray-700">Amount :</label>
                  <div className="col-span-9">
                    <input
                      aria-label="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="underline-input"
                      placeholder="0.00"
                    />
                    {errors.amount && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.amount}
                      </div>
                    )}
                  </div>

                  <label className="col-span-3 text-gray-700">
                    To Account :
                  </label>
                  <div className="col-span-9">
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="underline-input"
                    />
                    {errors.accountNumber && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.accountNumber}
                      </div>
                    )}
                  </div>

                  <label className="col-span-3 text-gray-700">
                    Account Name :
                  </label>
                  <div className="col-span-9">
                    <input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="underline-input"
                    />
                    {errors.accountName && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.accountName}
                      </div>
                    )}
                  </div>

                  <label className="col-span-3 text-gray-700">
                    Select Bank :
                  </label>
                  <div className="col-span-9">
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="underline-input bg-transparent"
                    >
                      <option value="">Choose bank</option>
                      <option>First National</option>
                      <option>Global Trust</option>
                      <option>Union Bank</option>
                      <option>Nova Bank</option>
                    </select>
                    {errors.bank && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.bank}
                      </div>
                    )}
                  </div>

                  <label className="col-span-3 text-gray-700">
                    Description :
                  </label>
                  <div className="col-span-9">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="description-box"
                    />
                  </div>
                </div>

                <div className="flex justify-center mt-10">
                  <button
                    type="submit"
                    disabled={isRiskChecking}
                    className="next-btn disabled:opacity-50"
                  >
                    {isRiskChecking ? 'CHECKING...' : 'NEXT'}
                  </button>
                </div>
              </form>
            ) : step === 'confirm' ? (
              <div className="transfer-card p-8">
                <h3 className="text-center text-2xl font-semibold mb-6">
                  Confirm Transfer
                </h3>
                <div className="bg-white rounded-lg p-6 shadow-lg max-w-xl mx-auto text-center">
                  <p className="mb-4">
                    Confirm your transfer of{' '}
                    <strong className="text-purple-700 text-lg">
                      Rs. {Number(amount).toLocaleString()}
                    </strong>{' '}
                    to <strong>{accountName || 'recipient'}</strong>
                  </p>

                  <div className="mb-6 max-w-xs mx-auto text-left">
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

                  {transferError && (
                    <p className="text-red-500 font-semibold mb-4">
                      {transferError}
                    </p>
                  )}

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setStep('form')}
                      className="next-btn"
                      aria-label="back"
                    >
                      BACK
                    </button>
                    <button
                      onClick={handleTransfer}
                      className="next-btn transfer-btn"
                    >
                      TRANSFER
                    </button>
                  </div>
                </div>
              </div>
            ) : step === 'success' ? (
              <div className="transfer-card p-8">
                <div className="relative">
                  <div className="success-check inside-check">
                    <svg
                      viewBox="0 0 120 120"
                      width="100"
                      height="100"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <radialGradient id="g" cx="50%" cy="50%">
                          <stop offset="0%" stopColor="#28a745" />
                          <stop offset="100%" stopColor="#138a3e" />
                        </radialGradient>
                      </defs>
                      <circle cx="60" cy="60" r="50" fill="#dff7e7" />
                      <circle cx="60" cy="60" r="40" fill="#10a654" />
                      <path
                        d="M38 62 L54 78 L82 42"
                        stroke="#fff"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>

                  <h3 className="text-center text-2xl font-semibold mb-4">
                    Transfer Successful!
                  </h3>
                  <p className="text-center text-sm text-gray-500 mb-10">
                    Confirmation number : {confirmation}
                  </p>

                  <div className="flex justify-center">
                    <button
                      onClick={resetForm}
                      className="transfer-btn success-btn"
                    >
                      <span className="mr-3">‹</span> MAKE ANOTHER TRANSFER
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="transfer-card p-8">
                <div className="relative">
                  <div className="success-check inside-check">
                    <svg
                      viewBox="0 0 120 120"
                      width="120"
                      height="120"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="60" cy="60" r="50" fill="#ffdede" />
                      <circle cx="60" cy="60" r="40" fill="#ffb6b6" />
                      <path
                        d="M60 30 L93 86 L27 86 Z"
                        fill="#ff4d4f"
                        stroke="#fff"
                        strokeWidth="4"
                        strokeLinejoin="round"
                      />
                      <text
                        x="60"
                        y="78"
                        textAnchor="middle"
                        fontSize="36"
                        fill="#fff"
                        fontWeight="700"
                      >
                        !
                      </text>
                    </svg>
                  </div>

                  <h3 className="text-center text-2xl font-semibold mb-4 text-red-600">
                    Transaction Failed!
                  </h3>
                  <p className="text-center text-gray-700 font-medium mb-6">
                    {transferError}
                  </p>

                  <div className="flex justify-center">
                    <button
                      onClick={resetForm}
                      className="transfer-btn success-btn !bg-red-600"
                    >
                      <span className="mr-3">‹</span> TRY AGAIN
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showScamModal && riskResult && (
              <ScamShieldModal
                riskResult={riskResult}
                transactionCtx={{
                  amount,
                  toAccount: accountNumber,
                  reasons: riskResult.reasons,
                  firstTime: riskResult.firstTime
                }}
                onProceed={() => {
                  setShowScamModal(false)
                  setStep('confirm')
                }}
                onCancel={() => {
                  setShowScamModal(false)
                  setStep('form')
                }}
              />
            )}
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}
