import { useMemo, useState } from 'react'
import TransitMap from '../components/TransitMap.jsx'
import { PaySheet } from '../components/Payment.jsx'
import { BackButton, Icon, SimBadge, StationName, durationLabel, etaLabel, money } from '../components/ui.jsx'
import { DEMO_CONFIG } from '../data/config.js'
import { VEHICLES } from '../data/vehicles.js'
import { useApp } from '../state.jsx'
import {
  NETWORK,
  SERVICES,
  STATION_BY_ID,
  etaSeconds,
  findDirectTrips,
  servicesAtStation,
  vehicleState,
  vehiclesOf,
} from '../sim/network.js'

function TripOption({ t, onOpen }) {
  const svc = NETWORK[t.serviceId]
  return (
    <article className="trip-card">
      <header>
        <span className="route-num lg">{svc.number}</span>
        <div>
          <h3>{svc.name}</h3>
          <p className="muted small">باتجاه {STATION_BY_ID[t.towards].name}</p>
        </div>
      </header>
      <ol className="mini-stops" aria-label="محطات المرور">
        {t.stops.map((id, i) => (
          <li key={id} className={i === 0 ? 'is-from' : i === t.stops.length - 1 ? 'is-to' : ''}>
            {STATION_BY_ID[id].name}
          </li>
        ))}
      </ol>
      <dl className="trip-facts">
        <div>
          <dt>الحافلة القادمة</dt>
          <dd>{t.next[0] ? etaLabel(t.next[0].eta) : '—'}</dd>
        </div>
        <div>
          <dt>التالية</dt>
          <dd>{t.next[1] ? etaLabel(t.next[1].eta) : '—'}</dd>
        </div>
        <div>
          <dt>مدة الرحلة</dt>
          <dd>{etaLabel(t.rideSeconds)}</dd>
        </div>
      </dl>
      <div className="trip-card-foot">
        <SimBadge />
        <button type="button" className="btn btn-primary" onClick={() => onOpen(t)} disabled={!t.next[0]}>
          استعرض الرحلة
        </button>
      </div>
    </article>
  )
}

