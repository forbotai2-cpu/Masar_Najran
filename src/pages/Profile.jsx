import { useState } from 'react'
import { Icon, money } from '../components/ui.jsx'
import { DEMO_CONFIG } from '../data/config.js'
import { STATION_BY_ID } from '../data/stations.js'
import { SERVICE_BY_ID } from '../data/services.js'
import { useApp } from '../state.jsx'

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>
        <b>{label}</b>
        {hint && <small className="muted">{hint}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  )
}

export default function Profile() {
  const { state, dispatch, actions } = useApp()
  const { wallet, settings } = state
  const [copied, setCopied] = useState(false)
  const set = (s) => dispatch({ type: 'settings', settings: s })

  return (
    <section className="page" aria-labelledby="profile-title">
      <div className="page-head">
        <span className="eyebrow">حساب تجريبي</span>
        <h1 id="profile-title">حسابي</h1>
      </div>

      <div className="profile-card">
        <div className="avatar" aria-hidden="true">
          <Icon name="user" size={28} />
        </div>
        <div>
          <h2>مستخدم مسار</h2>
          <p className="muted small">حساب تجريبي لأغراض العرض</p>
        </div>
      </div>
      <div className="stats">
        <div>
          <strong>{wallet.rides.length}</strong>
          <span>رحلة تجريبية</span>
        </div>
        <div>
          <strong>{wallet.points}</strong>
          <span>نقطة</span>
        </div>
        <div>
          <strong>{wallet.balance.toFixed(0)}</strong>
          <span>ر.س رصيد</span>
        </div>
      </div>

      <h2 className="section-title">اللغة وإمكانية الوصول</h2>
      <div className="settings">
        <Toggle
          label="إظهار الأسماء الإنجليزية للمحطات"
          hint="Show English station names"
          checked={settings.showEnglish}
          onChange={(v) => set({ showEnglish: v })}
        />
        <Toggle label="تكبير النص" hint="خط أكبر وتباعد أوسع" checked={settings.largeText} onChange={(v) => set({ largeText: v })} />
        <Toggle
          label="تقليل الحركة"
          hint="إيقاف النبض والحركات الانتقالية"
          checked={settings.reduceMotion}
          onChange={(v) => set({ reduceMotion: v })}
        />
      </div>

      <h2 className="section-title">سجل الرحلات</h2>
      {wallet.rides.length === 0 ? (
        <div className="empty">لا توجد رحلات بعد. ستظهر هنا بعد الدفع التجريبي عند الصعود.</div>
      ) : (
        <ul className="tx-list">
          {wallet.rides.map((r) => (
            <li key={r.id}>
              <span>
                <b>
                  {STATION_BY_ID[r.fromId]?.name} ← {STATION_BY_ID[r.toId]?.name}
                </b>
                <small className="muted">
                  مسار {SERVICE_BY_ID[r.serviceId]?.number} · {r.vehicleId} · {r.date}
                </small>
              </span>
              <span className="amount">
                {money(r.fare)}
                <small className="muted">{r.method === 'wallet' ? `+${r.points} نقاط` : 'بطاقة'}</small>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">جرّب التطبيق</h2>
      <div className="share-card">
        <img
          src="/qr/najran-transit-app-qr.svg"
          width="148"
          height="148"
          alt="رمز QR يفتح النموذج التجريبي لتطبيق مسار نجران"
        />
        <div>
          <h3>امسح لتجربة تطبيق مسار نجران</h3>
          <p className="muted small" dir="ltr">
            najran-transit.vercel.app
          </p>
          <p className="fine-print">هذا رمز لفتح النموذج فقط، وليس تذكرة ولا رمز دفع.</p>
          <div className="btn-row">
            <a className="btn btn-secondary btn-sm" href={DEMO_CONFIG.appUrl} target="_blank" rel="noreferrer">
              افتح النموذج
            </a>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(DEMO_CONFIG.appUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? 'تم النسخ' : 'نسخ الرابط'}
            </button>
          </div>
        </div>
      </div>

      <h2 className="section-title">عن المحاكاة</h2>
      <div className="about">
        <p>هذا بروتوتايب للعرض. العناصر التالية محاكاة وليست تشغيلًا حقيقيًا:</p>
        <ul>
          <li>مواقع الحافلات وحركتها على الخريطة.</li>
          <li>أوقات الوصول (محسوبة من موضع محاكى ومتوسط سرعة تقديري).</li>
          <li>الرصيد والشحن والدفع عند الصعود والنقاط.</li>
          <li>المحطات مواقع توضيحية قرب معالم معروفة، والمسارات غير معتمدة.</li>
          <li>الأجرة ({money(DEMO_CONFIG.fare)}) سعر افتراضي للعرض.</li>
        </ul>
        <p className="muted small">الخرائط والطرق من OpenStreetMap.</p>
      </div>

      <div className="btn-col">
        <button type="button" className="btn btn-secondary btn-block" onClick={actions.startDemo}>
          <Icon name="play" size={16} /> بدء تجربة العرض
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => {
            if (window.confirm('إعادة ضبط الرصيد والنقاط والسجل التجريبي؟')) actions.resetAll()
          }}
        >
          إعادة ضبط بيانات العرض
        </button>
      </div>
    </section>
  )
}
