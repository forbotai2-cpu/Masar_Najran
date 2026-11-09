// محطات ثابتة على الخريطة.
// الإحداثيات مأخوذة من OpenStreetMap (Nominatim) لمعالم قائمة في نجران،
// لكن موقع المحطة نفسها «موقع توضيحي مقترح» وليس محطة رسمية معتمدة.
// لتعديل محطة: غيّر الاسم أو الإحداثيات هنا فقط، ولا حاجة لتعديل الشاشات.

export const STATIONS = [
  {
    id: 'emara',
    name: 'قصر الإمارة التاريخي',
    nameEn: 'Historic Emirate Palace',
    position: [17.49011, 44.13182],
    area: 'أبا السعود',
    access: 'رصيف انتظار مظلّل (افتراضي)',
  },
  {
    id: 'faisaliah',
    name: 'سوق الفيصلية',
    nameEn: 'Al-Faisaliah Market',
    position: [17.52588, 44.20105],
    area: 'الفيصلية',
    access: 'قريبة من مداخل السوق (افتراضي)',
  },
  {
    id: 'azzam',
    name: 'العزام مول',
    nameEn: 'Al-Azzam Mall',
    position: [17.53925, 44.21426],
    area: 'طريق الملك عبدالعزيز',
    access: 'منحدر للكراسي المتحركة (افتراضي)',
  },
  {
    id: 'dhafer',
    name: 'مستشفى الظافر',
    nameEn: 'Al-Dhafer Hospital',
    position: [17.54461, 44.23312],
    area: 'الخالدية',
    access: 'أقرب نقطة لبوابة الطوارئ (افتراضي)',
  },
  {
    id: 'royal',
    name: 'نجران رويال مول',
    nameEn: 'Najran Royal Mall',
    position: [17.55017, 44.25779],
    area: 'الأمير مشعل',
    access: 'رصيف انتظار مظلّل (افتراضي)',
  },
  {
    id: 'airport',
    name: 'مطار نجران الإقليمي',
    nameEn: 'Najran Regional Airport',
    position: [17.61029, 44.41514],
    area: 'المطار',
    access: 'أمام صالة القدوم (افتراضي)',
  },
  {
    id: 'university',
    name: 'جامعة نجران',
    nameEn: 'Najran University',
    position: [17.63298, 44.53344],
    area: 'الجامعة',
    access: 'قرب المبنى الإداري (افتراضي)',
  },
  {
    id: 'ukhdood',
    name: 'منطقة الأخدود الأثرية',
    nameEn: 'Al-Ukhdood Archaeological Site',
    position: [17.4793, 44.18126],
    area: 'الأخدود',
    access: 'موقف الزوار (افتراضي)',
  },
]

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((s) => [s.id, s]))

// مركز العرض الافتراضي إذا لم يمنح المستخدم إذن الموقع
export const DEMO_CENTER = [17.54, 44.23]
export const DEFAULT_ORIGIN_ID = 'azzam'

// نطاق تقريبي لنجران لقبول موقع المستخدم
export const NAJRAN_BOUNDS = { south: 17.38, north: 17.72, west: 44.0, east: 44.62 }