function TripsList() {
  const { state, dispatch, simSeconds, actions } = useApp()
  const { originId, destinationId, trip } = state
  const results = useMemo(() => findDirectTrips(originId, destinationId, simSeconds), [originId, destinationId, simSeconds])
  const fromOrigin = originId ? servicesAtStation(originId) : []

  const open = (t) =>
    dispatch({
      type: 'startTrip',
      trip: { serviceId: t.serviceId, direction: t.direction, fromId: t.fromId, toId: t.toId, vehicleId: t.next[0].vehicleId },
    })

  return (
    <section className="page" aria-labelledby="trips-title">
      <div className="page-head">
        <span className="eyebrow">رحلات من المسارات المعلنة</span>
        <h1 id="trips-title">الرحلات</h1>
      </div>

      {trip && (
        <button type="button" className="current-trip" onClick={() => dispatch({ type: 'tripsView', view: 'detail' })}>
          <Icon name="bus" />
          <span>
            <b>رحلتك الحالية — الحافلة {trip.vehicleId}</b>
            <small>
              {STATION_BY_ID[trip.fromId].name} ← {STATION_BY_ID[trip.toId].name}
            </small>
          </span>
          <Icon name="chevron" />
        </button>
      )}

      <div className="od-summary">
        <div>
          <small className="muted">من</small>
          <b>{originId ? <StationName id={originId} /> : 'لم تُختر محطة'}</b>
        </div>
        <div>
          <small className="muted">إلى</small>
          <b>{destinationId ? <StationName id={destinationId} /> : 'لم تُختر وجهة'}</b>
        </div>
        <button type="button" className="link-btn" onClick={() => dispatch({ type: 'tab', tab: 'home' })}>
          تعديل
        </button>
      </div>

      {originId && destinationId ? (
        results.length > 0 ? (
          <div className="stack">
            {results.map((t) => (
              <TripOption key={`${t.serviceId}-${t.direction}`} t={t} onOpen={open} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="info" size={28} />
            <h2>لا توجد رحلة مباشرة في النموذج التجريبي</h2>
            <p className="muted small">
              لا يمر أي مسار معلن بالمحطتين معًا. لا نقترح تبديل حافلات غير موجود. جرّب وجهة أخرى على أحد المسارات المارة
              بمحطتك:
            </p>
            <div className="chip-row">
              {fromOrigin.flatMap((s) =>
                s.stops
                  .filter((id) => id !== originId)
                  .map((id) => (
                    <button key={`${s.id}-${id}`} type="button" className="chip" onClick={() => dispatch({ type: 'destination', id })}>
                      {STATION_BY_ID[id].name}
                    </button>
                  )),
              )}
            </div>
          </div>
        )
      ) : (
        <p className="hint">اختر محطة الانطلاق والوجهة من الرئيسية لعرض رحلة مناسبة، أو استعرض المسارات المعلنة أدناه.</p>
      )}

      <h2 className="section-title">المسارات المعلنة</h2>
      <p className="muted small">يحدد المشغل المسارات والجداول بين فترات التشغيل، ولا تتغير آنيًا بطلب راكب.</p>
      <div className="stack">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="service-row"
            onClick={() => dispatch({ type: 'tripsView', view: 'detail', serviceId: s.id })}
          >
            <span className="route-num lg">{s.number}</span>
            <span className="service-text">
              <b>{s.name}</b>
              <small className="muted">
                {STATION_BY_ID[s.stops[0]].name} ⟷ {STATION_BY_ID[s.stops[s.stops.length - 1]].name} · {s.stops.length} محطات
              </small>
            </span>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
      {state.demo && (
        <button type="button" className="btn btn-ghost btn-block" onClick={actions.startDemo}>
          إعادة بدء تجربة العرض
        </button>
      )}
    </section>
  )
}

function ServiceView({ serviceId }) {
  const { state, dispatch, simSeconds } = useApp()
  const net = NETWORK[serviceId]
  const vehicles = vehiclesOf(serviceId).map((v) => vehicleState(v, simSeconds))
  const roles = Object.fromEntries(net.stops.map((id) => [id, 'through']))
  return (
    <section className="page" aria-labelledby="svc-title">
      <BackButton onClick={() => dispatch({ type: 'tripsView', view: 'list' })}>العودة إلى الرحلات</BackButton>
      <div className="page-head">
        <span className="route-num lg">{net.number}</span>
        <h1 id="svc-title">{net.name}</h1>
        <p className="muted">{net.description}</p>
      </div>
      <div className="map-tags">
        <SimBadge />
        <span className="tag-muted">مسار توضيحي غير معتمد</span>
      </div>
      <TransitMap
        className="detail-map"
        stationIds={net.stops}
        roles={roles}
        lines={
          net.roadReady
            ? [
                { key: 'in', points: net.inPath.points, active: false },
                { key: 'out', points: net.outPath.points, active: true },
              ]
            : [{ key: 'approx', points: net.stops.map((id) => STATION_BY_ID[id].position), active: true, dashed: true }]
        }
        vehicles={vehicles}
        fitKey={`svc-${serviceId}`}
        labels
        showEnglish={state.settings.showEnglish}
      />
      <h2 className="section-title">المحطات بالترتيب</h2>
      <ol className="timeline">
        {net.stops.map((id) => (
          <li key={id}>
            <span className="tl-dot" />
            <span className="tl-body">
              <StationName id={id} />
              <small className="muted">{STATION_BY_ID[id].access}</small>
            </span>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                dispatch({ type: 'origin', id })
                dispatch({ type: 'tab', tab: 'home' })
              }}
            >
              ابدأ من هنا
            </button>
          </li>
        ))}
      </ol>
      <h2 className="section-title">الحافلات على المسار</h2>
      <ul className="bus-list">
        {vehicles.map((v) => (
          <li key={v.id}>
            <Icon name="bus" />
            <b>{v.id}</b>
            <span className="muted small">باتجاه {STATION_BY_ID[v.towards].name}</span>
          </li>
        ))}
      </ul>
      <p className="fine-print">زمن الدورة التقديري ذهابًا وإيابًا: {durationLabel(net.cycle / ((DEMO_CONFIG.averageSpeedKmh * 1000) / 3600))} — قيمة محاكاة.</p>
    </section>
  )
}

const STATUS_COPY = {
  waiting: 'في الطريق إلى محطتك',
  boarding: 'وصلت الحافلة إلى محطتك',
  riding: 'أنت على متن الحافلة',
  arrived: 'وصلت إلى وجهتك',
}

function TripDetail() {
  const { state, dispatch, simSeconds, busy, actions } = useApp()
  const { trip, wallet } = state
  const [paying, setPaying] = useState(false)
  const net = NETWORK[trip.serviceId]
  const vehicles = vehiclesOf(trip.serviceId).map((v) => vehicleState(v, simSeconds))
  const tracked = VEHICLES.find((v) => v.id === trip.vehicleId)
  const order = net.order[trip.direction]
  const fromIdx = order.indexOf(trip.fromId)
  const toIdx = order.indexOf(trip.toId)
  const etaFrom = etaSeconds(tracked, trip.fromId, trip.direction, simSeconds)
  const etaTo = etaSeconds(tracked, trip.toId, trip.direction, simSeconds)
  const lastRide = wallet.rides[0]

  const roles = {}
  order.slice(fromIdx, toIdx + 1).forEach((id) => (roles[id] = 'through'))
  roles[trip.fromId] = 'origin'
  roles[trip.toId] = 'destination'

  const path = trip.direction === 'out' ? net.outPath : net.inPath
  // إطار الخريطة: قبل الصعود نقرّب على محطتك والحافلة القادمة، وبعده نعرض الرحلة كاملة
  const approaching = trip.status === 'waiting' || trip.status === 'boarding'
  const fitPoints = useMemo(() => {
    const v = vehicles.find((x) => x.id === trip.vehicleId)
    const pts = approaching
      ? [STATION_BY_ID[trip.fromId].position]
      : order.slice(fromIdx, toIdx + 1).map((id) => STATION_BY_ID[id].position)
    if (v?.latlng) pts.push(v.latlng)
    return pts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.vehicleId, trip.fromId, trip.toId, approaching])
  const others = vehicles.filter((v) => v.id !== trip.vehicleId)
  const alternative = useMemo(
    () =>
      others
        .map((v) => ({ id: v.id, eta: etaSeconds(v, trip.fromId, trip.direction, simSeconds) }))
        .sort((a, b) => a.eta - b.eta)[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simSeconds, trip.vehicleId],
  )

  return (
    <section className="page trip-page" aria-labelledby="trip-title">
      <BackButton onClick={() => dispatch({ type: 'tripsView', view: 'list' })}>العودة إلى الرحلات</BackButton>

      <div className="trip-head">
        <span className="route-num lg">{net.number}</span>
        <div>
          <h1 id="trip-title">
            {STATION_BY_ID[trip.fromId].name} ← {STATION_BY_ID[trip.toId].name}
          </h1>
          <p className="muted small">
            {net.name} · باتجاه {STATION_BY_ID[trip.direction === 'out' ? net.last : net.first].name}
          </p>
        </div>
      </div>

      <div className="map-tags">
        <SimBadge>تتبّع محاكى</SimBadge>
        <span className="tag-muted">مسار توضيحي غير معتمد</span>
      </div>
      <TransitMap
        className="detail-map"
        stationIds={net.stops}
        roles={roles}
        dimOthers
        lines={
          net.roadReady
            ? [{ key: 'trip', points: path.points, active: true }]
            : [{ key: 'approx', points: order.map((id) => STATION_BY_ID[id].position), active: true, dashed: true }]
        }
        vehicles={vehicles}
        trackedVehicleId={trip.vehicleId}
        fitPoints={fitPoints}
        fitKey={`trip-${trip.serviceId}-${trip.direction}-${trip.vehicleId}-${trip.fromId}-${trip.toId}-${approaching}`}
        showEnglish={state.settings.showEnglish}
      />

      <div className={`status-card is-${trip.status}`} aria-live="polite">
        <div className="status-top">
          <span className="status-label">{STATUS_COPY[trip.status]}</span>
          <SimBadge />
        </div>
        {trip.status === 'waiting' && (
          <>
            <p className="status-main">
              الحافلة <b>{trip.vehicleId}</b> تصل إلى <StationName id={trip.fromId} sub={false} /> خلال{' '}
              <b className="eta big">{busy ? '…' : etaLabel(etaFrom)}</b>
            </p>
            <p className="muted small">لا يُخصم أي مبلغ أثناء استعراض الرحلة. الدفع عند الصعود فقط.</p>
            <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => actions.advanceTo(trip.fromId, 'boarding')}>
              <Icon name="play" size={16} /> {busy ? 'الحافلة تقترب…' : 'محاكاة وصول الحافلة'}
            </button>
            {alternative && (
              <button
                type="button"
                className="btn btn-ghost btn-block"
                disabled={busy}
                onClick={() => dispatch({ type: 'startTrip', trip: { ...trip, vehicleId: alternative.id } })}
              >
                تتبّع الحافلة التالية {alternative.id} ({etaLabel(alternative.eta)})
              </button>
            )}
          </>
        )}
        {trip.status === 'boarding' && (
          <>
            <p className="status-main">
              الحافلة <b>{trip.vehicleId}</b> متوقفة الآن في <StationName id={trip.fromId} sub={false} />.
            </p>
            <button type="button" className="btn btn-primary btn-block btn-pulse" onClick={() => setPaying(true)}>
              <Icon name="wallet" size={18} /> الدفع عند الصعود
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={actions.skipBus}>
              لن أصعد هذه الحافلة
            </button>
          </>
        )}
        {trip.status === 'riding' && (
          <>
            <p className="status-main">
              الوصول إلى <StationName id={trip.toId} sub={false} /> خلال <b className="eta big">{busy ? '…' : etaLabel(etaTo)}</b>
            </p>
            <p className="muted small">
              {lastRide?.method === 'wallet'
                ? `دُفعت الأجرة من المحفظة وأُضيفت ${lastRide.points} نقاط.`
                : 'دُفعت الأجرة بالبطاقة تجريبيًا (بدون نقاط).'}
            </p>
            <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => actions.advanceTo(trip.toId, 'arrived')}>
              <Icon name="play" size={16} /> {busy ? 'في الطريق…' : 'محاكاة الوصول إلى الوجهة'}
            </button>
          </>
        )}
        {trip.status === 'arrived' && (
          <>
            <p className="status-main">
              وصلت إلى <StationName id={trip.toId} sub={false} />. شكرًا لاستخدام مسار نجران.
            </p>
            {lastRide && (
              <dl className="trip-facts">
                <div>
                  <dt>الأجرة</dt>
                  <dd>{money(lastRide.fare)}</dd>
                </div>
                <div>
                  <dt>الطريقة</dt>
                  <dd>{lastRide.method === 'wallet' ? 'المحفظة' : 'بطاقة'}</dd>
                </div>
                <div>
                  <dt>النقاط</dt>
                  <dd>+{lastRide.points}</dd>
                </div>
              </dl>
            )}
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  actions.finishTrip()
                  dispatch({ type: 'tab', tab: 'home' })
                }}
              >
                العودة إلى الرئيسية
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  actions.finishTrip()
                  dispatch({ type: 'tab', tab: 'wallet' })
                }}
              >
                عرض المحفظة
              </button>
            </div>
          </>
        )}
      </div>

      <h2 className="section-title">المحطات بالترتيب</h2>
      <ol className="timeline">
        {order.map((id, i) => {
          const inTrip = i >= fromIdx && i <= toIdx
          const eta = etaSeconds(tracked, id, trip.direction, simSeconds)
          const passed = trip.status !== 'waiting' && i < fromIdx
          return (
            <li key={id} className={`${inTrip ? 'in-trip' : 'off-trip'} ${id === trip.fromId ? 'is-from' : ''} ${id === trip.toId ? 'is-to' : ''}`}>
              <span className="tl-dot" />
              <span className="tl-body">
                <StationName id={id} />
                {id === trip.fromId && <small className="tag">محطتك</small>}
                {id === trip.toId && <small className="tag">وجهتك</small>}
              </span>
              <span className="tl-eta">{inTrip && !passed && trip.status !== 'arrived' ? etaLabel(eta) : ''}</span>
            </li>
          )
        })}
      </ol>
      <p className="fine-print">
        الأوقات تقديرية محسوبة من موضع الحافلة المحاكى ومتوسط سرعة {DEMO_CONFIG.averageSpeedKmh} كم/س. ليست رصد GPS.
      </p>
      {trip.status === 'waiting' && (
        <button type="button" className="btn btn-ghost btn-block" onClick={actions.finishTrip}>
          إنهاء متابعة الرحلة
        </button>
      )}

      {paying && <PaySheet onClose={() => setPaying(false)} />}
    </section>
  )
}

export default function Trips() {
  const { state } = useApp()
  if (state.tripsView === 'detail' && state.focusedServiceId) return <ServiceView serviceId={state.focusedServiceId} />
  if (state.tripsView === 'detail' && state.trip) return <TripDetail />
  return <TripsList />
}
