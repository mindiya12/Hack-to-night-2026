'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearSession } from '@/lib/auth'
import type { ReactElement } from 'react'

type IconProps = { size?: number }

const icons: Record<string, (p: IconProps) => ReactElement> = {
  dashboard: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  customers: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 21v-1a7 7 0 0 1 14 0v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M19 8v6m-3-3h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  applications: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 8h10M7 12h7M7 16h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  teller: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  transactions: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M7 16V8m0 0L4 11m3-3 3 3M17 8v8m0 0 3-3m-3 3-3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  fraud: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v4m0 4h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const menuItems = [
  { label: 'DASHBOARD', path: '/admin', icon: 'dashboard' },
  { label: 'CUSTOMERS', path: '/admin/customers', icon: 'customers' },
  { label: 'APPLICATIONS', path: '/admin/applications', icon: 'applications' },
  { label: 'TELLER OPS', path: '/admin/teller', icon: 'teller' },
  { label: 'TRANSACTIONS', path: '/admin/transactions', icon: 'transactions' },
  { label: 'FRAUD CONSOLE', path: '/admin/fraud', icon: 'fraud' }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    clearSession()
    router.replace('/login')
  }

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-top">
        <div className="logo-row">
          <img src="/loginlogo.png" alt="Nova Bank" className="logo-img" />
          <div>
            <div className="brand">NOVA BANK</div>
            <div className="role-tag">ADMIN PANEL</div>
          </div>
        </div>

        <nav className="menu">
          {menuItems.map((item) => {
            const Icon = icons[item.icon]
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path} className="menu-link">
                <button className={`menu-item ${isActive ? 'active' : ''}`}>
                  <Icon size={17} />
                  {item.label}
                </button>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn" title="Sign out">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <polyline
              points="16 17 21 12 16 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="21"
              y1="12"
              x2="9"
              y2="12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Sign out</span>
        </button>
      </div>

      <style jsx>{`
        .admin-sidebar {
          width: 240px;
          min-height: 100vh;
          background: #0A2540;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .sidebar-top { display: flex; flex-direction: column; }
        .logo-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.1rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .logo-img { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; }
        .brand { color: white; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; }
        .role-tag {
          color: #00D4AA;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .menu {
          padding: 1.25rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .menu-link { text-decoration: none; }
        .menu-item {
          width: 100%;
          height: 44px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.72);
          text-align: left;
          padding: 0 1rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .menu-item.active {
          background: rgba(154, 92, 151, 0.35);
          color: white;
        }
        .menu-item:hover {
          background: rgba(154, 92, 151, 0.2);
          color: white;
        }
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          transition: all 0.2s;
          width: 100%;
        }
        .logout-btn:hover { color: white; background: rgba(255,255,255,0.08); }
      `}</style>
    </aside>
  )
}
