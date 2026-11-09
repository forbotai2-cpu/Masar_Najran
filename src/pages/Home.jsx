import { useMemo, useState } from 'react'
import TransitMap from '../components/TransitMap.jsx'
import { Icon, SimBadge, StationName, etaLabel } from '../components/ui.jsx'
import { useApp } from '../state.jsx'
import { NAJRAN_BOUNDS } from '../data/stations.js'
import { NETWORK, STATIONS, STATION_BY_ID, SERVICE_BY_ID, nearestStation, servicesAtStation, upcomingAtStation } from '../sim/network.js'

function useLocate() {
  const { dispatch } = useApp()
  return () => {
    if (!navigator.geolocation) {
      dispatch({ type: 'location', location: { status: 'unsupported', latlng: null } })
      return
    }
    dispatch({ type: 'location', location: { status: 'locating', latlng: null } })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude]
        const b = NAJRAN_BOUNDS
        const inside = latlng[0] > b.south && latlng[0] < b.north && latlng[1] > b.west && latlng[1] < b.east
        if (!inside) {
          dispatch({ type: 'location', location: { status: 'outside', latlng: null } })
          return
        }
        dispatch({ type: 'location', location: { status: 'ok', latlng } })
        const n = nearestStation(latlng)
        if (n) dispatch({ type: 'origin', id: n.station.id })
      },
      () => dispatch({ type: 'location', location: { status: 'denied', latlng: null } }),
      { timeout: 8000, maximumAge: 60000 },
    )
  }
}

// الإطار الافتراضي: وسط المدينة (المطار والجامعة شرقًا يظهران بالتحريك أو من البحث)
const CITY_FIT = STATIONS.filter((s) => !['airport', 'university'].includes(s.id)).map((s) => s.position)

const LOCATION_TEXT = {
  idle: 'تحديد الموقع اختياري. يمكنك اختيار محطة البداية من الخريطة أو القائمة.',
  locating: 'جارٍ تحديد موقعك…',
  denied: 'لم يُمنح إذن الموقع. اختر محطة البداية يدويًا.',
  unsupported: 'المتصفح لا يدعم تحديد الموقع. اختر محطة البداية يدويًا.',
  outside: 'موقعك خارج نطاق العرض التجريبي في نجران. اختر محطة البداية يدويًا.',
}

