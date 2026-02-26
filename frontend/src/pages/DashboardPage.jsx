import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Folder, Trash2, ArrowRight, FileText, Loader, X } from 'lucide-react'
import api from '../api/client'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    try {
      const { data } = await api.get('/workspaces/')
      setWorkspaces(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/workspaces/', { name, description: desc })
      setWorkspaces(w => [data, ...w])
      setShowModal(false)
      setName(''); setDesc('')
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this workspace?')) return
    try {
      await api.delete(`/workspaces/${id}`)
      setWorkspaces(w => w.filter(ws => ws.id !== id))
    } catch (e) { console.error(e) }
  }

  const colors = ['var(--neon)', 'var(--violet)', 'var(--amber)', 'var(--blue)', 'var(--red)']

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 40,
        animation: 'fadeUp 0.4s ease both',
      }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.08em' }}>
            // WORKSPACES
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            Your <span className="neon-text">Knowledge</span> Bases
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px',
            background: 'var(--neon)',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            color: '#000',
            transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 24px var(--neon-glow)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <Plus size={15} /> New Workspace
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text3)' }}>
          <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
        </div>
      ) : workspaces.length === 0 ? (
        <EmptyState onNew={() => setShowModal(true)} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {workspaces.map((ws, i) => (
            <WorkspaceCard
              key={ws.id}
              ws={ws}
              color={colors[i % colors.length]}
              index={i}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              onDelete={(e) => handleDelete(e, ws.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease',
        }}
          onClick={() => setShowModal(false)}
        >
          <div style={{
            background: 'var(--bg1)',
            border: '1px solid var(--border2)',
            borderRadius: 12,
            padding: 32,
            width: '100%',
            maxWidth: 440,
            animation: 'fadeUp 0.25s ease',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>New Workspace</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text3)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Product Docs, Research Papers..."
                  required
                  autoFocus
                  style={{
                    width: '100%', padding: '11px 13px',
                    background: 'var(--bg2)', border: '1px solid var(--border2)',
                    borderRadius: 7, fontSize: 14, color: 'var(--text)',
                    fontFamily: 'var(--font)',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Description</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="What documents will you store here?"
                  rows={3}
                  style={{
                    width: '100%', padding: '11px 13px',
                    background: 'var(--bg2)', border: '1px solid var(--border2)',
                    borderRadius: 7, fontSize: 14, color: 'var(--text)',
                    fontFamily: 'var(--font)', resize: 'vertical',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !name.trim()}
                style={{
                  padding: '12px',
                  background: creating || !name.trim() ? 'var(--bg3)' : 'var(--neon)',
                  borderRadius: 8, fontWeight: 700, fontSize: 14,
                  color: creating || !name.trim() ? 'var(--text3)' : '#000',
                  cursor: creating || !name.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4,
                }}
              >
                {creating ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <>Create Workspace <ArrowRight size={14} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkspaceCard({ ws, color, index, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg1)',
        border: `1px solid ${hovered ? color + '40' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '22px 22px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: `fadeUp 0.4s ${index * 0.06}s both ease`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 32px ${color}18` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Color accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color,
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.2s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          <Folder size={17} />
        </div>
        <button
          onClick={onDelete}
          style={{
            color: 'var(--text3)', padding: 5, borderRadius: 5,
            transition: 'all 0.15s',
            opacity: hovered ? 1 : 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,68,85,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 5, letterSpacing: '-0.02em' }}>
        {ws.name}
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.5, minHeight: 32 }}>
        {ws.description || 'No description'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: 'var(--text3)',
          fontFamily: 'var(--mono)',
        }}>
          <FileText size={11} /> {ws.doc_count} doc{ws.doc_count !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          {formatDistanceToNow(new Date(ws.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 400, gap: 20,
      animation: 'fadeIn 0.5s ease',
    }}>
      <div style={{
        width: 72, height: 72,
        border: '2px dashed var(--border2)',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)',
      }}>
        <Folder size={28} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>No workspaces yet</h3>
        <p style={{ color: 'var(--text3)', fontSize: 13.5 }}>Create your first workspace to start uploading documents</p>
      </div>
      <button
        onClick={onNew}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '10px 20px',
          background: 'var(--bg2)',
          border: '1px solid var(--neon)',
          borderRadius: 8,
          color: 'var(--neon)',
          fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--neon-glow)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)' }}
      >
        <Plus size={14} /> Create workspace
      </button>
    </div>
  )
}
