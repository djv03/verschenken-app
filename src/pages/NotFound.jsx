import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={styles.page}>
      <span style={styles.code}>404</span>
      <p style={styles.msg}>Diese Seite gibt es nicht.</p>
      <button style={styles.btn} onClick={() => navigate('/')}>Zur Karte</button>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100dvh', gap: '1rem',
    fontFamily: 'system-ui, sans-serif', background: '#f9f9f9',
  },
  code: { fontSize: '5rem', fontWeight: 700, color: '#2d6a4f', lineHeight: 1 },
  msg: { fontSize: '1rem', color: '#555', margin: 0 },
  btn: {
    padding: '0.75rem 2rem', background: '#2d6a4f', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '1rem', cursor: 'pointer',
    marginTop: '0.5rem',
  },
}