export default function Home() {
  const { state, dispatch, simSeconds } = useApp()
  const { originId, destinationId, location, settings } = state
  const locate = useLocate()
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const origin = originId ? STATION_BY_ID[originId] : null
  const upcoming = useMemo(() => (originId ? upcomingAtStation(originId, simSeconds, 2) : []), [originId, simSeconds])
  const nearest = location.latlng ? nearestStation(location.latlng) : null

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return STATIONS.filter((s) => s.id !== originId).filter(
      (s) => !q || s.name.includes(query.trim()) || s.nameEn.toLowerCase().includes(q) || s.area.includes(query.trim()),
    )
  }, [query, originId])

  // خطوط خفيفة لكل المسارات المعلنة على الرئيسية
  const lines = useMemo(
    () =>
      Object.values(NETWORK)
        .filter((n) => n.roadReady)
        .map((n) => ({ key: n.id, points: n.outPath.points, active: false })),
    [],
  )

  const roles = {}
  if (originId) roles[originId] = 'origin'
  if (destinationId) roles[destinationId] = 'destination'

  return (
    <section className="home" aria-label="الرئيسية">
      <TransitMap
        className="home-map"
        selectedStationId={originId}
        nearestStationId={nearest?.station.id}
        roles={roles}
        onStationClick={(id) => dispatch({ type: 'origin', id })}
        lines={lines}
        userLatLng={location.latlng}
        fitKey="home"
        fitPoints={CITY_FIT}
        showEnglish={settings.showEnglish}
      />

      <div className="home-sheet">
        <div className="sheet-handle" aria-hidden="true" />

        <div className="locate-row">
          <p className="muted small">
            {location.status === 'ok' && nearest
              ? `أقرب محطة لك: ${nearest.station.name} (حوالي ${Math.round(nearest.distance / 100) / 10} كم)`
              : LOCATION_TEXT[location.status]}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={locate} disabled={location.status === 'locating'}>
            <Icon name="locate" size={16} /> موقعي
          </button>
        </div>

        <div className="planner">
          <label className="field">
            <span className="field-label">
              <Icon name="pin" size={16} /> محطة الانطلاق
            </span>
            <select
              value={originId ?? ''}
              onChange={(e) => dispatch({ type: 'origin', id: e.target.value || null })}
              aria-label="محطة الانطلاق"
            >
              <option value="">اختر محطة البداية</option>
              {STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field search-field">
            <span className="field-label">
              <Icon name="flag" size={16} /> الوجهة
              <button
                type="button"
                className="swap-btn"
                aria-label="تبديل الانطلاق والوجهة"
                title="تبديل الانطلاق والوجهة"
                disabled={!destinationId}
                onClick={() => dispatch({ type: 'swap' })}
              >
                <Icon name="swap" size={16} /> تبديل
              </button>
            </span>
            {destinationId && !searchOpen ? (
              <div className="chosen">
                <StationName id={destinationId} />
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setSearchOpen(true)
                    setQuery('')
                  }}
                >
                  تغيير
                </button>
              </div>
            ) : (
              <div className="search-box">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  placeholder="إلى أين تريد الذهاب؟"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  aria-label="إلى أين تريد الذهاب؟"
                  aria-controls="dest-list"
                />
              </div>
            )}
          </div>
          {searchOpen && (
            <ul className="suggestions" id="dest-list" role="listbox" aria-label="المحطات">
              {matches.length === 0 && <li className="muted small pad">لا توجد محطة بهذا الاسم في النموذج التجريبي.</li>}
              {matches.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={destinationId === s.id}
                    onClick={() => {
                      dispatch({ type: 'destination', id: s.id })
                      setSearchOpen(false)
                      setQuery('')
                    }}
                  >
                    <Icon name="pin" size={16} />
                    <span>
                      <StationName id={s.id} />
                      <small className="muted">{s.area}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {origin ? (
          <div className="station-card" aria-live="polite">
            <div className="station-card-head">
              <div>
                <span className="eyebrow">المحطة المختارة</span>
                <h2>
                  <StationName id={origin.id} />
                </h2>
                <p className="muted small">
                  {origin.area} · مسارات:{' '}
                  {servicesAtStation(origin.id)
                    .map((s) => s.number)
                    .join('، ')}
                </p>
              </div>
              <SimBadge />
            </div>
            <h3 className="block-title">الحافلتان القادمتان</h3>
            {upcoming.length === 0 ? (
              <p className="empty">لا توجد حافلات قادمة لهذه المحطة في النموذج التجريبي.</p>
            ) : (
              <ul className="arrivals">
                {upcoming.map((u) => (
                  <li key={`${u.vehicleId}-${u.direction}`}>
                    <span className="route-num">{SERVICE_BY_ID[u.serviceId].number}</span>
                    <span className="arr-text">
                      <b>باتجاه {STATION_BY_ID[u.towards].name}</b>
                      <small className="muted">الحافلة {u.vehicleId}</small>
                    </span>
                    <span className="eta">{etaLabel(u.eta)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="actions">
              <button type="button" className="btn btn-primary btn-block" onClick={() => dispatch({ type: 'tab', tab: 'trips' })}>
                عرض الرحلات
              </button>
              {!destinationId && (
                <p className="muted small center">اختر وجهة لعرض الرحلة المناسبة، أو استعرض كل الرحلات من هذه المحطة.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="station-card empty-card">
            <Icon name="pin" size={28} />
            <h2>اختر محطة البداية</h2>
            <p className="muted small">اضغط على أي محطة في الخريطة أو اخترها من القائمة أعلاه.</p>
          </div>
        )}
        <p className="fine-print center">المحطات مواقع توضيحية قرب معالم معروفة في نجران، والمسارات غير معتمدة.</p>
      </div>
    </section>
  )
}
