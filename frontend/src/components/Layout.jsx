import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, BarChart3, LogOut, Database, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [hoveredLink, setHoveredLink] = useState(null)

  const handleLogout = () => { logout(); navigate('/login') }

  const links = [
    { to: '/', end: true, icon: <LayoutDashboard size={16} />, label: 'Workspaces' },
    { to: '/stats', icon: <BarChart3 size={16} />, label: 'Analytics' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg1)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34,
              background: 'var(--grad-neon)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="#000" fill="#000" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                RAG<span className="neon-text">Platform</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: '0.05em' }}>
                v1.0.0
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {links.map(({ to, end, icon, label }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 500,
              color: isActive ? '#000' : 'var(--text2)',
              background: isActive ? 'var(--neon)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              border: `1px solid ${isActive ? 'transparent' : 'transparent'}`,
            })}
              onMouseEnter={e => {
                if (!e.currentTarget.className.includes('active')) {
                  e.currentTarget.style.color = 'var(--text)'
                  e.currentTarget.style.background = 'var(--bg2)'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('rgb(0, 255')) {
                  e.currentTarget.style.color = 'var(--text2)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {icon} {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            padding: '10px 12px',
            background: 'var(--bg2)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            marginBottom: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--text3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,68,85,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  )
}
