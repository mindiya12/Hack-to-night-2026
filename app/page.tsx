import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-light font-geist text-black">
      {/* Header */}
      <header className="flex justify-between items-center py-6 px-12 bg-white shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image
            src="/loginlogo.png"
            alt="Nova Bank Logo"
            width={48}
            height={48}
            className="rounded-full"
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2540]">
            Nova Bank
          </h1>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full font-bold text-[#0A2540] hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2.5 rounded-full font-bold bg-[#0A2540] text-white hover:bg-[#143A5C] transition"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center pt-24 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-200 rounded-full blur-[120px] opacity-30 -z-10" />

        <h2 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-tight">
          The Future of Banking is{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4AA] to-indigo-600">
            Smart & Secure
          </span>
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
          Experience seamless transfers, intelligent spend analytics, and our
          advanced Scam Shield technology designed to keep your money safe.
        </p>

        <div className="flex gap-6">
          <Link
            href="/sign-up"
            className="px-8 py-4 rounded-full font-bold text-lg bg-[#00D4AA] text-white hover:bg-[#00A383] shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1"
          >
            Open an Account Today
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-[#FFFFFF] p-10 rounded-[2rem] border border-gray-100">
            <div className="text-4xl mb-6">🛡️</div>
            <h3 className="text-2xl font-bold mb-4 text-[#0A2540]">
              Scam Shield
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Our AI-powered guardian analyzes every transfer in real-time to
              protect you from advanced social engineering and fraud.
            </p>
          </div>
          <div className="bg-[#FFFFFF] p-10 rounded-[2rem] border border-gray-100">
            <div className="text-4xl mb-6">📊</div>
            <h3 className="text-2xl font-bold mb-4 text-[#0A2540]">
              Smart Spend
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Track your expenses effortlessly with beautiful dashboards,
              automated categorization, and intelligent AI insights.
            </p>
          </div>
          <div className="bg-[#FFFFFF] p-10 rounded-[2rem] border border-gray-100">
            <div className="text-4xl mb-6">⚡</div>
            <h3 className="text-2xl font-bold mb-4 text-[#0A2540]">
              Instant Payments
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Pay your utility bills and transfer funds instantly to any bank
              with bank-grade security and zero friction.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
