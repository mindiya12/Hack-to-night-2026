'use client'

import { useEffect, useState } from 'react'
import RouteGuard from '@/components/RouteGuard'
import Sidebar from '@/components/sidebar'
import { getSession } from '@/lib/auth'

export default function EStatementPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getSession())
    fetch('/api/accounts')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.accounts) {
          setAccounts(data.accounts)
          if (data.accounts.length > 0) {
            setSelectedAccount(data.accounts[0].account_number)
          }
        }
      })
  }, [])

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedAccount) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/transactions?account=${selectedAccount}&limit=100`
      )
      const data = await res.json()
      if (data.ok) setTransactions(data.transactions || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAccount) handleGenerate()
  }, [selectedAccount])

  const accountInfo = accounts.find((a) => a.account_number === selectedAccount)

  const printStatement = () => {
    window.print()
  }

  const downloadCSV = () => {
    const header = ['Date', 'Description', 'Reference ID', 'Amount']
    const rows = transactions.map((t) => [
      new Date(t.created_at).toLocaleDateString(),
      t.description || 'Transfer',
      t.id,
      t.from_account === selectedAccount ? `-${t.amount}` : `+${t.amount}`
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header, ...rows].map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `statement_${selectedAccount}.csv`)
    document.body.appendChild(link)
    link.click()
  }

  let runningBalance = Number(accountInfo?.balance || 0)

  return (
    <RouteGuard>
      <div className="min-h-screen bg-bg-light font-geist p-0">
        <div className="flex min-h-screen">
          <div className="print:hidden">
            <Sidebar />
          </div>

          <main className="flex-1 p-6 md:p-12 text-black min-w-0 overflow-x-hidden print:p-0">
            <div className="mb-10 flex items-center justify-between print:hidden">
              <h2 className="text-2xl font-semibold">E-Statement</h2>
              <div className="flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-full border-2 border-gray-200">
                  <img
                    src="/avatar.png"
                    alt="avatar"
                    className="size-full bg-white object-cover"
                  />
                </div>
              </div>
            </div>

            <form
              onSubmit={handleGenerate}
              className="rounded-[32px] bg-white px-10 py-8 text-black shadow-md mb-6 print:hidden"
            >
              <div className="grid items-end gap-6 text-xl md:grid-cols-[auto_1fr_auto_auto]">
                <span>Select account:</span>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="min-w-0 border-0 border-b border-black bg-transparent px-2 py-1 text-xl text-black outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.account_number} value={a.account_number}>
                      {a.account_name} - {a.account_number}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={printStatement}
                  className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold"
                >
                  PRINT
                </button>
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold"
                >
                  CSV
                </button>
              </div>
            </form>

            {loading ? (
              <div className="text-center py-10">Loading statement...</div>
            ) : (
              <section
                aria-label="Bank statement preview"
                className="mt-6 min-h-[560px] bg-[#F6F9FC] px-7 py-9 text-black print:bg-white print:p-0"
              >
                <div className="max-w-full">
                  <img
                    src="/loginlogo.png"
                    alt="Nova Bank"
                    className="size-[86px] rounded-full object-cover"
                  />

                  <div className="mt-5 text-sm leading-tight">
                    <h2 className="font-bold text-lg mb-4">Bank Statement</h2>
                    <dl className="grid grid-cols-2 gap-2 max-w-md">
                      <dt className="font-medium">Account Holder:</dt>
                      <dd>{user?.full_name}</dd>
                      <dt className="font-medium">Account Number:</dt>
                      <dd>{selectedAccount}</dd>
                      <dt className="font-medium">Account Name:</dt>
                      <dd>{accountInfo?.account_name}</dd>
                    </dl>
                  </div>

                  <div className="mt-10 border-t border-black pt-9">
                    <h3 className="text-sm font-bold mb-4">
                      Transaction Details
                    </h3>

                    <div className="mt-5 overflow-x-auto">
                      <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="w-[15%] pb-3 font-semibold">Date</th>
                            <th className="w-[30%] pb-3 font-semibold">
                              Description
                            </th>
                            <th className="w-[20%] pb-3 font-semibold">
                              Reference ID
                            </th>
                            <th className="w-[15%] pb-3 font-semibold text-right">
                              Debit(-)
                            </th>
                            <th className="w-[15%] pb-3 font-semibold text-right">
                              Credit(+)
                            </th>
                            <th className="w-[15%] pb-3 font-semibold text-right">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.length === 0 ? (
                            <tr>
                              <td
                                className="py-4 text-center text-gray-500"
                                colSpan={6}
                              >
                                No transactions found.
                              </td>
                            </tr>
                          ) : (
                            // Since API returns ordered by desc, we map them but we calculate running balance in reverse, or just show current balance
                            transactions.map((t) => {
                              const isDebit = t.from_account === selectedAccount
                              const amount = Number(t.amount)

                              // A simple hack for running balance on a descending list
                              const currentLineBal = runningBalance
                              if (isDebit) runningBalance += amount
                              else runningBalance -= amount

                              return (
                                <tr
                                  key={t.id}
                                  className="border-b border-gray-300/50"
                                >
                                  <td className="py-3">
                                    {new Date(
                                      t.created_at
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 truncate pr-4">
                                    {t.description || 'Transfer'}
                                  </td>
                                  <td className="py-3 text-xs text-gray-500">
                                    {t.id}
                                  </td>
                                  <td className="py-3 text-right text-red-600 font-medium">
                                    {isDebit ? amount.toLocaleString() : ''}
                                  </td>
                                  <td className="py-3 text-right text-green-600 font-medium">
                                    {!isDebit ? amount.toLocaleString() : ''}
                                  </td>
                                  <td className="py-3 text-right font-medium">
                                    {currentLineBal.toLocaleString()}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </RouteGuard>
  )
}
