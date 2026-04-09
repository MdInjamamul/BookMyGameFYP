import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Fix Leaflet's broken default icon paths in bundled environments ───────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Custom price marker icon factory ─────────────────────────────────────────
function createPriceIcon(price, isHovered, isActive) {
  const bg = isActive ? '#7c3aed' : isHovered ? '#6d28d9' : '#4f46e5'
  const scale = isHovered || isActive ? 'scale(1.15)' : 'scale(1)'
  const label =
    price >= 1000 ? `Rs.${Math.round(price / 1000)}k` : `Rs.${Math.round(price)}`

  return L.divIcon({
    className: '',
    iconAnchor: [36, 40],
    popupAnchor: [0, -44],
    html: `
      <div style="
        display:inline-flex;align-items:center;gap:4px;
        background:${bg};color:#fff;font-size:11px;font-weight:700;
        padding:5px 10px;border-radius:20px;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:${scale};
        transition:transform 0.15s ease;border:2px solid #fff;
      ">
        ${label}
        <div style="
          position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
          width:0;height:0;border-left:6px solid transparent;
          border-right:6px solid transparent;border-top:7px solid ${bg};
        "></div>
      </div>
    `,
  })
}

// ─── User location icon ───────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  iconAnchor: [16, 16],
  html: `
    <div style="position:relative;width:32px;height:32px;">
      <div style="position:absolute;inset:0;background:rgba(79,70,229,0.25);border-radius:50%;animation:pulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:6px;background:#4f46e5;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>
    <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.5);opacity:0}}</style>
  `,
})

// ─── Sub-component: fly to user location ──────────────────────────────────────
function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 13, { duration: 1.5 })
  }, [position, map])
  return null
}

// ─── Sub-component: fit map to visible venues ─────────────────────────────────
function FitBounds({ venues }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    const pinnable = venues.filter((v) => v.latitude && v.longitude)
    if (!fitted.current && pinnable.length > 0) {
      const bounds = L.latLngBounds(pinnable.map((v) => [Number(v.latitude), Number(v.longitude)]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      fitted.current = true
    }
  }, [venues, map])

  useEffect(() => { fitted.current = false }, [venues.length])

  return null
}

// ─── MapInvalidate: forces Leaflet to recalculate size after container resize ──
function MapInvalidate({ trigger }) {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 50)
  }, [trigger, map])
  return null
}

