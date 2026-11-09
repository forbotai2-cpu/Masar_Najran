import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { DEMO_CONFIG } from './data/config.js'
import { DEFAULT_ORIGIN_ID } from './data/stations.js'
import { VEHICLES } from './data/vehicles.js'
import { etaSeconds } from './sim/network.js'

const STORAGE_KEY = 'najran-transit-v2'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* التخزين غير متاح: نكمل دون حفظ */
  }
}

const freshWallet = () => ({
  balance: DEMO_CONFIG.initialBalance,
  points: 0,
  transactions: [],
  rides: [],
})

const defaultSettings = { largeText: false, reduceMotion: false, showEnglish: false }

function initialState() {
  const saved = loadSaved()
  return {
    tab: 'home',
    tripsView: 'list', // list | detail
    originId: DEFAULT_ORIGIN_ID,
    destinationId: null,
    focusedServiceId: null, // لعرض مسار كامل من قائمة المسارات
    trip: null, // { serviceId, direction, fromId, toId, vehicleId, status, method }
    wallet: saved?.wallet ?? freshWallet(),
    settings: { ...defaultSettings, ...(saved?.settings ?? {}) },
    location: { status: 'idle', latlng: null }, // idle | locating | ok | outside | denied | unsupported
    demo: false,
    demoComplete: false,
    introSeen: false,
    toast: null,
  }
}

