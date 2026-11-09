import { useEffect, useRef } from 'react'
import { AppProvider, useApp } from './state.jsx'
import { Icon, Toast } from './components/ui.jsx'
import { DEMO_CONFIG } from './data/config.js'
import Home from './pages/Home.jsx'
import Trips from './pages/Trips.jsx'
import Wallet from './pages/Wallet.jsx'
import Profile from './pages/Profile.jsx'

const TABS = [
  ['home', 'home', 'الرئيسية'],
  ['trips', 'route', 'الرحلات'],
  ['wallet', 'wallet', 'المحفظة'],
  ['profile', 'user', 'حسابي'],
]

// خطوات تجربة العرض تُستنتج من حالة التطبيق، فتتقدم تلقائيًا مع المستخدم
function demoStep(state) {
  const { originId, destinationId, trip, wallet } = state
  const paid = trip && (trip.status === 'riding' || trip.status === 'arrived')
  const steps = [
    { done: Boolean(originId), text: 'اختر محطة البداية من الخريطة أو القائمة', tab: 'home' },
    { done: Boolean(destinationId), text: 'اكتب الوجهة في «إلى أين تريد الذهاب؟» واخترها', tab: 'home' },
    { done: Boolean(trip), text: 'اضغط «عرض الرحلات» ثم «استعرض الرحلة»', tab: 'trips' },
    { done: wallet.balance >= DEMO_CONFIG.fare || paid, text: 'الرصيد لا يكفي: افتح المحفظة واشحن تجريبيًا', tab: 'wallet' },
    { done: trip && trip.status !== 'waiting', text: 'عد إلى الرحلة واضغط «محاكاة وصول الحافلة»', tab: 'trips' },
    { done: paid, text: 'اضغط «الدفع عند الصعود» ثم أكّد الدفع التجريبي', tab: 'trips' },
    { done: trip?.status === 'arrived', text: 'اضغط «محاكاة الوصول إلى الوجهة»', tab: 'trips' },
  ]
  if (state.demoComplete) return { index: steps.length, total: steps.length, step: null }
  const i = steps.findIndex((s) => !s.done)
  return { index: i === -1 ? steps.length : i, total: steps.length, step: steps[i] }
}

function DemoGuide() {
  const { state, dispatch } = useApp()
  if (!state.demo) return null
  const { index, total, step } = demoStep(state)
  return (
    <div className="demo-guide" role="status" aria-live="polite">
      <span className="demo-count">
        {Math.min(index + 1, total)}/{total}
      </span>
      <span className="demo-text">{step ? step.text : 'اكتملت تجربة العرض. يمكنك إعادتها من «حسابي».'}</span>
      {step && step.tab !== state.tab && (
        <button type="button" className="link-btn" onClick={() => dispatch({ type: 'tab', tab: step.tab })}>
          انتقل
        </button>
      )}
      <button type="button" className="icon-btn sm" aria-label="إنهاء تجربة العرض" onClick={() => dispatch({ type: 'endDemo' })}>
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}

function Intro() {
  const { state, dispatch, actions } = useApp()
  if (state.introSeen) return null
  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-rings" aria-hidden="true" />
      <div className="intro-content">
        <span className="intro-label" lang="en">
          NAJRAN SMART MOBILITY
        </span>
        <h1 id="intro-title">
          نجران تتحرك
          <br />
          <em>معك</em>
        </h1>
        <p>حافلات ترددية بين محطات ثابتة، على مسارات معلنة. استعرض رحلتك وادفع عند الصعود.</p>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'intro' })} autoFocus>
          ابدأ
        </button>
        <button type="button" className="link-btn" onClick={actions.startDemo}>
          <Icon name="play" size={14} /> تجربة العرض خطوة بخطوة
        </button>
        <small className="intro-note">نموذج تجريبي — البيانات المعروضة محاكاة</small>
      </div>
    </div>
  )
}

function Shell() {
  const { state, dispatch, actions } = useApp()
  const mainRef = useRef(null)
  const { settings, tab } = state

  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 })
    window.scrollTo?.({ top: 0 })
  }, [tab, state.tripsView])

  return (
    <div
      className={`app ${settings.largeText ? 'large-text' : ''} ${settings.reduceMotion ? 'reduce-motion' : ''} tab-${tab}`}
      dir="rtl"
      lang="ar"
    >
      <header className="topbar">
        <div className="logo-mark" aria-hidden="true">
          <Icon name="route" size={22} />
        </div>
        <div className="brand">
          <strong>مسار نجران</strong>
          <span lang="en">NAJRAN TRANSIT</span>
        </div>
        <button type="button" className="demo-btn" onClick={actions.startDemo} title="تشغيل سيناريو العرض من البداية">
          <Icon name="play" size={14} /> تجربة العرض
        </button>
      </header>
      <DemoGuide />

      <main ref={mainRef} className="main" id="main">
        {tab === 'home' && <Home />}
        {tab === 'trips' && <Trips />}
        {tab === 'wallet' && <Wallet />}
        {tab === 'profile' && <Profile />}
      </main>

      <nav className="bottom-nav" aria-label="التنقل الرئيسي">
        {TABS.map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'is-active' : ''}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => dispatch({ type: 'tab', tab: id })}
          >
            <Icon name={icon} size={22} />
            <span>{label}</span>
            {id === 'trips' && state.trip?.status === 'boarding' && <i className="nav-dot" aria-label="الحافلة وصلت" />}
          </button>
        ))}
      </nav>
      <Toast />
      <Intro />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
