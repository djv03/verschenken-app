import Map from '../components/Map'
import { useLocation } from '../hooks/useLocation'

export default function Home() {
  const { lat, lng } = useLocation()
  return <Map userLat={lat} userLng={lng} />
}
