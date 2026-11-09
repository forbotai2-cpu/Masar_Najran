// نموذج الشبكة والمحاكاة: يحسب موضع كل حافلة وأوقات الوصول من بيانات المسارات.
// كل النتائج هنا محاكاة بروتوتايب وليست رصدًا حقيقيًا.
import { STATIONS, STATION_BY_ID } from '../data/stations.js'
import { SERVICES, SERVICE_BY_ID } from '../data/services.js'
import { VEHICLES } from '../data/vehicles.js'
import { DEMO_CONFIG } from '../data/config.js'
import geometry from '../data/routeGeometry.json'
import { haversine, preparePath, pointAtDistance } from './geometry.js'

export const SPEED_MPS = (DEMO_CONFIG.averageSpeedKmh * 1000) / 3600
const ARRIVAL_WINDOW_M = 40

function sameStops(a, b) {
  return a && b && a.length === b.length && a.every((x, i) => x === b[i])
}

function straightLegs(ids) {
  const legs = []
  for (let i = 1; i < ids.length; i++)
    legs.push(Math.round(haversine(STATION_BY_ID[ids[i - 1]].position, STATION_BY_ID[ids[i]].position) * 1.3))
  return legs
}

function buildService(svc) {
  const g = geometry.services?.[svc.id]
  // إذا عُدّل تسلسل المحطات دون إعادة رسم المسار، نعرض خطًا تقريبيًا ولا نحرّك حافلة فوقه
  const roadReady = g && sameStops(g.stops, svc.stops)
  const reversed = [...svc.stops].reverse()
  const outLegs = roadReady ? g.outbound.legs : straightLegs(svc.stops)
  const inLegs = roadReady ? g.inbound.legs : straightLegs(reversed)
  const outPath = roadReady ? preparePath(g.outbound.points) : null
  const inPath = roadReady ? preparePath(g.inbound.points) : null
  // نطابق طول الخط المرسوم مع مجموع الأرجل لتجنب انحراف بسيط في الحساب
  const outLen = outLegs.reduce((a, b) => a + b, 0)
  const inLen = inLegs.reduce((a, b) => a + b, 0)

  const outStopPos = [0]
  outLegs.forEach((l, i) => outStopPos.push(outStopPos[i] + l))
  const inStopPos = [outLen]
  inLegs.forEach((l, i) => inStopPos.push(inStopPos[i] + l))

  return {
    ...svc,
    roadReady: Boolean(roadReady && outPath && inPath),
    outPath,
    inPath,
    outLen,
    inLen,
    cycle: outLen + inLen,
    // موضع كل محطة على الدورة لكل اتجاه
    stopPos: {
      out: Object.fromEntries(svc.stops.map((id, i) => [id, outStopPos[i]])),
      in: Object.fromEntries(reversed.map((id, i) => [id, inStopPos[i]])),
    },
    order: { out: svc.stops, in: reversed },
    first: svc.stops[0],
    last: svc.stops[svc.stops.length - 1],
  }
}

export const NETWORK = Object.fromEntries(SERVICES.map((s) => [s.id, buildService(s)]))

export function vehiclesOf(serviceId) {
  return VEHICLES.filter((v) => v.serviceId === serviceId)
}

// موضع الحافلة على الدورة (متر) عند زمن محاكاة معين (ثانية)
export function vehicleCyclePos(vehicle, simSeconds) {
  const net = NETWORK[vehicle.serviceId]
  const d = vehicle.phase * net.cycle + SPEED_MPS * simSeconds
  return ((d % net.cycle) + net.cycle) % net.cycle
}

export function vehicleState(vehicle, simSeconds) {
  const net = NETWORK[vehicle.serviceId]
  const pos = vehicleCyclePos(vehicle, simSeconds)
  const direction = pos < net.outLen ? 'out' : 'in'
  let latlng = null
  if (net.roadReady) {
    latlng =
      direction === 'out'
        ? pointAtDistance(net.outPath, (pos / net.outLen) * net.outPath.total)
        : pointAtDistance(net.inPath, ((pos - net.outLen) / net.inLen) * net.inPath.total)
  }
  const towards = direction === 'out' ? net.last : net.first
  return { ...vehicle, pos, direction, latlng, towards }
}