// ─── VenueCard for the sidebar list ───────────────────────────────────────────
function MapSidebarCard({ venue, isHovered, onHover, onLeave }) {
  const primaryImage =
    venue.images?.find((img) => img.isPrimary)?.imageUrl ||
    venue.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400'

  return (
    <Link
      to={`/venues/${venue.id}`}
      className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        isHovered
          ? 'border-primary-400 bg-primary-50 shadow-md'
          : 'border-gray-100 bg-white hover:border-primary-200 hover:shadow-sm'
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className='w-20 h-16 rounded-lg overflow-hidden flex-shrink-0'>
        <img src={primaryImage} alt={venue.name} className='w-full h-full object-cover' />
      </div>
      <div className='flex-1 min-w-0'>
        <h4 className='font-semibold text-gray-900 text-sm truncate'>{venue.name}</h4>
        <p className='text-gray-500 text-xs truncate mt-0.5'>
          {venue.address}{venue.city ? `, ${venue.city}` : ''}
        </p>
        <div className='flex items-center justify-between mt-1.5'>
          <span className='text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium'>
            {venue.sport?.name || 'Sport'}
          </span>
          <span className='text-sm font-bold text-gray-900'>
            Rs.{venue.pricePerHour?.toLocaleString()}
            <span className='text-xs font-normal text-gray-500'>/hr</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Popup content ─────────────────────────────────────────────────────────────
function VenuePopupContent({ venue }) {
  const primaryImage =
    venue.images?.find((img) => img.isPrimary)?.imageUrl ||
    venue.images?.[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300'

  return (
    <div style={{ minWidth: 200 }}>
      <img src={primaryImage} alt={venue.name}
        style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{venue.name}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
        {venue.address}{venue.city ? `, ${venue.city}` : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', background: '#ede9fe', color: '#6d28d9', borderRadius: 99 }}>
          {venue.sport?.name || 'Sport'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ color: '#f59e0b', fontSize: 12 }}>★</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
            {venue.rating ? Number(venue.rating).toFixed(1) : 'New'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
          Rs. {Number(venue.pricePerHour)?.toLocaleString()}
          <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>/hr</span>
        </span>
        <a href={`/venues/${venue.id}`}
          style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>
          View Details →
        </a>
      </div>
    </div>
  )
}

// ─── Main VenueMapView component ──────────────────────────────────────────────
const KATHMANDU = { lat: 27.7172, lng: 85.324 }

export default function VenueMapView({ venues, userLocation }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [activeId, setActiveId] = useState(null)
  // mobile only: 'map' | 'list'
  const [mobileTab, setMobileTab] = useState('map')
  const markerRefs = useRef({})

  const pinnableVenues = venues.filter((v) => v.latitude != null && v.longitude != null)
  const unpinnableVenues = venues.filter((v) => v.latitude == null || v.longitude == null)

  const center = userLocation?.lat
    ? [userLocation.lat, userLocation.lng]
    : [KATHMANDU.lat, KATHMANDU.lng]

  useEffect(() => {
    if (hoveredId && markerRefs.current[hoveredId]) {
      markerRefs.current[hoveredId].openPopup()
    }
  }, [hoveredId])

  return (
    // IMPORTANT: one single top-level container — NO duplicate MapContainer
    <div className='isolate'>

      {/* ── Mobile tab bar (only visible on small screens) ────────────────── */}
      <div className='flex md:hidden rounded-xl overflow-hidden border border-gray-200 mb-3 bg-gray-100 p-1 gap-1'>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mobileTab === 'map' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
              d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' />
          </svg>
          Map
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mobileTab === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
          </svg>
          List ({venues.length})
        </button>
      </div>

      {/* ── Main layout: row on desktop, column on mobile ─────────────────── */}
      <div className='flex flex-col md:flex-row gap-4 md:h-[calc(100vh-180px)] md:min-h-[520px]'>

        {/* ── Map panel ─────────────────────────────────────────────────────
            Desktop: flex-1, always visible.
            Mobile:  full width, h-[60vw] min 300px, hidden when list tab active.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          className={`relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 flex-1
            ${mobileTab === 'list' ? 'hidden md:block' : 'block'}
          `}
          style={{ minHeight: 300 }}
        >
          <MapContainer
            center={center}
            zoom={12}
            style={{ width: '100%', height: '100%', minHeight: 300 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {/* Re-calculate size after tab switch */}
            <MapInvalidate trigger={mobileTab} />

            {userLocation?.lat && <FlyToLocation position={userLocation} />}
            <FitBounds venues={pinnableVenues} />

            {userLocation?.lat && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1000}>
                  <Popup>
                    <div className='text-center text-sm font-medium text-gray-700'>📍 Your Location</div>
                  </Popup>
                </Marker>
                {userLocation.rangeKm && (
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={userLocation.rangeKm * 1000}
                    pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.06, weight: 1.5, dashArray: '6 4' }}
                  />
                )}
              </>
            )}

            {pinnableVenues.map((venue) => (
              <Marker
                key={venue.id}
                position={[Number(venue.latitude), Number(venue.longitude)]}
                icon={createPriceIcon(venue.pricePerHour, venue.id === hoveredId, venue.id === activeId)}
                ref={(ref) => { if (ref) markerRefs.current[venue.id] = ref }}
                zIndexOffset={venue.id === hoveredId || venue.id === activeId ? 500 : 0}
                eventHandlers={{
                  click: () => setActiveId(venue.id),
                  popupclose: () => setActiveId(null),
                }}
              >
                <Popup minWidth={220} maxWidth={280}>
                  <VenuePopupContent venue={venue} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* No-coordinates notice */}
          {unpinnableVenues.length > 0 && (
            <div className='absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 shadow z-[400] flex items-center gap-2'>
              <svg className='w-4 h-4 flex-shrink-0 text-amber-500' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
              </svg>
              <span>
                <strong>{unpinnableVenues.length}</strong> venue{unpinnableVenues.length > 1 ? 's' : ''} not shown (no coordinates set)
              </span>
            </div>
          )}
        </div>

        {/* ── Sidebar / list panel ───────────────────────────────────────────
            Desktop: fixed width, always visible.
            Mobile:  full width, hidden when map tab active.
        ──────────────────────────────────────────────────────────────────── */}
        <div
          className={`md:w-80 xl:w-96 flex-shrink-0 flex flex-col
            ${mobileTab === 'map' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* Header */}
          <div className='flex items-center justify-between mb-3 flex-shrink-0'>
            <span className='text-sm font-medium text-gray-700'>
              <span className='font-bold text-gray-900'>{pinnableVenues.length}</span> on map
              {unpinnableVenues.length > 0 && (
                <span className='text-gray-400'> · {unpinnableVenues.length} hidden</span>
              )}
            </span>
            <span className='text-xs text-gray-400 italic hidden md:block'>Hover to highlight</span>
          </div>

          {/* Scrollable venue cards */}
          <div className='flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin'>
            {venues.length === 0 ? (
              <div className='text-center text-gray-400 py-12 text-sm'>
                No venues match your filters
              </div>
            ) : (
              <>
                {pinnableVenues.map((venue) => (
                  <MapSidebarCard
                    key={venue.id}
                    venue={venue}
                    isHovered={hoveredId === venue.id}
                    onHover={() => setHoveredId(venue.id)}
                    onLeave={() => setHoveredId(null)}
                  />
                ))}
                {unpinnableVenues.length > 0 && (
                  <>
                    <div className='flex items-center gap-2 py-2'>
                      <div className='flex-1 border-t border-dashed border-gray-200' />
                      <span className='text-xs text-gray-400 flex-shrink-0'>No location data</span>
                      <div className='flex-1 border-t border-dashed border-gray-200' />
                    </div>
                    {unpinnableVenues.map((venue) => (
                      <MapSidebarCard
                        key={venue.id}
                        venue={venue}
                        isHovered={false}
                        onHover={() => {}}
                        onLeave={() => {}}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Export haversine for use in parent ───────────────────────────────────────
export { haversineKm }
