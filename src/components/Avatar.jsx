import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../lib/AuthContext'

export default function Avatar() {
  const { user, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const avatarUrl = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name ?? user.email
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={styles.wrapper}>
      <button style={styles.avatarBtn} onClick={() => setOpen(o => !o)} aria-label="Account menu">
        {avatarUrl
          ? <img src={avatarUrl} alt={name} style={styles.img} referrerPolicy="no-referrer" />
          : <span style={styles.initials}>{initials}</span>
        }
      </button>

      {open && (
        <div style={styles.menu}>
          <button style={styles.menuItem} onClick={() => { setOpen(false); navigate('/my-posts') }}>
            My Posts
          </button>
          <button style={styles.menuItem} onClick={() => { setOpen(false); signOut() }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '2px solid #fff',
    padding: 0,
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#2d6a4f',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  initials: {
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: 0,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    minWidth: 130,
    zIndex: 2000,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '0.65rem 1rem',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: '0.9rem',
    cursor: 'pointer',
    color: '#333',
  },
}
