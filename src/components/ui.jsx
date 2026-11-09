import { STATION_BY_ID } from '../data/stations.js'
import { useApp } from '../state.jsx'

export function SimBadge({ children = 'بيانات تجريبية / محاكاة' }) {
  return (
    <span className="sim-badge" title="هذه البيانات محاكاة لأغراض العرض وليست رصدًا حقيقيًا">
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v4l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {children}
    </span>
  )
}

export function etaLabel(seconds) {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds <= 20) return 'عند المحطة'
  const m = Math.max(1, Math.round(seconds / 60))
  if (m < 60) return `${m} د`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h} س ${r} د` : `${h} س`
}

export function durationLabel(seconds) {
  const m = Math.max(1, Math.round(seconds / 60))
  if (m < 60) return `${m} دقيقة تقريبًا`
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${h} س ${r ? `${r} د ` : ''}تقريبًا`
}

export const money = (v) => `${Number(v).toFixed(2)} ر.س`

export function StationName({ id, sub = true }) {
  const { state } = useApp()
  const s = STATION_BY_ID[id]
  if (!s) return null
  return (
    <span className="station-name">
      {s.name}
      {sub && state.settings.showEnglish && <small lang="en">{s.nameEn}</small>}
    </span>
  )
}

export function BackButton({ onClick, children }) {
  return (
    <button type="button" className="back-btn" onClick={onClick}>
      <Icon name="back" />
      {children}
    </button>
  )
}

const PATHS = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z',
  route: 'M6 3a3 3 0 0 1 1 5.83V15a3 3 0 0 0 3 3h4.17a3 3 0 1 1 0 2H10a5 5 0 0 1-5-5V8.83A3 3 0 0 1 6 3Zm12-1a3 3 0 0 1 1 5.83V10a1 1 0 1 1-2 0V7.83A3 3 0 0 1 18 2Z',
  wallet: 'M4 6a3 3 0 0 1 3-3h10a1 1 0 1 1 0 2H7a1 1 0 0 0 0 2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V6Zm13 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 0 1 16 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z',
  back: 'M9.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 1 1-1.4-1.4l5.29-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z',
  chevron: 'M14.7 5.3a1 1 0 0 1 0 1.4L9.41 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z',
  search: 'M10.5 3a7.5 7.5 0 0 1 5.96 12.05l4.25 4.24a1 1 0 0 1-1.42 1.42l-4.24-4.25A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z',
  locate: 'M12 2a1 1 0 0 1 1 1v1.06A8 8 0 0 1 19.94 11H21a1 1 0 1 1 0 2h-1.06A8 8 0 0 1 13 19.94V21a1 1 0 1 1-2 0v-1.06A8 8 0 0 1 4.06 13H3a1 1 0 1 1 0-2h1.06A8 8 0 0 1 11 4.06V3a1 1 0 0 1 1-1Zm0 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
  swap: 'M7 3a1 1 0 0 1 .7.3l3 3a1 1 0 0 1-1.4 1.4L8 6.42V17a1 1 0 1 1-2 0V6.41L4.7 7.7a1 1 0 0 1-1.4-1.4l3-3A1 1 0 0 1 7 3Zm10 18a1 1 0 0 1-.7-.3l-3-3a1 1 0 0 1 1.4-1.4l1.3 1.29V7a1 1 0 1 1 2 0v10.59l1.3-1.3a1 1 0 0 1 1.4 1.42l-3 3A1 1 0 0 1 17 21Z',
  bus: 'M6 2h12a3 3 0 0 1 3 3v11a2 2 0 0 1-1 1.73V20a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.27A2 2 0 0 1 3 16V5a3 3 0 0 1 3-3Zm0 3v6h12V5H6Zm1.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  plus: 'M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z',
  check: 'M20.7 6.3a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l4.3 4.29 9.3-9.3a1 1 0 0 1 1.4 0Z',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z',
  play: 'M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z',
  close: 'M6.7 5.3 12 10.6l5.3-5.3a1 1 0 1 1 1.4 1.4L13.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4L12 13.4l-5.3 5.3a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 1.4-1.4Z',
  qr: 'M3 3h7v7H3V3Zm2 2v3h3V5H5Zm9-2h7v7h-7V3Zm2 2v3h3V5h-3ZM3 14h7v7H3v-7Zm2 2v3h3v-3H5Zm9-2h2v2h-2v-2Zm4 0h3v2h-3v-2Zm-4 4h2v3h-2v-3Zm4 0h3v3h-3v-3Zm-2-2h2v2h-2v-2Z',
  card: 'M2 7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v1H2V7Zm0 3h20v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-7Zm4 5a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H6Z',
  info: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 8a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-5a1 1 0 0 0-1-1Zm0-4a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 12 6Z',
  pin: 'M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  flag: 'M5 2a1 1 0 0 1 1 1v.5h11.5a1 1 0 0 1 .8 1.6L16.25 8l2.05 2.9a1 1 0 0 1-.8 1.6H6V21a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Z',
}

export function Icon({ name, size = 20 }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path fill="currentColor" d={PATHS[name]} />
    </svg>
  )
}

export function Toast() {
  const { state } = useApp()
  if (!state.toast) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      <Icon name="check" size={18} />
      {state.toast}
    </div>
  )
}
