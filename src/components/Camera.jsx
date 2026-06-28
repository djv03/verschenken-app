import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

export default function Camera({ onCapture }) {
  const { videoRef, streaming, error, startCamera, stopCamera, capture } = useCamera()
  const [preview, setPreview] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function handleCapture() {
    try {
      const blob = await capture()
      const url = URL.createObjectURL(blob)
      setCapturedBlob(blob)
      setPreview(url)
      stopCamera()
    } catch (e) {
      console.error(e)
    }
  }

  function handleRetake() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setCapturedBlob(null)
    startCamera()
  }

  function handleUse() {
    onCapture(capturedBlob)
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>{error}</p>
      </div>
    )
  }

  if (!streaming && !preview) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Kamera wird geöffnet…</p>
      </div>
    )
  }

  if (preview) {
    return (
      <div style={styles.container}>
        <img src={preview} alt="Preview" style={styles.preview} />
        <div style={styles.buttonRow}>
          <button style={styles.secondaryBtn} onClick={handleRetake}>Retake</button>
          <button style={styles.primaryBtn} onClick={handleUse}>Use Photo</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <video ref={videoRef} style={styles.video} autoPlay playsInline muted />
      <div style={styles.captureRow}>
        <button
          style={streaming ? styles.captureBtn : styles.captureBtnDisabled}
          onClick={handleCapture}
          disabled={!streaming}
          aria-label="Capture photo"
        />
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  captureRow: {
    position: 'absolute',
    bottom: '2rem',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: '#fff',
    border: '4px solid rgba(255,255,255,0.5)',
    cursor: 'pointer',
    boxShadow: '0 0 0 4px rgba(255,255,255,0.3)',
  },
  captureBtnDisabled: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: '#666',
    border: '4px solid rgba(255,255,255,0.2)',
    cursor: 'not-allowed',
  },
  buttonRow: {
    position: 'absolute',
    bottom: '2rem',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  primaryBtn: {
    padding: '0.75rem 2rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '0.75rem 2rem',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 8,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  error: {
    color: '#fff',
    textAlign: 'center',
    padding: '1rem',
    fontSize: '1rem',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '1rem',
    textAlign: 'center',
  },
}
