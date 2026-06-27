import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import Camera from '../components/Camera'
import { useLocation } from '../hooks/useLocation'
import { supabase } from '../lib/supabase'

export default function Upload() {
  const navigate = useNavigate()
  const { lat, lng, error: gpsError, loading: gpsLoading } = useLocation()
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  function handleCapture(blob) {
    setCapturedBlob(blob)
  }

  function handleRetake() {
    setCapturedBlob(null)
    setUploadError(null)
  }

  async function handlePost() {
    if (!capturedBlob) return

    if (gpsLoading) {
      setUploadError('Still acquiring GPS. Please wait a moment.')
      return
    }
    if (gpsError || lat == null || lng == null) {
      setUploadError('Could not get your location. ' + (gpsError ?? ''))
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const filename = `${uuidv4()}.jpg`
      const { error: storageError } = await supabase.storage
        .from('item-images')
        .upload(filename, capturedBlob, { contentType: 'image/jpeg' })

      if (storageError) throw storageError

      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(filename)

      const { error: dbError } = await supabase
        .from('items')
        .insert({ image_url: urlData.publicUrl, lat, lng })

      if (dbError) throw dbError

      navigate('/')
    } catch (e) {
      setUploadError(e.message ?? 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  if (!capturedBlob) {
    return <Camera onCapture={handleCapture} />
  }

  const previewUrl = URL.createObjectURL(capturedBlob)

  return (
    <div style={styles.container}>
      <img src={previewUrl} alt="Captured" style={styles.preview} />

      <div style={styles.overlay}>
        <div style={styles.coords}>
          {gpsLoading && <span>Acquiring GPS…</span>}
          {gpsError && <span style={styles.warn}>{gpsError}</span>}
          {!gpsLoading && !gpsError && lat != null && (
            <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
          )}
        </div>

        {uploadError && <p style={styles.error}>{uploadError}</p>}

        <div style={styles.buttonRow}>
          <button style={styles.secondaryBtn} onClick={handleRetake} disabled={uploading}>
            Retake
          </button>
          <button style={styles.primaryBtn} onClick={handlePost} disabled={uploading || gpsLoading}>
            {uploading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100dvh',
    background: '#000',
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '1.5rem',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  coords: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  warn: {
    color: '#f4a261',
  },
  error: {
    color: '#e63946',
    fontSize: '0.9rem',
    textAlign: 'center',
    margin: 0,
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '0.75rem 2rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: '1rem',
    cursor: 'pointer',
    flex: 1,
  },
  secondaryBtn: {
    padding: '0.75rem 2rem',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 8,
    fontSize: '1rem',
    cursor: 'pointer',
    flex: 1,
  },
}
