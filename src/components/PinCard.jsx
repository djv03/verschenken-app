import FlagButton from './FlagButton'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(m) {
  if (m < 1000) return `${Math.round(m)} m away`
  return `${(m / 1000).toFixed(1)} km away`
}

export default function PinCard({ item, userLat, userLng, onClose, onFlagged }) {
  const distance =
    userLat != null && userLng != null
      ? formatDistance(distanceMeters(userLat, userLng, item.lat, item.lng))
      : null

  return (
    <div style={styles.card}>
      <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>
      <img src={item.image_url} alt="Street item" style={styles.image} />
      <div style={styles.body}>
        <p style={styles.meta}>
          {timeAgo(item.created_at)}
          {distance && <span style={styles.distance}> · {distance}</span>}
        </p>
        <FlagButton
          itemId={item.id}
          flagCount={item.flag_count}
          onFlagged={onFlagged}
        />
      </div>
    </div>
  )
}

const styles = {
  card: {
    position: 'absolute',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(360px, calc(100vw - 2rem))',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    zIndex: 1000,
  },
  close: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(0,0,0,0.4)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  image: {
    width: '100%',
    aspectRatio: '4/3',
    objectFit: 'cover',
    display: 'block',
  },
  body: {
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#555',
  },
  distance: {
    color: '#888',
  },
}
