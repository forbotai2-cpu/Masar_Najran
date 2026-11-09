// اختبار شامل لمسار العرض: التنقل، المحاكاة، المحفظة، الدفع عند الصعود.
// التشغيل: npm run build && npx vite preview --port 4173 & ثم npm run test:e2e
// المتغيرات: BASE_URL (افتراضي http://localhost:4173) و SHOTS (مجلد لقطات الشاشة، اختياري)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'
const SHOTS = process.env.SHOTS
if (SHOTS) mkdirSync(SHOTS, { recursive: true })

let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`)
  if (!cond) failures++
}

async function shot(page, name) {
  if (!SHOTS) return
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${SHOTS}/${name}.png` })
}

async function run(viewport, label, scale) {
  console.log(`\n— ${label} (${viewport.width}×${viewport.height})`)
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, locale: 'ar-SA' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && !/tile|Failed to load resource/i.test(m.text()) && errors.push(m.text()))

  await page.goto(BASE, { waitUntil: 'networkidle' })
  ok(await page.getByRole('dialog', { name: /نجران تتحرك/ }).isVisible(), 'الشاشة الافتتاحية تظهر')
  const tag = `${label}-`
  const nav = (name) => page.locator('.bottom-nav').getByRole('button', { name, exact: true })
  await shot(page, `${tag}00-intro`)

  // ممنوعات النسخة القديمة
  const body = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ')
  // بدء سيناريو العرض
  await page.getByRole('button', { name: 'تجربة العرض خطوة بخطوة' }).click()
  ok(await page.locator('.demo-guide').isVisible(), 'دليل تجربة العرض يظهر')
  ok((await page.locator('.station-pin').count()) === 8, 'الخريطة تعرض 8 محطات ثابتة')
  ok(await page.getByText('اختر محطة البداية').first().isVisible(), 'حالة «اختر محطة البداية» عند غياب الموقع')

  // 2) اختيار محطة البداية من الخريطة
  await page.locator('.leaflet-marker-icon[title="العزام مول"]').click()
  await page.waitForTimeout(400)
  ok((await page.locator('.arrivals li').count()) === 2, 'تظهر الحافلتان القادمتان للمحطة')
  ok(await page.locator('.station-card .sim-badge').isVisible(), 'وسم «بيانات تجريبية» بجوار أوقات الوصول')
  await shot(page, `${tag}01-home-station`)

  // 3) إدخال الوجهة بالبحث
  await page.getByRole('searchbox', { name: 'إلى أين تريد الذهاب؟' }).fill('جامعة')
  await page.locator('#dest-list').getByRole('option', { name: /جامعة نجران/ }).click()
  ok(await page.locator('.chosen').innerText().then((t) => t.includes('جامعة نجران')), 'تم اختيار الوجهة')
  await shot(page, `${tag}02-home-destination`)
  await page.getByRole('button', { name: 'عرض الرحلات' }).click()
  ok((await page.locator('.trip-card').count()) >= 1, 'تظهر رحلة مناسبة من المسارات المعرّفة')
  ok((await page.locator('.trip-card h3').first().innerText()).includes('الجامعي'), 'الرحلة المقترحة على المسار الجامعي')
  await shot(page, `${tag}03-trips-results`)

  // 4) فتح تفاصيل الرحلة
  const balanceBefore = 2
  await page.getByRole('button', { name: 'استعرض الرحلة' }).first().click()
  await page.waitForTimeout(1200)
  ok(await page.locator('.bus-pin.is-tracked').isVisible(), 'الحافلة المتتبعة ظاهرة على الخريطة')
  ok((await page.locator('.timeline li').count()) === 5, 'المحطات المتسلسلة معروضة')
  await shot(page, `${tag}04-trip-detail`)

  // التصفح لا يخصم المال
  await nav('المحفظة').click()
  ok((await page.locator('.balance').innerText()).startsWith(balanceBefore.toFixed(2)), 'لا خصم عند تصفح الرحلة')

  // 5) الشحن التجريبي
  await page.getByRole('button', { name: 'شحن المحفظة' }).first().click()
  await page.getByRole('radio', { name: '20 ر.س' }).click()
  await page.getByRole('button', { name: /شحن 20 ر.س تجريبيًا/ }).click()
  ok((await page.locator('.balance').innerText()).startsWith('22.00'), 'الشحن التجريبي يحدّث الرصيد إلى 22')
  await shot(page, `${tag}05-wallet-topup`)

  // 6) العودة للرحلة ومحاكاة الوصول
  await nav('الرحلات').click()
  ok(await page.locator('.trip-page').isVisible(), 'تبويب الرحلات يعيد إلى تفاصيل الرحلة الجارية')
  await page.getByRole('button', { name: /محاكاة وصول الحافلة/ }).click()
  await page.waitForTimeout(1500)
  const p1 = await page.locator('.bus-pin.is-tracked').boundingBox()
  await page.waitForTimeout(1500)
  const p2 = await page.locator('.bus-pin.is-tracked').boundingBox()
  console.log('bus', JSON.stringify(p1), JSON.stringify(p2))
  ok(p1 && p2 && Math.hypot(p1.x - p2.x, p1.y - p2.y) > 2, 'الحافلة تتحرك على الخريطة نحو المحطة (محاكاة)')
  await shot(page, `${tag}05b-bus-approaching`)
  await page.getByRole('button', { name: 'الدفع عند الصعود' }).waitFor({ timeout: 12000 })
  ok(true, 'الحافلة وصلت وظهر زر «الدفع عند الصعود»')
  await shot(page, `${tag}06-bus-arrived`)
  await page.getByRole('button', { name: 'الدفع عند الصعود' }).click()
  ok(await page.getByRole('dialog', { name: 'الدفع عند الصعود' }).isVisible(), 'نافذة الدفع تظهر')
  ok(await page.getByText('سعر افتراضي للعرض').isVisible(), 'السعر موسوم «سعر افتراضي للعرض»')
  await shot(page, `${tag}07-pay-sheet`)
  await page.getByRole('button', { name: /تأكيد الدفع التجريبي/ }).click()
  ok(await page.getByText('أنت على متن الحافلة').isVisible(), 'حالة «على متن الحافلة» بعد الدفع')
  await shot(page, `${tag}08-riding`)

  await nav('المحفظة').click()
  ok((await page.locator('.balance').innerText()).startsWith('18.00'), 'خُصمت الأجرة (4) من المحفظة: 18.00')
  ok((await page.locator('.wallet-foot').innerText()).includes('10 نقطة'), 'أُضيفت 10 نقاط بعد الدفع بالمحفظة')
  await shot(page, `${tag}09-wallet-after-pay`)

  // 7) الوصول للوجهة ثم العودة للرئيسية
  await nav('الرحلات').click()
  await page.getByRole('button', { name: /محاكاة الوصول إلى الوجهة/ }).click()
  await page.getByText('وصلت إلى وجهتك').waitFor({ timeout: 12000 })
  ok(true, 'محاكاة الوصول إلى الوجهة')
  await shot(page, `${tag}10-arrived`)
  await page.getByRole('button', { name: 'العودة إلى الرئيسية' }).click()
  ok(await page.locator('.home').isVisible(), 'العودة إلى الرئيسية بسلاسة')

  // حالة عدم وجود رحلة مباشرة
  await page.locator('select[aria-label="محطة الانطلاق"]').selectOption('emara')
  await page.getByRole('button', { name: 'تغيير' }).click()
  await page.getByRole('searchbox').fill('مطار')
  await page.locator('#dest-list').getByRole('option', { name: /مطار نجران/ }).click()
  await page.getByRole('button', { name: 'عرض الرحلات' }).click()
  ok(await page.getByText('لا توجد رحلة مباشرة في النموذج التجريبي').isVisible(), 'حالة «لا توجد رحلة مباشرة»')
  await shot(page, `${tag}11-no-direct`)

  // عرض مسار معلن ثم الرجوع
  await page.locator('.service-row').first().click()
  ok(await page.getByText('مسار توضيحي غير معتمد').isVisible(), 'وسم «مسار توضيحي غير معتمد»')
  await shot(page, `${tag}12-service`)
  await page.getByRole('button', { name: 'العودة إلى الرحلات' }).click()
  ok(await page.locator('#trips-title').isVisible(), 'زر الرجوع يعيد إلى قائمة الرحلات')

  // الدفع بالبطاقة لا يمنح نقاطًا
  await page.locator('select[aria-label="محطة الانطلاق"]').count() // noop
  await nav('الرئيسية').click()
  await page.locator('select[aria-label="محطة الانطلاق"]').selectOption('faisaliah')
  await page.getByRole('button', { name: 'تغيير' }).click()
  await page.getByRole('searchbox').fill('Ukh')
  await page.locator('#dest-list').getByRole('option', { name: /الأخدود/ }).click()
  await page.getByRole('button', { name: 'عرض الرحلات' }).click()
  await page.getByRole('button', { name: 'استعرض الرحلة' }).first().click()
  await page.getByRole('button', { name: /محاكاة وصول الحافلة/ }).click()
  await page.getByRole('button', { name: 'الدفع عند الصعود' }).waitFor({ timeout: 12000 })
  await page.getByRole('button', { name: 'الدفع عند الصعود' }).click()
  await page.getByRole('radio', { name: /بطاقة مدى/ }).click()
  await page.getByRole('button', { name: /تأكيد الدفع التجريبي/ }).click()
  await nav('المحفظة').click()
  ok((await page.locator('.balance').innerText()).startsWith('18.00'), 'الدفع بالبطاقة لا يخصم من المحفظة')
  ok((await page.locator('.wallet-foot').innerText()).includes('10 نقطة'), 'الدفع بالبطاقة لا يضيف نقاطًا')

  // حسابي + QR
  await nav('حسابي').click()
  const qr = page.locator('.share-card img')
  ok(await qr.isVisible(), 'رمز QR للتطبيق ظاهر في «جرّب التطبيق»')
  ok((await qr.evaluate((i) => i.naturalWidth)) > 0, 'ملف QR يُحمَّل بنجاح')
  ok((await page.locator('.rides, .tx-list li').count()) >= 2, 'سجل الرحلات يعرض الرحلتين')
  await page.getByRole('switch', { name: /الأسماء الإنجليزية/ }).check({ force: true })
  await shot(page, `${tag}13-profile`)

  // لا بقايا للنسخة القديمة
  const all = await body()
  for (const banned of ['الخط الأخضر', 'الخط الأحمر', 'الخط الأزرق', 'احجز', 'التذكرة النشطة', 'GPS مباشر', 'تأكيد الحجز'])
    ok(!all.includes(banned), `لا يوجد نص «${banned}»`)

  // لا تمرير أفقي
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  ok(overflow <= 1, `لا تمرير أفقي (${overflow}px)`)
  ok(errors.length === 0, `لا أخطاء في وحدة التحكم${errors.length ? ': ' + errors.join(' | ') : ''}`)
  await browser.close()
}

await run({ width: 390, height: 844 }, 'mobile', 2)
await run({ width: 1280, height: 860 }, 'desktop', 1)
console.log(failures ? `\n${failures} فشل` : '\nكل الاختبارات نجحت')
process.exit(failures ? 1 : 0)
