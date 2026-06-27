import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../lib/AuthContext'

export default function FlagButton({ itemId, flagCount, onFlagged }) {
  const { user } = useAuthContext()
  const [flagged, setFlagged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (flagCount >= 3) return null
  if (!user) return <span style={styles.hint}>Sign in to flag</span>

  async function handleFlag() {
    if (flagged) return
    setLoading(true)
    setError(null)

    const { error: flagErr } = await supabase
      .from('flags')
      .insert({ item_id: itemId, user_id: user.id })

    if (flagErr) {
      if (flagErr.code === '23505') {
        setFlagged(true) // unique constraint = already flagged
      } else {
        setError('Could not flag item.')
      }
      setLoading(false)
      return
    }

    await supabase.rpc('increment_flag_count', { item_id: itemId })
    setFlagged(true)
    setLoading(false)
    onFlagged?.()
  }

  return (
    <div>
      <button
        style={flagged ? styles.flaggedBtn : styles.btn}
        onClick={handleFlag}
        disabled={flagged || loading}
      >
        {loading ? 'Flagging…' : flagged ? 'Flagged' : 'Flag'}
      </button>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  )
}

const styles = {
  btn: {
    padding: '0.4rem 1rem', background: 'transparent', color: '#e63946',
    border: '1px solid #e63946', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer',
  },
  flaggedBtn: {
    padding: '0.4rem 1rem', background: 'transparent', color: '#aaa',
    border: '1px solid #aaa', borderRadius: 6, fontSize: '0.85rem', cursor: 'not-allowed',
  },
  error: { color: '#e63946', fontSize: '0.8rem', margin: '0.25rem 0 0' },
  hint: { fontSize: '0.8rem', color: '#aaa' },
}
