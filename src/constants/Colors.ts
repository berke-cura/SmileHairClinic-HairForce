// src/constants/Colors.ts
// Ana renk paleti - Smile Hair Clinic marka kimliği (Karanlık Tema)

const primary = '#0b1e33'; // Ana Renk (Koyu Lacivert)
const accent = '#007AFF';  // Vurgu (Mavi)
const success = '#4CAF50'; // Yeşil
const warning = '#FFC107'; // Sarı (Uyarılar)
const error = '#DC3545';   // Kırmızı (Hatalar)

const textLight = '#FFFFFF'; // Ana Metin Rengi (Beyaz)
const textSecondary = '#B0B0B0'; // İkincil Metin Rengi (Gri)
const textTertiary = '#999999'; // Üçüncül Metin
const cardBackground = '#1c2e45'; // Kart Arka Planı (Hafif Açık Lacivert)
const border = '#3a4a5e'; // Kenarlıklar (Koyu)
const borderLight = '#3a4a5e'; // Açık kenarlıklar
const placeholder = '#B0B0B0'; // Placeholder metin

const shadowColor = '#000000'; // Gölgeler için

export default {
  light: {
    primary,
    accent,
    success,
    warning,
    error,
    // TEMEL DEĞİŞİKLİKLER:
    background: primary,          // ARKA PLAN ARTIK KOYU LACİVERT
    cardBackground: cardBackground, // KARTLAR AÇIK LACİVERT
    backgroundDark: cardBackground, // Daha Koyu Arka Plan (kartlar vb. için)
    text: textLight,              // METİNLER ARTIK BEYAZ
    textLight: textLight,         // (Bu zaten beyazdı)
    textSecondary: textSecondary, // İKİNCİL METİN ARTIK AÇIK GRİ
    textTertiary,
    border: border,
    borderLight,
    placeholder: placeholder,
    shadowColor,
  },
  // dark: { ...gerekirse dark tema }
};

