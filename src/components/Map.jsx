import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import PinCard from './PinCard'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const possiblyGoneIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;background:#aaa;border-radius:50%;border:2px solid #888;opacity:0.6"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const BERLIN = [52.52, 13.405]
const REFRESH_INTERVAL = 60_000

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: '6h', label: 'Last 6h' },
  { key: '1h', label: 'Last 1h' },
]

function RecenterMap({ center }) {
  const map = useMap()
  const centered = useRef(false)
  useEffect(() => {
    if (center && !centered.current) {
      map.setView(center, map.getZoom())
      centered.current = true
    }
  }, [center])
  return null
}

export default function Map({ userLat, userLng }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [filter, setFilter] = useState('all')
  const [mapReady, setMapReady] = useState(false)
  const center = userLat != null ? [userLat, userLng] : BERLIN

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
    if (!error && data) setItems(data)
    setMapReady(true)
  }, [])

  useEffect(() => {
    fetchItems()
    const timer = setInterval(fetchItems, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchItems])

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true
    const hours = filter === '1h' ? 1 : 6
    return new Date(item.created_at) > new Date(Date.now() - hours * 60 * 60 * 1000)
  })

  function handleFlagged(item) {
    setItems(prev =>
      prev.map(i => i.id === item.id ? { ...i, flag_count: i.flag_count + 1 } : i)
        .filter(i => i.flag_count < 3)
    )
    setSelectedItem(null)
  }

  if (!mapReady) {
    return (
      <div style={styles.mapLoader}>
        <p style={styles.mapLoaderText}>Karte wird geladen…</p>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.filterBar}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            style={filter === f.key ? styles.filterActive : styles.filterBtn}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <MapContainer center={center} zoom={14} style={styles.map} zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RecenterMap center={userLat != null ? [userLat, userLng] : null} />
        <MarkerClusterGroup chunkedLoading>
          {filteredItems.map(item => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              {...(item.gone_count >= 3 ? { icon: possiblyGoneIcon } : {})}
              eventHandlers={{ click: () => setSelectedItem(item) }}
            />
          ))}
        </MarkerClusterGroup>
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
  wrapper: { position: 'relative', width: '100%', height: '100dvh' },
  map: { width: '100%', height: '100%' },
  filterBar: {
    position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '0.4rem', zIndex: 1000, background: '#fff',
    borderRadius: 20, padding: '0.3rem 0.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  filterBtn: {
    padding: '0.3rem 0.85rem', background: 'transparent', border: 'none',
    borderRadius: 16, fontSize: '0.8rem', cursor: 'pointer', color: '#555',
  },
  filterActive: {
    padding: '0.3rem 0.85rem', background: '#2d6a4f', border: 'none',
    borderRadius: 16, fontSize: '0.8rem', cursor: 'pointer', color: '#fff', fontWeight: 600,
  },
  fab: {
    position: 'absolute', bottom: '2rem', right: '1.5rem',
    width: 56, height: 56, borderRadius: '50%', background: '#2d6a4f', color: '#fff',
    border: 'none', fontSize: '2rem', lineHeight: 1, cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  mapLoader: {
    width: '100%', height: '100dvh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: '#f9f9f9',
  },
  mapLoaderText: { fontSize: '1rem', color: '#888' },
}
