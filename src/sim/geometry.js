// أدوات هندسية بسيطة للمسافات وموضع نقطة على خط
export function haversine(a, b) {
  const r = Math.PI / 180
  const dLat = (b[0] - a[0]) * r
  const dLng = (b[1] - a[1]) * r
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function preparePath(points) {
  if (!points || points.length < 2) return null
  const cumulative = [0]
  for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + haversine(points[i - 1], points[i]))
  const total = cumulative[cumulative.length - 1]
  return total > 0 ? { points, cumulative, total } : null
}

// نقطة على المسار عند مسافة معينة (بالمتر) من بدايته
export function pointAtDistance(path, distance) {
  if (!path) return null
  const d = Math.max(0, Math.min(path.total, distance))
  const { points, cumulative } = path
  let lo = 0
  let hi = cumulative.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cumulative[mid] < d) lo = mid + 1
    else hi = mid
  }
  const i = Math.max(1, lo)
  const seg = cumulative[i] - cumulative[i - 1]
  const t = seg > 0 ? (d - cumulative[i - 1]) / seg : 0
  const a = points[i - 1]
  const b = points[i]
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}
