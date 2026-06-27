import { useState, useEffect } from 'react'

export function useLocation() {
  const [state, setState] = useState({ lat: null, lng: null, error: null, loading: true })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ lat: null, lng: null, error: 'Geolocation is not supported by this browser.', loading: false })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          loading: false,
        })
      },
      (err) => {
        let message
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access was denied. Please allow location access and try again.'
            break
          case err.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Move to an area with better signal.'
            break
          case err.TIMEOUT:
            message = 'Location request timed out. Please try again.'
            break
          default:
            message = 'An unknown error occurred while getting your location.'
        }
        setState({ lat: null, lng: null, error: message, loading: false })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  return state
}
