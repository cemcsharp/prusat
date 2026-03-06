export const BIRIMLER = [
    'ADET',
    'KG',
    'MT',
    'LT',
    'TON',
    'PAKET',
    'KOLİ',
    'TAKIM',
    'SET',
    'PALET',
    'RULO',
    'TORBA'
] as const;

export type Birim = typeof BIRIMLER[number];
