import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Zap, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react'

export default function AuthPage({ mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { login, register, loading, error, clearError, token } = useAuthStore()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  useEffect(() => {
    setMounted(true)
    clearError()
    if (token) navigate('/')
  }, [mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = isLogin
      ? await login(email, password)
      : await register(email, password, name)
    if (ok) navigate('/')
  }

  const inputStyle = (focused) => ({
    width: '100%',
    background: 'var(--bg2)',
    border: `1px solid ${focused ? 'var(--neon)' : 'var(--border2)'}`,
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font)',
    boxShadow: focused ? '0 0 0 3px var(--neon-glow)' : 'none',
  })

  const [focusedField, setFocusedField] = useState(null)

  return (
    <div style={{
      height: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow spots */}
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)',
        top: '-200px', left: '-100px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(159,94,255,0.08) 0%, transparent 70%)',
        bottom: '-100px', right: '0px',
        pointerEvents: 'none',
      }} />

      {/* Form */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '0 24px',
        animation: mounted ? 'fadeUp 0.5s ease both' : 'none',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--grad-neon)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Zap size={26} color="#000" fill="#000" />
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text)',
            marginBottom: 6,
          }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13.5 }}>
            {isLogin ? 'Sign in to your RAG workspace' : 'Start chatting with your documents'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle(focusedField === 'name')}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle(focusedField === 'email')}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle(focusedField === 'pass'), paddingRight: 44 }}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', padding: 4,
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,68,85,0.1)',
              border: '1px solid rgba(255,68,85,0.3)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--red)',
              animation: 'fadeIn 0.2s ease',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? 'var(--bg3)' : 'var(--grad-neon)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              color: loading ? 'var(--text3)' : '#000',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
              marginTop: 4,
              letterSpacing: '-0.01em',
            }}
          >
            {loading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : <>{isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--text3)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? '/register' : '/login'} style={{
            color: 'var(--neon)',
            fontWeight: 600,
          }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
