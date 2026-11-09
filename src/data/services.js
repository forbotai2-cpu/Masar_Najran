// المسارات (الخدمات) المعلنة: تسلسل محطات ثابتة.
// الحافلة ترددية: تسير من أول محطة إلى آخر محطة ثم تعود بالعكس.
// يمكن للمشغل تعديل تسلسل المحطات هنا بين فترات التشغيل؛
// لا يُعاد توجيه الحافلة آنيًا بطلب راكب منفرد.
// بعد تعديل التسلسل: شغّل `npm run geometry` لإعادة رسم المسار على شبكة الطرق.

export const SERVICES = [
  {
    id: 's01',
    number: '01',
    name: 'مسار طريق الملك عبدالعزيز',
    description: 'يربط قصر الإمارة غربًا بالأسواق والمستشفى على المحور الرئيسي',
    stops: ['emara', 'faisaliah', 'azzam', 'dhafer', 'royal'],
  },
  {
    id: 's02',
    number: '02',
    name: 'المسار الجامعي التجريبي',
    description: 'من وسط المدينة إلى المطار وجامعة نجران',
    stops: ['azzam', 'dhafer', 'royal', 'airport', 'university'],
  },
  {
    id: 's03',
    number: '03',
    name: 'مسار الأخدود التجريبي',
    description: 'من وسط المدينة وسوق الفيصلية إلى منطقة الأخدود الأثرية',
    stops: ['azzam', 'faisaliah', 'ukhdood'],
  },
]

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]))
