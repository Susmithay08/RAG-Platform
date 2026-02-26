import { useEffect, useState } from 'react'
import { BarChart3, FileText, MessageSquare, Zap, Clock, TrendingUp, Loader } from 'lucide-react'
import api from '../api/client'
import { formatDistanceToNow } from 'date-fns'

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    api.get('/stats/').then(({ data }) => {
      setStats(data)
      setLoading(false)
      setTimeout(() => setAnimated(true), 100)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text3)' }}>
      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading analytics…
    </div>
  )

  const tiles = [
    { label: 'Workspaces', value: stats?.total_workspaces ?? 0, icon: <BarChart3 size={18} />, color: 'var(--neon)', grad: 'var(--grad-neon)' },
    { label: 'Documents', value: stats?.total_docs ?? 0, icon: <FileText size={18} />, color: 'var(--violet)', grad: 'var(--grad-violet)' },
    { label: 'Total Queries', value: stats?.total_queries ?? 0, icon: <MessageSquare size={18} />, color: 'var(--amber)', grad: 'var(--grad-fire)' },
    { label: 'Avg Response', value: stats?.avg_duration_ms ? `${stats.avg_duration_ms}ms` : '—', icon: <Clock size={18} />, color: 'var(--blue)', grad: 'linear-gradient(135deg, #00aaff, #00ffcc)' },
  ]

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36, animation: 'fadeUp 0.4s ease both' }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.08em' }}>
          // ANALYTICS
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
          Usage <span className="violet-text">Overview</span>
        </h1>
      </div>

      {/* Stat tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 36,
      }}>
        {tiles.map((t, i) => (
          <StatTile key={t.label} {...t} delay={i * 0.07} animated={animated} />
        ))}
      </div>

      {/* Recent queries */}
      <div style={{ animation: 'fadeUp 0.5s 0.3s both ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={14} style={{ color: 'var(--neon)' }} />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Recent Queries
          </h2>
          <span style={{
            fontSize: 10, padding: '2px 7px',
            background: 'var(--neon-glow)', border: '1px solid var(--neon)',
            borderRadius: 20, color: 'var(--neon)',
            fontFamily: 'var(--mono)',
          }}>
            {stats?.recent_queries?.length ?? 0}
          </span>
        </div>

        {stats?.recent_queries?.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            No queries yet. Start chatting with your documents!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats?.recent_queries?.map((q, i) => (
              <QueryRow key={i} q={q} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, icon, color, grad, delay, animated }) {
  return (
    <div style={{
      background: 'var(--bg1)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '22px 20px',
      position: 'relative',
      overflow: 'hidden',
      animation: `fadeUp 0.4s ${delay}s both ease`,
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}12, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 36, height: 36,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
        marginBottom: 16,
      }}>
        {icon}
      </div>

      <div style={{
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        background: 'none',
        WebkitTextFillColor: 'unset',
        color: animated ? color : 'var(--text3)',
        transition: 'all 0.5s ease',
        marginBottom: 4,
        fontFamily: 'var(--mono)',
        animation: animated ? 'countUp 0.5s ease' : 'none',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  )
}

function QueryRow({ q, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 16px',
        background: hovered ? 'var(--bg2)' : 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        transition: 'all 0.15s',
        animation: `slideIn 0.3s ${index * 0.04}s both ease`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--neon)', flexShrink: 0,
        boxShadow: '0 0 6px var(--neon)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 2,
        }}>
          {q.query}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
        </p>
      </div>
      {q.duration_ms && (
        <span style={{
          fontSize: 10, color: 'var(--text3)',
          fontFamily: 'var(--mono)',
          background: 'var(--bg3)',
          padding: '3px 8px', borderRadius: 4,
          flexShrink: 0,
        }}>
          {q.duration_ms}ms
        </span>
      )}
    </div>
  )
}
