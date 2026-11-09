// حافلات تجريبية لكل مسار. phase: موضع البداية على الدورة الكاملة (ذهاب + عودة) من 0 إلى 1.
// الأرقام توضيحية ولا تمثل أسطولًا يعمل فعليًا.
// المواضع مختارة لتكون أول حافلة قريبة من «العزام مول» عند بدء العرض.

export const VEHICLES = [
  { id: 'NT-01A', serviceId: 's01', phase: 0.12 },
  { id: 'NT-01B', serviceId: 's01', phase: 0.45 },
  { id: 'NT-01C', serviceId: 's01', phase: 0.78 },
  { id: 'NT-02A', serviceId: 's02', phase: 0.965 },
  { id: 'NT-02B', serviceId: 's02', phase: 0.215 },
  { id: 'NT-02C', serviceId: 's02', phase: 0.465 },
  { id: 'NT-02D', serviceId: 's02', phase: 0.715 },
  { id: 'NT-03A', serviceId: 's03', phase: 0.2 },
  { id: 'NT-03B', serviceId: 's03', phase: 0.7 },
]
