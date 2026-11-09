import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { STATIONS, DEMO_CENTER } from '../data/stations.js'

// نخزّن الأيقونات حتى لا يُعاد بناء عناصر الخريطة في كل تحديث للمحاكاة
const iconCache = new Map()
function cached(key, make) {
  if (!iconCache.has(key)) iconCache.set(key, make())
  return iconCache.get(key)
}

function stationIcon(opts) {
  return cached(`s|${opts.selected}|${opts.nearest}|${opts.dim}|${opts.role}|${opts.label}`, () => makeStationIcon(opts))
}

function makeStationIcon({ selected, nearest, dim, label, role }) {
  const cls = ['station-pin', selected && 'is-selected', nearest && 'is-nearest', dim && 'is-dim', role && `is-${role}`]
    .filter(Boolean)
    .join(' ')
  return divIcon({
    className: 'station-pin-wrap',
    html: `<span class="${cls}"><span class="station-dot"></span>${label ? `<span class="station-label">${label}</span>` : ''}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function busIcon(id, tracked) {
  return cached(`b|${id}|${tracked}`, () => makeBusIcon(id, tracked))
}

function makeBusIcon(id, tracked) {
  return divIcon({
    className: 'bus-pin-wrap',
    html: `<span class="bus-pin ${tracked ? 'is-tracked' : ''}">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6 2h12a3 3 0 0 1 3 3v11a2 2 0 0 1-1 1.73V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.27A2 2 0 0 1 3 16V5a3 3 0 0 1 3-3Zm0 3v6h12V5H6Zm1.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/></svg>
      <b>${id.replace('NT-', '')}</b></span>`,
    iconSize: [50, 26],
    iconAnchor: [25, 13],
  })
}

const userIcon = divIcon({ className: 'user-pin-wrap', html: '<span class="user-pin"></span>', iconSize: [20, 20], iconAnchor: [10, 10] })

function FitBounds({ points, fitKey }) {
  const map = useMap()
  useEffect(() => {
    if (!points?.length) return
    if (points.length === 1) map.setView(points[0], 14, { animate: false })
    else map.fitBounds(points, { padding: [28, 28], maxZoom: 15, animate: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map])
  return null
}

function InvalidateOnResize() {
  const map = useMap()
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(map.getContainer())
    return () => ro.disconnect()
  }, [map])
  return null
}

/**
 * خريطة النقل: محطات ثابتة + خطوط المسارات + حافلات محاكاة
 * lines: [{ points, active, key, dashed }]
 */
export default function TransitMap({
  className = '',
  stationIds,
  selectedStationId,
  nearestStationId,
  roles = {},
  dimOthers = false,
  onStationClick,
  lines = [],
  vehicles = [],
  trackedVehicleId,
  userLatLng,
  fitPoints,
  fitKey,
  showEnglish,
  labels = false,
}) {
  const visible = useMemo(
    () => (stationIds ? STATIONS.filter((s) => stationIds.includes(s.id)) : STATIONS),
    [stationIds],
  )
  const fit = fitPoints ?? visible.map((s) => s.position)

  return (
    <div className={`map-shell ${className}`}>
      <MapContainer
        center={DEMO_CENTER}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl
        className="map-canvas"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {lines.map((l) => (
          <Polyline
            key={l.key}
            positions={l.points}
            pathOptions={{
              color: l.active ? '#00A383' : '#94A3B8',
              weight: l.active ? 6 : 4,
              opacity: l.active ? 0.95 : 0.6,
              dashArray: l.dashed ? '6 8' : undefined,
              lineCap: 'round',
            }}
          />
        ))}
        {visible.map((s) => {
          const role = roles[s.id]
          const isDim = dimOthers && !role
          return (
            <Marker
              key={s.id}
              position={s.position}
              title={s.name}
              alt={s.name}
              zIndexOffset={s.id === selectedStationId ? 500 : role ? 300 : 0}
              icon={stationIcon({
                selected: s.id === selectedStationId,
                nearest: s.id === nearestStationId,
                dim: isDim,
                role,
                label: labels || s.id === selectedStationId || role === 'origin' || role === 'destination' ? (showEnglish ? `${s.name} · ${s.nameEn}` : s.name) : '',
              })}
              eventHandlers={onStationClick ? { click: () => onStationClick(s.id) } : undefined}
            />
          )
        })}
        {vehicles
          .filter((v) => v.latlng)
          .map((v) => (
            <Marker
              key={v.id}
              position={v.latlng}
              icon={busIcon(v.id, v.id === trackedVehicleId)}
              zIndexOffset={v.id === trackedVehicleId ? 1000 : 400}
              title={`الحافلة ${v.id} (محاكاة)`}
              alt={`الحافلة ${v.id}`}
              interactive={false}
              keyboard={false}
            />
          ))}
        {userLatLng && <Marker position={userLatLng} icon={userIcon} title="موقعك" interactive={false} />}
        <FitBounds points={fit} fitKey={fitKey} />
        <InvalidateOnResize />
        <ZoomControl position="bottomleft" zoomInTitle="تكبير" zoomOutTitle="تصغير" />
      </MapContainer>
    </div>
  )
}