const now = () => new Date().toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function reducer(state, action) {
  switch (action.type) {
    case 'tab':
      // عند فتح تبويب الرحلات: نعود لتفاصيل الرحلة الجارية إن وجدت، وإلا للقائمة
      if (action.tab === 'trips') {
        return { ...state, tab: 'trips', tripsView: state.trip ? 'detail' : 'list', focusedServiceId: null }
      }
      return { ...state, tab: action.tab }
    case 'tripsView':
      return { ...state, tripsView: action.view, focusedServiceId: action.serviceId ?? null }
    case 'origin':
      return {
        ...state,
        originId: action.id,
        destinationId: state.destinationId === action.id ? null : state.destinationId,
      }
    case 'destination':
      return { ...state, destinationId: action.id }
    case 'swap':
      return { ...state, originId: state.destinationId ?? state.originId, destinationId: state.originId }
    case 'location':
      return { ...state, location: action.location }
    case 'startTrip':
      return { ...state, trip: { ...action.trip, status: 'waiting', method: null }, tab: 'trips', tripsView: 'detail', focusedServiceId: null }
    case 'tripStatus':
      if (!state.trip) return state
      return {
        ...state,
        trip: { ...state.trip, status: action.status },
        demoComplete: state.demoComplete || (state.demo && action.status === 'arrived'),
      }
    case 'endTrip':
      return { ...state, trip: null, tripsView: 'list' }
    case 'topUp': {
      const w = state.wallet
      return {
        ...state,
        wallet: {
          ...w,
          balance: w.balance + action.amount,
          transactions: [
            { id: uid(), kind: 'topup', title: `شحن تجريبي عبر ${action.method}`, amount: action.amount, date: now() },
            ...w.transactions,
          ],
        },
        toast: `تم شحن ${action.amount} ر.س تجريبيًا`,
      }
    }
    case 'pay': {
      const w = state.wallet
      const fare = DEMO_CONFIG.fare
      const t = state.trip
      const byWallet = action.method === 'wallet'
      if (byWallet && w.balance < fare) return state
      const points = byWallet ? DEMO_CONFIG.pointsPerWalletRide : 0
      return {
        ...state,
        trip: t ? { ...t, status: 'riding', method: action.method } : t,
        wallet: {
          ...w,
          balance: byWallet ? w.balance - fare : w.balance,
          points: w.points + points,
          transactions: [
            {
              id: uid(),
              kind: 'fare',
              title: byWallet ? `دفع عند الصعود — ${t?.vehicleId ?? ''}` : `دفع بالبطاقة عند الصعود (محاكاة) — ${t?.vehicleId ?? ''}`,
              amount: -fare,
              offWallet: !byWallet,
              points,
              date: now(),
            },
            ...w.transactions,
          ],
          rides: t
            ? [{ id: uid(), vehicleId: t.vehicleId, serviceId: t.serviceId, fromId: t.fromId, toId: t.toId, fare, method: action.method, points, date: now() }, ...w.rides]
            : w.rides,
        },
        toast: byWallet ? `تم الدفع التجريبي وأُضيفت ${points} نقاط` : 'تم الدفع بالبطاقة تجريبيًا (لا تُمنح نقاط)',
      }
    }
    case 'redeem': {
      const w = state.wallet
      if (w.points < DEMO_CONFIG.redeemPoints) return state
      return {
        ...state,
        wallet: {
          ...w,
          points: w.points - DEMO_CONFIG.redeemPoints,
          balance: w.balance + DEMO_CONFIG.redeemValue,
          transactions: [
            { id: uid(), kind: 'redeem', title: `استبدال ${DEMO_CONFIG.redeemPoints} نقطة`, amount: DEMO_CONFIG.redeemValue, date: now() },
            ...w.transactions,
          ],
        },
        toast: 'تم تحويل النقاط إلى رصيد تجريبي',
      }
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'intro':
      return { ...state, introSeen: true }
    case 'toast':
      return { ...state, toast: action.message }
    case 'resetDemo':
      return {
        ...initialState(),
        wallet: { ...freshWallet(), balance: 2 }, // رصيد منخفض ليظهر الشحن ضمن السيناريو
        originId: null,
        destinationId: null,
        settings: state.settings,
        demo: true,
        introSeen: true,
        location: state.location,
      }
    case 'endDemo':
      return { ...state, demo: false }
    case 'resetAll':
      return { ...initialState(), wallet: freshWallet(), settings: state.settings, introSeen: true }
    default:
      return state
  }
}

// ساعة المحاكاة: تبدأ من صفر في كل تحميل لتكون التجربة قابلة للتكرار
function useSimClock() {
  const [simSeconds, setSimSeconds] = useState(0)
  const ref = useRef({ base: 0, realStart: performance.now(), paused: false, anim: null })

  const read = useCallback(() => {
    const r = ref.current
    return r.paused ? r.base : r.base + (performance.now() - r.realStart) / 1000
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (!ref.current.anim) setSimSeconds(read())
    }, DEMO_CONFIG.simTickMs)
    return () => clearInterval(id)
  }, [read])

  const pause = useCallback(() => {
    const r = ref.current
    r.base = read()
    r.paused = true
    setSimSeconds(r.base)
  }, [read])

  const resume = useCallback(() => {
    const r = ref.current
    if (!r.paused) return
    r.realStart = performance.now()
    r.paused = false
  }, [])

  const reset = useCallback(() => {
    const r = ref.current
    if (r.anim) cancelAnimationFrame(r.anim)
    r.anim = null
    r.base = 0
    r.realStart = performance.now()
    r.paused = false
    setSimSeconds(0)
  }, [])

  // تسريع المحاكاة حتى زمن معين ثم الإيقاف (لمحاكاة وصول الحافلة أمام اللجنة)
  const fastForward = useCallback(
    (deltaSeconds, durationMs, onDone) => {
      const r = ref.current
      if (r.anim) cancelAnimationFrame(r.anim)
      const from = read()
      const to = from + deltaSeconds
      const start = performance.now()
      r.paused = true
      r.base = from
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / durationMs)
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
        r.base = from + (to - from) * eased
        setSimSeconds(r.base)
        if (t < 1) r.anim = requestAnimationFrame(step)
        else {
          r.anim = null
          onDone?.()
        }
      }
      r.anim = requestAnimationFrame(step)
    },
    [read],
  )

  return { simSeconds, pause, resume, reset, fastForward, isAnimating: () => Boolean(ref.current.anim) }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const clock = useSimClock()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    save({ wallet: state.wallet, settings: state.settings })
  }, [state.wallet, state.settings])

  // متابعة حالة الرحلة: وصول الحافلة للمحطة ثم للوجهة
  const trip = state.trip
  useEffect(() => {
    if (!trip || busy) return
    const vehicle = VEHICLES.find((v) => v.id === trip.vehicleId)
    if (!vehicle) return
    if (trip.status === 'waiting' && etaSeconds(vehicle, trip.fromId, trip.direction, clock.simSeconds) === 0) {
      clock.pause()
      dispatch({ type: 'tripStatus', status: 'boarding' })
    } else if (trip.status === 'riding' && etaSeconds(vehicle, trip.toId, trip.direction, clock.simSeconds) === 0) {
      clock.pause()
      dispatch({ type: 'tripStatus', status: 'arrived' })
    }
  }, [trip, clock, busy])

  useEffect(() => {
    if (!state.toast) return
    const id = setTimeout(() => dispatch({ type: 'toast', message: null }), 3200)
    return () => clearTimeout(id)
  }, [state.toast])

  const actions = useMemo(
    () => ({
      // تقديم الحافلة المتتبعة حتى محطة معينة بحركة سلسة
      advanceTo(stationId, nextStatus) {
        if (!trip) return
        const vehicle = VEHICLES.find((v) => v.id === trip.vehicleId)
        const eta = etaSeconds(vehicle, stationId, trip.direction, clock.simSeconds)
        if (eta === null) return
        clock.resume()
        setBusy(true)
        const reduce = state.settings.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        clock.fastForward(eta + 1, reduce ? 300 : DEMO_CONFIG.fastForwardMs, () => {
          setBusy(false)
          dispatch({ type: 'tripStatus', status: nextStatus })
        })
      },
      pay(method) {
        dispatch({ type: 'pay', method })
        // تُستأنف المحاكاة فورًا لتنطلق الحافلة بعد الصعود
        setTimeout(() => clock.resume(), 50)
      },
      skipBus() {
        clock.resume()
        dispatch({ type: 'endTrip' })
      },
      finishTrip() {
        clock.resume()
        dispatch({ type: 'endTrip' })
      },
      startDemo() {
        clock.reset()
        dispatch({ type: 'resetDemo' })
      },
      resetAll() {
        clock.reset()
        dispatch({ type: 'resetAll' })
      },
    }),
    [trip, clock, state.settings.reduceMotion],
  )

  const value = useMemo(
    () => ({ state, dispatch, simSeconds: clock.simSeconds, busy, actions }),
    [state, clock.simSeconds, busy, actions],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
