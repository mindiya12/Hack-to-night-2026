import { useState } from 'react'

export function ScamShieldModal({
  riskResult,
  onProceed,
  onCancel,
  transactionCtx
}: {
  riskResult: any
  onProceed: () => void
  onCancel: () => void
  transactionCtx: any
}) {
  const [guardianText, setGuardianText] = useState('')
  const [loading, setLoading] = useState(false)

  const askGuardian = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scam-guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionCtx)
      })
      const data = await res.json()
      if (data.ok) setGuardianText(data.explanation)
      else setGuardianText(data.message || 'Guardian is offline at the moment.')
    } catch {
      setGuardianText('Could not reach Guardian.')
    } finally {
      setLoading(false)
    }
  }

  const isHigh = riskResult.level === 'HIGH'
  const isMed = riskResult.level === 'MEDIUM'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-t-8 ${isHigh ? 'border-red-600' : 'border-amber-500'}`}
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`text-4xl ${isHigh ? 'text-red-600' : 'text-amber-600'}`}
            >
              ⚠️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">
                {isHigh ? 'Transfer Stopped' : 'Unusual Activity Detected'}
              </h2>
              <p className="text-gray-600">Nova Bank Scam Shield</p>
            </div>
          </div>

          <ul className="mb-6 space-y-2">
            {riskResult.reasons.map((r: string, i: number) => (
              <li
                key={i}
                className="flex gap-2 text-gray-800 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100"
              >
                <span className="text-red-500 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {guardianText && (
            <div className="mb-6 bg-purple-50 text-purple-900 p-4 rounded-xl border border-purple-100 text-sm leading-relaxed whitespace-pre-line">
              <strong>🛡️ Guardian:</strong> {guardianText}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!guardianText && (
              <button
                onClick={askGuardian}
                disabled={loading}
                className="w-full bg-[#0A2540] hover:bg-[#143A5C] text-white font-bold py-4 rounded-full transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                🛡️ {loading ? 'Analyzing...' : 'Ask Guardian for Advice'}
              </button>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 rounded-full transition"
              >
                Cancel Transfer
              </button>
              {(!isHigh || guardianText) && (
                <button
                  onClick={onProceed}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-full border border-red-200 transition"
                >
                  Proceed Anyway
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
