import { useState, useRef, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const streamRef = useRef(null)

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // autoPlay attribute on the <video> element handles playback — no manual play() needed
      }
      setStreaming(true)
    } catch (err) {
      console.error('[useCamera] error:', err.name, err.message)
      let message
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera access was denied. Please allow camera access and try again.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found on this device.'
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        message = 'No camera matching the required constraints was found.'
      } else {
        message = 'Unable to access camera. Please try again.'
      }
      setError(message)
      setStreaming(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStreaming(false)
  }, [])

  const capture = useCallback(() => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      if (!video || !streaming) {
        reject(new Error('Camera is not active.'))
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to capture photo.'))
        },
        'image/jpeg',
        0.9
      )
    })
  }, [streaming])

  return { videoRef, streaming, error, startCamera, stopCamera, capture }
}
