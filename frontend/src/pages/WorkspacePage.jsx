import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Send, FileText, Trash2, Loader, ArrowLeft, X, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import api from '../api/client'

export default function WorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [docs, setDocs] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [querying, setQuerying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [tab, setTab] = useState('chat') // chat | docs
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    loadWorkspace()
    loadDocs()
    return () => clearInterval(pollRef.current)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, querying])

  const loadWorkspace = async () => {
    try {
      const { data } = await api.get('/workspaces/')
      const ws = data.find(w => w.id === id)
      if (ws) setWorkspace(ws)
    } catch (e) { console.error(e) }
  }

  const loadDocs = async () => {
    try {
      const { data } = await api.get(`/documents/${id}`)
      setDocs(data)
      // Poll if any processing
      if (data.some(d => d.status === 'processing')) {
        clearInterval(pollRef.current)
        pollRef.current = setInterval(async () => {
          const { data: fresh } = await api.get(`/documents/${id}`)
          setDocs(fresh)
          if (!fresh.some(d => d.status === 'processing')) clearInterval(pollRef.current)
        }, 2000)
      }
    } catch (e) { console.error(e) }
  }

  const handleUpload = async (files) => {
    if (!files.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        await api.post(`/documents/${id}/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (e) {
        alert(e.response?.data?.detail || `Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    loadDocs()
  }

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return
    try {
      await api.delete(`/documents/${id}/${docId}`)
      setDocs(d => d.filter(doc => doc.id !== docId))
    } catch (e) { console.error(e) }
  }

  const handleQuery = async () => {
    if (!input.trim() || querying) return
    const q = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setQuerying(true)
    try {
      const { data } = await api.post(`/chat/${id}`, { query: q })
      setMessages(m => [...m, { role: 'assistant', content: data.answer, sources: data.sources, duration_ms: data.duration_ms }])
    } catch (e) {
      setMessages(m => [...m, { role: 'error', content: e.response?.data?.detail || 'Query failed' }])
    } finally {
      setQuerying(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery() }
  }

  const readyDocs = docs.filter(d => d.status === 'ready').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div style={{
        padding: '14px 28px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg1)',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ color: 'var(--text3)', padding: 4, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {workspace?.name || '…'}
          </h2>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            {readyDocs} doc{readyDocs !== 1 ? 's' : ''} indexed
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', padding: 3, borderRadius: 8 }}>
          {['chat', 'docs'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px', borderRadius: 6,
              fontSize: 12.5, fontWeight: 600,
              background: tab === t ? 'var(--bg3)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--text3)',
              border: tab === t ? '1px solid var(--border2)' : '1px solid transparent',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'chat' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {messages.length === 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 16,
                animation: 'fadeIn 0.5s ease',
              }}>
                <div style={{
                  fontSize: 48, marginBottom: 8,
                  background: 'var(--grad-neon)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>⚡</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>
                  Ask anything
                </h3>
                <p style={{ color: 'var(--text3)', fontSize: 13.5, textAlign: 'center', maxWidth: 360 }}>
                  {readyDocs > 0
                    ? `Chat with your ${readyDocs} indexed document${readyDocs !== 1 ? 's' : ''}. Ask questions and get AI-powered answers.`
                    : 'Upload documents in the Docs tab first, then come back to ask questions.'}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} index={i} />
            ))}
            {querying && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--grad-neon)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 14 }}>⚡</span>
                </div>
                <div style={{
                  background: 'var(--bg2)', borderRadius: '4px 12px 12px 12px',
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {[0,1,2].map(j => (
                    <span key={j} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--neon)', display: 'inline-block',
                      animation: `bounce 1.3s ${j*0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px 28px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg1)',
          }}>
            <div style={{
              display: 'flex', gap: 10,
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              borderRadius: 10,
              padding: '6px 6px 6px 16px',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a question about your documents…"
                rows={1}
                style={{
                  flex: 1, resize: 'none', fontSize: 14,
                  lineHeight: 1.6, color: 'var(--text)',
                  background: 'transparent', padding: '7px 0',
                  maxHeight: 120, fontFamily: 'var(--font)',
                }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onFocus={e => e.currentTarget.parentElement.style.borderColor = 'var(--neon)'}
                onBlur={e => e.currentTarget.parentElement.style.borderColor = 'var(--border2)'}
              />
              <button
                onClick={handleQuery}
                disabled={!input.trim() || querying}
                style={{
                  width: 38, height: 38,
                  borderRadius: 8,
                  background: input.trim() && !querying ? 'var(--neon)' : 'var(--bg3)',
                  color: input.trim() && !querying ? '#000' : 'var(--text3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: input.trim() && !querying ? 'scale(1)' : 'scale(0.95)',
                  alignSelf: 'flex-end', marginBottom: 3,
                  cursor: input.trim() && !querying ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={e => { if (input.trim() && !querying) e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Documents tab */
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--neon)' : 'var(--border2)'}`,
              borderRadius: 12,
              padding: '36px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--neon-glow)' : 'var(--bg1)',
              transition: 'all 0.2s ease',
              marginBottom: 28,
              animation: 'fadeUp 0.4s ease both',
            }}
          >
            <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.md,.docx" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
            {uploading
              ? <><Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--neon)', margin: '0 auto 10px', display: 'block' }} /><p style={{ color: 'var(--neon)', fontWeight: 600 }}>Uploading…</p></>
              : <>
                <Upload size={28} style={{ color: dragOver ? 'var(--neon)' : 'var(--text3)', margin: '0 auto 12px', display: 'block', transition: 'color 0.2s' }} />
                <p style={{ color: dragOver ? 'var(--neon)' : 'var(--text2)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Drop files here or click to upload
                </p>
                <p style={{ color: 'var(--text3)', fontSize: 12 }}>PDF, TXT, MD, DOCX · Max 20MB each</p>
              </>
            }
          </div>

          {/* Doc list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map((doc, i) => (
              <DocRow key={doc.id} doc={doc} index={i} onDelete={() => handleDelete(doc.id)} />
            ))}
            {docs.length === 0 && !uploading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                No documents yet. Upload your first file above.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg, index }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  return (
    <div style={{
      display: 'flex', gap: 12, marginBottom: 20,
      animation: `fadeUp 0.3s ${index * 0.03}s both ease`,
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: isError ? 'rgba(255,68,85,0.2)' : 'var(--grad-neon)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, marginTop: 2,
        }}>
          {isError ? '!' : '⚡'}
        </div>
      )}

      <div style={{ maxWidth: '75%' }}>
        <div style={{
          background: isUser ? 'var(--bg3)' : isError ? 'rgba(255,68,85,0.08)' : 'var(--bg2)',
          border: `1px solid ${isUser ? 'var(--border2)' : isError ? 'rgba(255,68,85,0.25)' : 'var(--border)'}`,
          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          padding: '12px 16px',
          fontSize: 13.5,
          color: isError ? 'var(--red)' : 'var(--text)',
          lineHeight: 1.75,
        }}>
          {isUser ? (
            <span>{msg.content}</span>
          ) : (
            <ReactMarkdown components={{
              p: ({ children }) => <p style={{ marginBottom: 8 }}>{children}</p>,
              code: ({ children }) => <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4, fontSize: '0.88em', color: 'var(--neon)', fontFamily: 'var(--mono)' }}>{children}</code>,
              strong: ({ children }) => <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{children}</strong>,
              ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 8 }}>{children}</ul>,
              li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
            }}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Sources + timing */}
        {msg.sources?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowSources(!showSources)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: 'var(--text3)',
                fontFamily: 'var(--mono)',
                padding: '3px 8px',
                border: '1px solid var(--border)',
                borderRadius: 4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--neon)'; e.currentTarget.style.borderColor = 'var(--neon)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {showSources ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}
              {msg.duration_ms && <><span style={{ opacity: 0.4 }}>·</span><Clock size={9} /> {msg.duration_ms}ms</>}
            </button>

            {showSources && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5, animation: 'fadeIn 0.2s ease' }}>
                {msg.sources.map((s, i) => (
                  <div key={i} style={{
                    padding: '8px 10px',
                    background: 'var(--bg1)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 11,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: 'var(--neon)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{s.filename}</span>
                      <span style={{ color: 'var(--text3)' }}>score: {s.score}</span>
                    </div>
                    <p style={{ color: 'var(--text3)', lineHeight: 1.5 }}>{s.preview}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DocRow({ doc, index, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const statusColor = doc.status === 'ready' ? 'var(--neon)' : doc.status === 'error' ? 'var(--red)' : 'var(--amber)'
  const StatusIcon = doc.status === 'ready' ? CheckCircle : doc.status === 'error' ? AlertCircle : Loader

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 16px',
        background: hovered ? 'var(--bg2)' : 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 9,
        transition: 'all 0.15s',
        animation: `slideIn 0.3s ${index * 0.04}s both ease`,
      }}
    >
      <FileText size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.filename}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--mono)' }}>
          {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)}KB` : ''}
          {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <StatusIcon
          size={13}
          style={{
            color: statusColor,
            animation: doc.status === 'processing' ? 'spin 1s linear infinite' : 'none',
          }}
        />
        <span style={{ fontSize: 11, color: statusColor, fontFamily: 'var(--mono)' }}>
          {doc.status}
        </span>
      </div>
      <button
        onClick={onDelete}
        style={{
          color: 'var(--text3)', padding: 5, borderRadius: 5,
          opacity: hovered ? 1 : 0, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,68,85,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
