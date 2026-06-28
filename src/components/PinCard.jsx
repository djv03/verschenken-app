import { useState, useEffect } from 'react'
import FlagButton from './FlagButton'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../lib/AuthContext'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) !== 1 ? 's' : ''} ago`
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
  return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`
}

export default function PinCard({ item, userLat, userLng, onClose, onFlagged }) {
  const { user } = useAuthContext()
  const [stillCount, setStillCount] = useState(item.still_there_count ?? 0)
  const [goneCount, setGoneCount] = useState(item.gone_count ?? 0)
  const [myVote, setMyVote] = useState(null)
  const [voting, setVoting] = useState(false)

  const distance = userLat != null && userLng != null
    ? formatDistance(distanceMeters(userLat, userLng, item.lat, item.lng))
    : null

  useEffect(() => {
    if (!user) return
    supabase
      .from('confirmations')
      .select('status')
      .eq('item_id', item.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setMyVote(data.status) })
  }, [item.id, user?.id])

  async function vote(status) {
    if (!user || myVote || voting) return
    setVoting(true)
    await supabase.rpc('add_confirmation', {
      p_item_id: item.id,
      p_user_id: user.id,
      p_status: status,
    })
    setMyVote(status)
    if (status === 'still_there') setStillCount(c => c + 1)
    else setGoneCount(c => c + 1)
    setVoting(false)
  }

  return (
    <div style={styles.card}>
      <button style={styles.close} onClick={onClose} aria-label="Close">✕</button>
      <img src={item.image_url} alt="Street item" style={styles.image} />

      <div style={styles.body}>
        <p style={styles.meta}>
          {timeAgo(item.created_at)}
          {distance && <span style={styles.distance}> · {distance}</span>}
        </p>
        {item.description && <p style={styles.description}>{item.description}</p>}

        <div style={styles.votes}>
          <button
            style={myVote === 'still_there' ? styles.votedBtn : styles.voteBtn}
            onClick={() => vote('still_there')}
            disabled={!!myVote || voting || !user}
          >
            ✓ Still there {stillCount > 0 && `(${stillCount})`}
          </button>
          <button
            style={myVote === 'gone' ? styles.votedBtn : styles.voteBtn}
            onClick={() => vote('gone')}
            disabled={!!myVote || voting || !user}
          >
            ✗ Gone {goneCount > 0 && `(${goneCount})`}
          </button>
        </div>

        {!user && <p style={styles.hint}>Sign in to vote or flag</p>}

        <FlagButton itemId={item.id} flagCount={item.flag_count} onFlagged={onFlagged} />
      </div>
    </div>
  )
}

const styles = {
  card: {
    position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
    width: 'min(360px, calc(100vw - 2rem))', background: '#fff',
    borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', overflow: 'hidden', zIndex: 1000,
  },
  close: {
    position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.4)', color: '#fff',
    border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
    fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  image: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' },
  body: { padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  meta: { margin: 0, fontSize: '0.85rem', color: '#555' },
  distance: { color: '#888' },
  votes: { display: 'flex', gap: '0.5rem' },
  voteBtn: {
    flex: 1, padding: '0.4rem 0.5rem', background: '#f5f5f5', color: '#333',
    border: '1px solid #ddd', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer',
  },
  votedBtn: {
    flex: 1, padding: '0.4rem 0.5rem', background: '#2d6a4f', color: '#fff',
    border: '1px solid #2d6a4f', borderRadius: 6, fontSize: '0.8rem', cursor: 'default',
  },
  hint: { margin: 0, fontSize: '0.75rem', color: '#aaa' },
  description: { margin: 0, fontSize: '0.9rem', color: '#333', fontWeight: 500 },
}
