// قيم افتراضية للعرض فقط — ليست تسعيرة رسمية ولا قرارًا ماليًا.
export const DEMO_CONFIG = {
  fare: 4, // سعر افتراضي للرحلة (ر.س) — مأخوذ من النسخة السابقة
  pointsPerWalletRide: 10, // النقاط تُمنح فقط عند الدفع بالمحفظة
  redeemPoints: 100, // كل 100 نقطة
  redeemValue: 5, // = 5 ر.س
  topUpAmounts: [10, 20, 50, 100],
  initialBalance: 20,
  averageSpeedKmh: 40, // متوسط سرعة تقديري لحساب الوقت
  dwellSeconds: 30, // توقف تقديري عند كل محطة
  simTickMs: 1000,
  // سرعة تحريك الحافلة على الخريطة عند «محاكاة وصول الحافلة»
  fastForwardMs: 6000,
  appUrl: 'https://najran-transit.vercel.app/',
}
