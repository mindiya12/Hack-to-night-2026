'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/authButton'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    nic: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Sign up failed')
        return
      }

      router.push('/login')
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Username', name: 'username', type: 'text' },
    { label: 'Full Name', name: 'fullName', type: 'text' },
    { label: 'Email', name: 'email', type: 'email' },
    { label: 'NIC', name: 'nic', type: 'text' },
    { label: 'Password', name: 'password', type: 'password' },
    { label: 'Confirm Password', name: 'confirmPassword', type: 'password' }
  ]

  return (
    <section className="mx-auto min-h-[700px] w-full max-w-[1100px] rounded-[58px] bg-white px-8 py-9 shadow-[0_1px_3px_0_rgba(0,0,0,0.30),0_4px_8px_3px_rgba(0,0,0,0.15)] lg:min-h-[820px] lg:px-14">
      <div className="relative mx-auto w-full max-w-[860px]">
        <img
          src="/loginlogo.png"
          alt="Nova Bank"
          className="absolute left-0 top-0 hidden w-[128px] md:block"
        />

        <h1 className="mb-12 text-center text-[2.6rem] font-bold text-black text-balance">
          SIGN UP
        </h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          {fields.map((field) => (
            <div
              className="grid items-center gap-4 md:grid-cols-[180px_1fr]"
              key={field.name}
            >
              <label
                className="text-xl text-black"
                htmlFor={`signup-${field.name}`}
              >
                {field.label} :
              </label>
              <input
                id={`signup-${field.name}`}
                name={field.name}
                type={field.type}
                value={formData[field.name as keyof typeof formData]}
                onChange={handleChange}
                required
                className="h-[64px] rounded-[40px] border-0 bg-[#d9d9d9] px-7 text-lg text-black outline-none"
              />
            </div>
          ))}

          {error && (
            <p className="text-red-500 font-semibold text-center mt-4">
              {error}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <AuthButton
              type="submit"
              disabled={loading}
              className="disabled:opacity-50"
            >
              {loading ? '...' : 'SIGN UP'}
            </AuthButton>
          </div>
        </form>
      </div>
    </section>
  )
}