// المحطات بين موضعين على الدورة (لحساب زمن التوقف)
function stopsBetween(net, fromPos, toPos) {
  let count = 0
  const all = [...Object.values(net.stopPos.out), ...Object.values(net.stopPos.in)]
  const unique = [...new Set(all.map((p) => Math.round(p)))]
  for (const p of unique) {
    const ahead = (p - fromPos + net.cycle) % net.cycle
    const span = (toPos - fromPos + net.cycle) % net.cycle
    if (ahead > 1 && ahead < span - 1) count++
  }
  return count
}

// الزمن التقديري (ثانية) لوصول حافلة إلى محطة في اتجاه معين
export function etaSeconds(vehicle, stationId, direction, simSeconds) {
  const net = NETWORK[vehicle.serviceId]
  const target = net.stopPos[direction][stationId]
  if (target === undefined) return null
  const pos = vehicleCyclePos(vehicle, simSeconds)
  const ahead = (target - pos + net.cycle) % net.cycle
  if (ahead <= ARRIVAL_WINDOW_M || net.cycle - ahead <= 5) return 0
  return ahead / SPEED_MPS + stopsBetween(net, pos, target) * DEMO_CONFIG.dwellSeconds
}

// اتجاهات صالحة للركوب من محطة (نتجنب تكرار الطرفين)
export function boardingDirections(net, stationId) {
  const dirs = []
  if (net.stopPos.out[stationId] !== undefined && stationId !== net.last) dirs.push('out')
  if (net.stopPos.in[stationId] !== undefined && stationId !== net.first) dirs.push('in')
  return dirs
}

// أقرب الحافلات القادمة لمحطة عبر كل المسارات
export function upcomingAtStation(stationId, simSeconds, limit = 2) {
  const list = []
  for (const net of Object.values(NETWORK)) {
    for (const dir of boardingDirections(net, stationId)) {
      for (const v of vehiclesOf(net.id)) {
        const eta = etaSeconds(v, stationId, dir, simSeconds)
        if (eta === null) continue
        list.push({
          vehicleId: v.id,
          serviceId: net.id,
          direction: dir,
          towards: dir === 'out' ? net.last : net.first,
          eta,
        })
      }
    }
  }
  return list.sort((a, b) => a.eta - b.eta).slice(0, limit)
}

// المسافة بين محطتين في اتجاه معين (متر)
export function rideDistance(net, fromId, toId, direction) {
  const a = net.stopPos[direction][fromId]
  const b = net.stopPos[direction][toId]
  if (a === undefined || b === undefined || b <= a) return null
  return b - a
}

// الرحلات المباشرة بين محطتين من المسارات المعرّفة فقط (دون تبديل حافلات)
export function findDirectTrips(fromId, toId, simSeconds) {
  if (!fromId || !toId || fromId === toId) return []
  const results = []
  for (const net of Object.values(NETWORK)) {
    for (const dir of ['out', 'in']) {
      const dist = rideDistance(net, fromId, toId, dir)
      if (dist === null) continue
      const order = net.order[dir]
      const between = order.slice(order.indexOf(fromId), order.indexOf(toId) + 1)
      const next = vehiclesOf(net.id)
        .map((v) => ({ vehicleId: v.id, eta: etaSeconds(v, fromId, dir, simSeconds) }))
        .filter((x) => x.eta !== null)
        .sort((a, b) => a.eta - b.eta)
      results.push({
        serviceId: net.id,
        direction: dir,
        fromId,
        toId,
        towards: dir === 'out' ? net.last : net.first,
        stops: between,
        rideSeconds: dist / SPEED_MPS + (between.length - 2) * DEMO_CONFIG.dwellSeconds,
        distance: dist,
        next: next.slice(0, 2),
      })
    }
  }
  return results.sort((a, b) => (a.next[0]?.eta ?? 1e9) - (b.next[0]?.eta ?? 1e9))
}

export function nearestStation(latlng) {
  let best = null
  for (const s of STATIONS) {
    const d = haversine(latlng, s.position)
    if (!best || d < best.distance) best = { station: s, distance: d }
  }
  return best
}

export function servicesAtStation(stationId) {
  return SERVICES.filter((s) => s.stops.includes(stationId))
}

export { STATIONS, STATION_BY_ID, SERVICES, SERVICE_BY_ID }
