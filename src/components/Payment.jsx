import { useState } from 'react'
import { DEMO_CONFIG } from '../data/config.js'
import { useApp } from '../state.jsx'
import { Icon, SimBadge, money, StationName } from './ui.jsx'

export function TopUp({ onDone, compact = false }) {
  const { dispatch } = useApp()
  const [amount, setAmount] = useState(DEMO_CONFIG.topUpAmounts[1])
  const [method, setMethod] = useState('mada')
  return (
    <div className={`topup ${compact ? 'is-compact' : ''}`}>
      <h3 className="block-title">مبلغ الشحن</h3>
      <div className="chip-grid" role="radiogroup" aria-label="مبلغ الشحن">
        {DEMO_CONFIG.topUpAmounts.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={amount === a}
            className={`chip ${amount === a ? 'is-on' : ''}`}
            onClick={() => setAmount(a)}
          >
            {a} ر.س
          </button>
        ))}
      </div>
      <h3 className="block-title">وسيلة الشحن (تجريبية)</h3>
      <div className="chip-grid two" role="radiogroup" aria-label="وسيلة الشحن">
        {[
          ['mada', 'مدى'],
          ['visa', 'Visa'],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={method === k}
            className={`chip ${method === k ? 'is-on' : ''}`}
            onClick={() => setMethod(k)}
          >
            <Icon name="card" size={18} /> {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => {
          dispatch({ type: 'topUp', amount, method: method === 'mada' ? 'مدى' : 'Visa' })
          onDone?.()
        }}
      >
        شحن {amount} ر.س تجريبيًا
      </button>
      <p className="fine-print">محاكاة فقط: لا توجد بوابة دفع حقيقية ولن تُخصم أي أموال.</p>
    </div>
  )
}

// نافذة «الدفع عند الصعود» — تظهر فقط عند وصول الحافلة للمحطة
export function PaySheet({ onClose }) {
  const { state, actions } = useApp()
  const { wallet, trip } = state
  const [method, setMethod] = useState('wallet')
  const [topping, setTopping] = useState(false)
  const fare = DEMO_CONFIG.fare
  const short = method === 'wallet' && wallet.balance < fare

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <div>
            <h2 id="pay-title">الدفع عند الصعود</h2>
            {trip && (
              <p className="muted">
                الحافلة {trip.vehicleId} · من <StationName id={trip.fromId} sub={false} /> إلى{' '}
                <StationName id={trip.toId} sub={false} />
              </p>
            )}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <Icon name="close" />
          </button>
        </div>

        {topping ? (
          <>
            <TopUp compact onDone={() => setTopping(false)} />
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setTopping(false)}>
              رجوع إلى الدفع
            </button>
          </>
        ) : (
          <>
            <div className="fare-row">
              <span>أجرة الرحلة</span>
              <strong>{money(fare)}</strong>
            </div>
            <p className="fine-print tag-line">
              <SimBadge>سعر افتراضي للعرض</SimBadge>
            </p>

            <div className="method-list" role="radiogroup" aria-label="طريقة الدفع">
              <button
                type="button"
                role="radio"
                aria-checked={method === 'wallet'}
                className={`method ${method === 'wallet' ? 'is-on' : ''}`}
                onClick={() => setMethod('wallet')}
              >
                <Icon name="wallet" />
                <span>
                  <b>محفظة مسار</b>
                  <small>الرصيد {money(wallet.balance)} · تكسب {DEMO_CONFIG.pointsPerWalletRide} نقاط</small>
                </span>
                <em className="pill">الافتراضي</em>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={method === 'card'}
                className={`method ${method === 'card' ? 'is-on' : ''}`}
                onClick={() => setMethod('card')}
              >
                <Icon name="card" />
                <span>
                  <b>بطاقة مدى / Visa</b>
                  <small>دفع مباشر تجريبي · لا تُمنح نقاط</small>
                </span>
              </button>
            </div>

            {short && (
              <div className="alert" role="alert">
                الرصيد غير كافٍ ({money(wallet.balance)}). اشحن المحفظة تجريبيًا أو اختر البطاقة.
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTopping(true)}>
                  <Icon name="plus" size={16} /> شحن المحفظة
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={short}
              onClick={() => {
                actions.pay(method)
                onClose()
              }}
            >
              تأكيد الدفع التجريبي {money(fare)}
            </button>
            <p className="fine-print">لا يوجد حجز مقعد. الدفع يتم عند الصعود فقط، وكل العمليات محاكاة.</p>
          </>
        )}
      </div>
    </div>
  )
}
