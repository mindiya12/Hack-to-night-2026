'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AuthButton from '@/components/authButton'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState(1) // 1: Email, 2: OTP & Password
  const [error, setError] = useState('')

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (step === 1) {
      if (!email) {
        setError('Please enter your email')
        return
      }
      setStep(2)
    } else {
      if (otp !== '123456') {
        setError('Invalid OTP. Use 123456 for demo.')
        return
      }
      if (!password) {
        setError('Please enter a new password')
        return
      }
      // Demo success
      router.push('/login')
    }
  }

  return (
    <section className="mx-auto flex min-h-[500px] w-full max-w-[1100px] items-center justify-center rounded-[58px] bg-white px-8 py-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[684px]">
      <div className="w-full max-w-[670px]">
        <h1 className="mb-16 text-center text-[2.6rem] font-bold text-black text-balance">
          RESET PASSWORD
        </h1>

        <form onSubmit={handleReset} className="space-y-8">
          <div className="grid items-center gap-4 md:grid-cols-[120px_1fr]">
            <label className="text-xl text-black" htmlFor="reset-email">
              Email:
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === 2}
              className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none disabled:opacity-50"
            />
          </div>

          {step === 2 && (
            <>
              <div className="grid items-center gap-4 md:grid-cols-[120px_250px]">
                <label className="text-xl text-black" htmlFor="reset-otp">
                  OTP:
                </label>
                <input
                  id="reset-otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Demo: 123456"
                  className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
                />
              </div>

              <div className="grid items-center gap-4 md:grid-cols-[120px_250px]">
                <label className="text-xl text-black" htmlFor="reset-password">
                  New Password:
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 font-semibold text-center">{error}</p>
          )}

          <div className="mt-12 flex justify-center">
            <AuthButton type="submit">
              {step === 1 ? 'SEND OTP' : 'RESET & SIGN IN'}
            </AuthButton>
          </div>
        </form>
      </div>
    </section>
  )
}
