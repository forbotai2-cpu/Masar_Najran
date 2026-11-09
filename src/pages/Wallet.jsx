import { useState } from 'react'
import { PaySheet, TopUp } from '../components/Payment.jsx'
import { BackButton, Icon, SimBadge, money } from '../components/ui.jsx'
import { DEMO_CONFIG } from '../data/config.js'
import { STATION_BY_ID } from '../data/stations.js'
import { useApp } from '../state.jsx'

export default function Wallet() {
  const { state, dispatch } = useApp()
  const { wallet, trip } = state
  const [view, setView] = useState('main')
  const [paying, setPaying] = useState(false)
  const boarding = trip?.status === 'boarding'

  if (view === 'topup') {
    return (
      <section className="page" aria-labelledby="topup-title">
        <BackButton onClick={() => setView('main')}>العودة إلى المحفظة</BackButton>
        <div className="page-head">
          <h1 id="topup-title">شحن المحفظة</h1>
          <p className="muted">الرصيد الحالي {money(wallet.balance)}</p>
        </div>
        <TopUp onDone={() => setView('main')} />
      </section>
    )
  }

  return (
    <section className="page" aria-labelledby="wallet-title">
      <div className="page-head">
        <span className="eyebrow">مدفوعاتك ومكافآتك</span>
        <h1 id="wallet-title">المحفظة</h1>
      </div>

      <div className="wallet-card">
        <div className="wallet-top">
          <span>الرصيد المتاح</span>
          <SimBadge>محفظة تجريبية</SimBadge>
        </div>
        <strong className="balance">
          {wallet.balance.toFixed(2)} <small>ر.س</small>
        </strong>
        <div className="wallet-foot">
          <span>
            <Icon name="star" size={16} /> {wallet.points} نقطة مكافأة
          </span>
          <span lang="en">MASAR WALLET</span>
        </div>
      </div>

      <div className="wallet-actions">
        <button type="button" className="tile-btn" onClick={() => setView('topup')}>
          <Icon name="plus" />
          شحن المحفظة
        </button>
        <button
          type="button"
          className={`tile-btn ${boarding ? 'is-hot' : ''}`}
          onClick={() => (boarding ? setPaying(true) : document.getElementById('pay-hint')?.focus())}
          aria-describedby="pay-hint"
        >
          <Icon name="bus" />
          الدفع عند الصعود
        </button>
      </div>
      <p id="pay-hint" tabIndex={-1} className={`hint ${boarding ? 'is-hot' : ''}`}>
        {boarding ? (
          <>
            الحافلة {trip.vehicleId} في {STATION_BY_ID[trip.fromId].name} الآن. اضغط «الدفع عند الصعود».
          </>
        ) : trip?.status === 'riding' ? (
          'أنت على متن الحافلة، ودُفعت الأجرة.'
        ) : (
          <>
            يظهر الدفع عندما تصل الحافلة إلى محطتك.{' '}
            <button type="button" className="link-btn" onClick={() => dispatch({ type: 'tab', tab: 'trips' })}>
              اذهب إلى الرحلات
            </button>
          </>
        )}
      </p>

      <div className="rewards">
        <div>
          <span className="eyebrow">مكافآت مسار</span>
          <h3>نقاط على كل رحلة تُدفع بالمحفظة</h3>
          <p className="muted small">
            {DEMO_CONFIG.pointsPerWalletRide} نقاط لكل رحلة بالمحفظة. استبدل {DEMO_CONFIG.redeemPoints} نقطة بـ{' '}
            {DEMO_CONFIG.redeemValue} ر.س. الدفع بالبطاقة لا يمنح نقاطًا.
          </p>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (wallet.points / DEMO_CONFIG.redeemPoints) * 100)}%` }} />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={wallet.points < DEMO_CONFIG.redeemPoints}
          onClick={() => dispatch({ type: 'redeem' })}
        >
          استبدال النقاط
        </button>
      </div>

      <h2 className="section-title">آخر العمليات</h2>
      {wallet.transactions.length === 0 ? (
        <div className="empty">لا توجد عمليات بعد.</div>
      ) : (
        <ul className="tx-list">
          {wallet.transactions.slice(0, 8).map((t) => (
            <li key={t.id}>
              <span>
                <b>{t.title}</b>
                <small className="muted">
                  {t.date}
                  {t.kind === 'fare' && (t.points ? ` · +${t.points} نقاط` : ' · بدون نقاط')}
                </small>
              </span>
              <span className={`amount ${t.amount > 0 ? 'pos' : 'neg'}`}>
                {t.amount > 0 ? '+' : '−'}
                {money(Math.abs(t.amount))}
                {t.offWallet && <small className="muted">من البطاقة</small>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="fine-print">كل الأرصدة والعمليات تجريبية، ولا ترتبط بأي بوابة دفع أو حساب بنكي.</p>
      {paying && <PaySheet onClose={() => setPaying(false)} />}
    </section>
  )
}
