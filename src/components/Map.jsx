import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import PinCard from './PinCard'

// Fix Leaflet's broken default icons under Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const BERLIN = [52.52, 13.405]
const REFRESH_INTERVAL = 60_000

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, map.getZoom())
  }, [center])
  return null
}

export default function Map({ userLat, userLng }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const center = userLat != null ? [userLat, userLng] : BERLIN

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
    if (!error && data) setItems(data)
  }, [])

  useEffect(() => {
    fetchItems()
    const timer = setInterval(fetchItems, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchItems])

  function handleFlagged(item) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, flag_count: i.flag_count + 1 } : i
      ).filter((i) => i.flag_count < 3)
    )
    setSelectedItem(null)
  }

  return (
    <div style={styles.wrapper}>
      <MapContainer
        center={center}
        zoom={14}
        style={styles.map}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RecenterMap center={userLat != null ? [userLat, userLng] : null} />
        {items.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            eventHandlers={{ click: () => setSelectedItem(item) }}
          />
        ))}
      </MapContainer>

      {selectedItem && (
        <PinCard
          item={selectedItem}
          userLat={userLat}
          userLng={userLng}
          onClose={() => setSelectedItem(null)}
          onFlagged={() => handleFlagged(selectedItem)}
        />
      )}

      <button style={styles.fab} onClick={() => navigate('/upload')} aria-label="Add item">
        +
      </button>
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100dvh',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: '2rem',
    right: '1.5rem',
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    fontSize: '2rem',
    lineHeight: 1,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}
