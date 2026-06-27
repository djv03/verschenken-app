import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = (id) => `flagged_${id}`

export default function FlagButton({ itemId, flagCount, onFlagged }) {
  const [flagged, setFlagged] = useState(() => !!localStorage.getItem(STORAGE_KEY(itemId)))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const hidden = flagCount >= 3

  async function handleFlag() {
    if (flagged || hidden) return
    setLoading(true)
    setError(null)

    const { error: flagErr } = await supabase.from('flags').insert({ item_id: itemId })

    if (flagErr) {
      setError('Could not flag item.')
      setLoading(false)
      return
    }

    const { error: updateErr } = await supabase.rpc('increment_flag_count', { item_id: itemId })
    // increment_flag_count is a Supabase RPC; if not set up yet the flag row still exists
    if (updateErr) console.warn('flag_count increment failed:', updateErr.message)

    localStorage.setItem(STORAGE_KEY(itemId), '1')
    setFlagged(true)
    setLoading(false)
    onFlagged?.()
  }

  if (hidden) return null

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
    padding: '0.4rem 1rem',
    background: 'transparent',
    color: '#e63946',
    border: '1px solid #e63946',
    borderRadius: 6,
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  flaggedBtn: {
    padding: '0.4rem 1rem',
    background: 'transparent',
    color: '#aaa',
    border: '1px solid #aaa',
    borderRadius: 6,
    fontSize: '0.85rem',
    cursor: 'not-allowed',
  },
  error: {
    color: '#e63946',
    fontSize: '0.8rem',
    margin: '0.25rem 0 0',
  },
}
