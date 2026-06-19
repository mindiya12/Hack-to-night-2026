'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import RouteGuard from '@/components/RouteGuard'

export default function SmartSpend() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.accounts.length > 0) {
          setAccounts(data.accounts)
          setSelectedAccount(data.accounts[0].account_number)
        } else {
          setLoading(false)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedAccount) return
    setLoading(true)
    fetch(`/api/transactions?account=${selectedAccount}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTransactions(data.transactions || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedAccount])

  // Analytics Logic
  const debits = transactions.filter((t) => t.from_account === selectedAccount)
  const totalSpent = debits.reduce((acc, t) => acc + Number(t.amount), 0)

  const credits = transactions.filter((t) => t.to_account === selectedAccount)
  const totalReceived = credits.reduce((acc, t) => acc + Number(t.amount), 0)

  // Group by basic categories derived from description
  const categoryTotals: Record<string, number> = {
    'Bills & Utilities': 0,
    Transfers: 0,
    Other: 0
  }

  debits.forEach((t) => {
    const desc = t.description?.toLowerCase() || ''
    const amt = Number(t.amount)
    if (desc.includes('bill pay')) categoryTotals['Bills & Utilities'] += amt
    else if (desc.includes('transfer')) categoryTotals['Transfers'] += amt
    else categoryTotals['Other'] += amt
  })

  const sortedCategories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )

  return (
    <RouteGuard>
      <div className="min-h-screen bg-bg-light font-geist p-0 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-12 text-black min-w-0 overflow-x-hidden bg-[#FFFFFF]">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#0A2540]">
              Smart Spend Analytics
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm font-medium outline-none shadow-sm"
              >
                <option value="">Select Account</option>
                {accounts.map((a) => (
                  <option key={a.account_number} value={a.account_number}>
                    {a.account_number}
                  </option>
                ))}
              </select>
              <div className="size-12 overflow-hidden rounded-full border-2 border-gray-200">
                <img
                  src="/avatar.png"
                  alt="avatar"
                  className="size-full bg-white object-cover"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-20 text-center text-gray-500 font-medium">
              Loading analytics...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-gray-500 font-medium mb-2">
                      Total Spent
                    </p>
                    <h3 className="text-2xl lg:text-4xl font-bold text-red-600 break-all">
                      Rs. {totalSpent.toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-gray-500 font-medium mb-2">
                      Total Received
                    </p>
                    <h3 className="text-2xl lg:text-4xl font-bold text-green-600 break-all">
                      Rs. {totalReceived.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold mb-6 text-[#0A2540]">
                    Spending by Category
                  </h3>
                  <div className="space-y-6">
                    {sortedCategories.map(([cat, amt]) => {
                      const percentage =
                        totalSpent > 0 ? (amt / totalSpent) * 100 : 0
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-sm font-medium mb-2">
                            <span>{cat}</span>
                            <span>Rs. {amt.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div
                              className="bg-[#00D4AA] h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#0A2540] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-20 text-6xl">
                  💡
                </div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span>AI Insights</span>
                </h3>

                <div className="space-y-4">
                  {totalSpent > totalReceived * 1.5 && (
                    <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                      <p className="font-medium text-amber-300 mb-1">
                        High Spending Alert
                      </p>
                      <p className="text-sm text-gray-300">
                        You've spent significantly more than you've received
                        recently. Consider reviewing your upcoming expenses.
                      </p>
                    </div>
                  )}
                  {categoryTotals['Bills & Utilities'] > totalSpent * 0.4 && (
                    <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                      <p className="font-medium text-purple-300 mb-1">
                        Utility Heavy
                      </p>
                      <p className="text-sm text-gray-300">
                        A large portion of your spending is on bills. Setting up
                        automated payments can help avoid late fees.
                      </p>
                    </div>
                  )}
                  {totalSpent === 0 && (
                    <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                      <p className="font-medium text-green-300 mb-1">
                        Great Job!
                      </p>
                      <p className="text-sm text-gray-300">
                        You haven't spent any money from this account recently.
                        Keep up the good savings habit!
                      </p>
                    </div>
                  )}
                  {totalSpent > 0 && totalSpent <= totalReceived && (
                    <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
                      <p className="font-medium text-green-300 mb-1">
                        Healthy Cashflow
                      </p>
                      <p className="text-sm text-gray-300">
                        Your spending is well within your incoming funds. You're
                        maintaining a healthy balance!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </RouteGuard>
  )
}
