import Map from '../components/Map'
import Avatar from '../components/Avatar'
import AuthButton from '../components/AuthButton'
import { useLocation } from '../hooks/useLocation'
import { useAuthContext } from '../lib/AuthContext'

export default function Home() {
  const { lat, lng } = useLocation()
  const { user, loading, signIn } = useAuthContext()

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
      <Map userLat={lat} userLng={lng} />
      <div style={styles.topRight}>
        {loading
          ? <span style={styles.authLoading}>Wird angemeldet…</span>
          : (user ? <Avatar /> : <AuthButton onSignIn={signIn} />)
        }
      </div>
    </div>
  )
}

const styles = {
  topRight: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    zIndex: 1000,
  },
  authLoading: {
    fontSize: '0.8rem',
    color: '#555',
    background: '#fff',
    padding: '0.3rem 0.75rem',
    borderRadius: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
}
