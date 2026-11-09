// يرسم كل مسار على شبكة الطرق الفعلية عبر OSRM (OpenStreetMap) في الاتجاهين،
// ويحفظ النتيجة في src/data/routeGeometry.json حتى يعمل العرض دون اتصال بخدمة التوجيه.
// الاستخدام: npm run geometry
// (خلف بروكسي: NODE_USE_ENV_PROXY=1 npm run geometry)
import { writeFileSync } from 'node:fs'
import { STATION_BY_ID } from '../src/data/stations.js'
import { SERVICES } from '../src/data/services.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function route(stopIds) {
  const coords = stopIds.map((id) => {
    const [lat, lng] = STATION_BY_ID[id].position
    return `${lng},${lat}`
  })
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords.join(';')}` +
    `?overview=full&geometries=geojson&continue_straight=false`
  const res = await fetch(url, { headers: { 'User-Agent': 'najran-transit-prototype/2.0' } })
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  const r = data.routes?.[0]
  if (!r) throw new Error('No road route found')
  return {
    points: r.geometry.coordinates.map(([lng, lat]) => [+lat.toFixed(5), +lng.toFixed(5)]),
    legs: r.legs.map((l) => Math.round(l.distance)),
    distance: Math.round(r.distance),
  }
}

const out = { generatedAt: new Date().toISOString(), source: 'OSRM / OpenStreetMap', services: {} }

for (const svc of SERVICES) {
  const outbound = await route(svc.stops)
  await sleep(1100)
  const inbound = await route([...svc.stops].reverse())
  await sleep(1100)
  out.services[svc.id] = { stops: svc.stops, outbound, inbound }
  console.log(
    svc.id,
    `outbound ${(outbound.distance / 1000).toFixed(1)} km [${outbound.legs.map((l) => (l / 1000).toFixed(1))}]`,
    `inbound ${(inbound.distance / 1000).toFixed(1)} km [${inbound.legs.map((l) => (l / 1000).toFixed(1))}]`,
  )
}

writeFileSync(new URL('../src/data/routeGeometry.json', import.meta.url), JSON.stringify(out))
console.log('saved src/data/routeGeometry.json')
