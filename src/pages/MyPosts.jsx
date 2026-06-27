import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../lib/AuthContext'

function statusLabel(item) {
  if (item.flag_count >= 3) return { text: 'Removed by flags', color: '#e63946' }
  if (!item.is_active) return { text: 'Deleted', color: '#999' }
  if (new Date(item.expires_at) < new Date()) return { text: 'Expired', color: '#f4a261' }
  return { text: 'Active', color: '#2d6a4f' }
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function MyPosts() {
  const { user, loading: authLoading } = useAuthContext()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/'); return }

    supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }, [user, authLoading])

  async function handleDelete(item) {
    await supabase.from('items').update({ is_active: false }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: false } : i))
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/')} aria-label="Back">←</button>
        <h1 style={styles.title}>My Posts</h1>
      </header>

      {loading && <p style={styles.empty}>Loading…</p>}
      {!loading && items.length === 0 && <p style={styles.empty}>No posts yet.</p>}

      <div style={styles.list}>
        {items.map(item => {
          const status = statusLabel(item)
          const canDelete = item.is_active && item.flag_count < 3
          return (
            <div key={item.id} style={styles.card}>
              <img src={item.image_url} alt="Item" style={styles.thumb} />
              <div style={styles.info}>
                <span style={{ ...styles.status, color: status.color }}>{status.text}</span>
                <span style={styles.time}>{timeAgo(item.created_at)}</span>
              </div>
              {canDelete && (
                <button style={styles.deleteBtn} onClick={() => handleDelete(item)}>
                  Delete
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  page: {
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
    minHeight: '100dvh',
    background: '#f9f9f9',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  back: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    padding: '0 0.25rem',
    color: '#333',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem 0.5rem 0',
  },
  thumb: {
    width: 70,
    height: 70,
    objectFit: 'cover',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  status: {
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  time: {
    fontSize: '0.8rem',
    color: '#888',
  },
  deleteBtn: {
    padding: '0.35rem 0.75rem',
    background: 'transparent',
    color: '#e63946',
    border: '1px solid #e63946',
    borderRadius: 6,
    fontSize: '0.8rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: '3rem',
    fontSize: '0.95rem',
  },
}
