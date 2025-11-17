# Kullanıcı Arayüzü Tasarımı

## Genel Tasarım Felsefesi

HairForce uygulaması, kullanıcı deneyimini ön planda tutan minimal ve odaklanmış bir arayüz tasarımına sahiptir. Kamera ekranında kullanıcının dikkatini dağıtmadan rehberlik sağlamak için overlay tabanlı bir sistem kullanılır.

## Tasarım Prensipleri

### 1. Minimal Müdahale
- Kullanıcı kameraya odaklanırken gereksiz UI elementleri gizlenir
- Sadece kritik bilgiler gösterilir
- Overlay'ler yarı saydam (blur) kullanarak arka planı gizlemez

### 2. Görsel Geri Bildirim
- Renk kodlu mesajlar (başarı: yeşil, uyarı: turuncu, hata: kırmızı)
- Animasyonlu geçişler ile dikkat çekme
- Haptic feedback ile dokunsal geri bildirim

### 3. Erişilebilirlik
- Büyük, okunabilir fontlar
- Yüksek kontrast renkler
- Çoklu dil desteği (TR, EN, DE, AR, FR, IT)

## Ana UI Bileşenleri

### 1. Camera Screen Overlay Sistemi

Kamera ekranı, üç katmanlı bir overlay sistemi kullanır:

```
┌─────────────────────────────────┐
│  ÜST MESAJ ALANI               │ ← Poz rehberliği / Feedback
│  (Blur background)             │
├─────────────────────────────────┤
│                                 │
│      ┌─────────────┐            │
│      │   ELİPS     │            │ ← Yüz konumlandırma rehberi
│      │  (Dashed)   │            │
│      │     ↑↓←→    │            │ ← Yön okları (conditional)
│      └─────────────┘            │
│                                 │
├─────────────────────────────────┤
│  ALT MESAJ ALANI               │ ← Telefon hareket rehberliği
│  (Blur background)             │
└─────────────────────────────────┘
```

#### Üst Mesaj Alanı
- **Konum**: Ekranın üst %15'i
- **İçerik**: 
  - Poz rehberliği metni (varsayılan)
  - Feedback mesajları (açı yanlış, titreşim, vb.)
  - Fotoğraf çekim durumu ("Capturing...", "Analyzing...")
- **Stil**: 
  - BlurView (intensity: 70, tint: dark)
  - Yuvarlatılmış köşeler (borderRadius: 20)
  - Animasyonlu geçişler (MotiView ile fade-in/out)

#### Elips Rehberlik Alanı
- **Boyut**: Ekran genişliğinin %60'ı x yüksekliğin %40'ı
- **Stil**:
  - Dashed border (3px, beyaz)
  - Yarı saydam arka plan (rgba(255, 255, 255, 0.05))
- **Fonksiyon**: Kullanıcının yüzünü bu alana konumlandırması için görsel rehber

#### Yön Okları (Conditional)
- **Görünürlük**: `showNextPoseArrows` state'i ile kontrol edilir
- **Pozisyon**: Elips'in dışında (üst, alt, sol, sağ)
- **Animasyon**: 
  - Scale animasyonu (1.0 → 1.15)
  - Opacity animasyonu (0.7 → 1.0)
  - Sürekli loop (800ms)
- **Kullanım**: Zorlu açılara geçişte (LEFT_PROFILE, RIGHT_PROFILE, TOP, BACK) gösterilir

#### Alt Mesaj Alanı
- **Konum**: Ekranın alt %15'i
- **İçerik**: Telefon hareket rehberliği ("Hold phone vertically", "Tilt phone left", vb.)
- **Stil**: Üst mesaj alanı ile aynı

### 2. FaceGuideOverlay Bileşeni

**Dosya**: `src/components/FaceGuideOverlay.tsx`

**Özellikler:**
- Zustand store'dan state okuma (atomik selectors)
- Conditional rendering (`isActive` kontrolü)
- Dinamik renk yönetimi (feedback tipine göre)
- Animasyonlu mesaj geçişleri

**State Bağımlılıkları:**
```typescript
const isActive = usePoseCameraStore((state) => state.isActive);
const currentPose = usePoseCameraStore((state) => state.currentPose);
const feedback = usePoseCameraStore((state) => state.feedback);
const showNextPoseArrows = usePoseCameraStore((state) => state.showNextPoseArrows);
const isCapturing = usePoseCameraStore((state) => state.isCapturing);
const isStable = usePoseCameraStore((state) => state.isStable);
```

**Mesaj Öncelik Sırası:**
1. **Fotoğraf çekimi/analizi** (en yüksek öncelik)
   - "Capturing..." (yeşil) - `isStable && isCapturing`
   - "Analyzing..." (beyaz) - `isCapturing && !isStable`
2. **Feedback mesajları** (orta öncelik)
   - "Wrong Angle..." (turuncu) - `feedback.type === 'warning'`
   - "Shaking..." (kırmızı) - `feedback.type === 'error'`
3. **Poz rehberliği** (varsayılan)
   - Poz-spesifik rehberlik metni (beyaz)

### 3. PoseProgress Bileşeni

**Fonksiyon**: Poz ilerlemesini görsel olarak gösterir

**Görünüm**: 
- Progress bar veya step indicator
- "Poz 2/5" gibi metin gösterimi
- Her poz tamamlandığında güncellenir

### 4. Cancel Button

**Konum**: Sağ üst köşe (safe area içinde)
- **Stil**: 
  - Yuvarlatılmış arka plan (rgba(0, 0, 0, 0.4))
  - Beyaz X ikonu (Ionicons)
  - 40x40px boyut
- **Fonksiyon**: Kamera oturumunu iptal eder ve önceki ekrana döner

## Renk Şeması

### Feedback Renkleri

```typescript
const getFeedbackColors = (type: FeedbackType) => {
  switch (type) {
    case 'success':  return { text: '#0b1e33' };  // Koyu mavi (Capturing)
    case 'warning':  return { text: '#FF9800' };  // Turuncu (Wrong Angle)
    case 'error':    return { text: '#F44336' };  // Kırmızı (Shaking)
    case 'info':     return { text: '#FFFFFF' };   // Beyaz (Normal rehber)
    default:         return { text: '#FFFFFF' };
  }
};
```

### Arka Plan Renkleri
- **Kamera ekranı**: Siyah (#000000)
- **Overlay blur**: Dark tint (intensity: 70)
- **Elips border**: Beyaz (#FFFFFF)
- **Elips arka plan**: Yarı saydam beyaz (rgba(255, 255, 255, 0.05))

## Animasyonlar

### 1. Mesaj Geçişleri (AnimatePresence)

```typescript
<AnimatePresence>
  <MotiView
    key={topText} // Metin değiştiğinde animasyon
    from={{ opacity: 0, translateY: -10 }}
    animate={{ opacity: 1, translateY: 0 }}
    exit={{ opacity: 0, translateY: -10 }}
    transition={{ type: 'timing', duration: 250 }}
  >
    {/* Mesaj içeriği */}
  </MotiView>
</AnimatePresence>
```

**Özellikler:**
- Fade-in/out (opacity: 0 → 1)
- Hafif yukarı/aşağı hareket (translateY)
- 250ms süre (hızlı ve akıcı)

### 2. Yön Okları Animasyonu

```typescript
<MotiView
  from={{ scale: 1, opacity: 0.7 }}
  animate={{ scale: 1.15, opacity: 1 }}
  transition={{
    type: 'timing',
    duration: 800,
    loop: true,
    repeatReverse: true,
  }}
>
  <Text>↑</Text>
</MotiView>
```

**Özellikler:**
- Pulse efekti (scale: 1.0 → 1.15)
- Opacity değişimi (0.7 → 1.0)
- Sürekli loop (reverse ile)
- 800ms süre (dikkat çekici ama rahatsız edici değil)

### 3. Haptic Feedback

**Kullanım Senaryoları:**
- **Success**: Fotoğraf çekildiğinde (NotificationFeedbackType.Success)
- **Error/Warning**: Yanlış açı veya titreşim tespit edildiğinde (NotificationFeedbackType.Error)
- **Impact**: Poz geçişlerinde (ImpactFeedbackStyle.Light)

**Throttling**: 500ms (saniyede maksimum 2 titreşim)

## Responsive Tasarım

### Ekran Boyutları

```typescript
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ELLIPSE_WIDTH = SCREEN_WIDTH * 0.6;   // Ekran genişliğinin %60'ı
const ELLIPSE_HEIGHT = SCREEN_HEIGHT * 0.4;  // Ekran yüksekliğinin %40'ı
```

**Avantajlar:**
- Tüm cihaz boyutlarında uyumlu çalışır
- Tablet ve telefon desteği
- Landscape/Portrait mod desteği

### Safe Area Yönetimi

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Cancel button konumu
cancelButton: {
  top: 60,  // Notch/status bar'ın altında
  right: 20,
}
```

**Özellikler:**
- iPhone notch desteği
- Android status bar uyumluluğu
- Bottom navigation bar uyumluluğu

## Internationalization (i18n)

### Dil Desteği
- Türkçe (TR)
- İngilizce (EN)
- Almanca (DE)
- Arapça (AR) - RTL desteği
- Fransızca (FR)
- İtalyanca (IT)

### RTL (Right-to-Left) Desteği

```typescript
// app/_layout.tsx
const isRTL = currentLanguage.startsWith('ar');
I18nManager.forceRTL(isRTL);
I18nManager.allowRTL(isRTL);
```

**Arapça için:**
- UI elementleri otomatik olarak sağdan sola hizalanır
- Oklar ve yönlendirmeler tersine çevrilir

## Erişilebilirlik

### Font Boyutları
- **Rehberlik metinleri**: 18px, font-weight: 600
- **Oklar**: 36-48px (büyük ve görünür)
- **Progress göstergesi**: 16px

### Kontrast Oranları
- Beyaz metin + koyu blur arka plan: Yüksek kontrast
- Renkli feedback mesajları: WCAG AA uyumlu

### Dokunsal Geri Bildirim
- Haptic feedback ile görme engelli kullanıcılar için destek
- Sesli rehberlik ile görsel olmayan geri bildirim

## Kullanıcı Deneyimi (UX) Özellikleri

### 1. Görsel Geri Bildirim Hiyerarşisi
1. **Kritik**: Fotoğraf çekimi durumu (yeşil/koyu mavi)
2. **Önemli**: Yanlış açı uyarıları (turuncu)
3. **Bilgilendirici**: Normal rehberlik (beyaz)

### 2. Dikkat Dağıtmayan Tasarım
- Overlay'ler yarı saydam (kamera görüntüsü görünür)
- Gereksiz UI elementleri gizlenir
- Sadece aktif poz için rehberlik gösterilir

### 3. Anlık Geri Bildirim
- Sensör verileri 100ms'de bir güncellenir
- Feedback mesajları anında gösterilir
- Animasyonlar akıcı (60 FPS hedefi)

## Gelecek UI İyileştirmeleri

### Önerilen Geliştirmeler
1. **Dark/Light Mode**: Tema desteği
2. **Customizable Overlay**: Kullanıcı tercihlerine göre overlay şeffaflığı
3. **Accessibility Settings**: Font boyutu, kontrast ayarları
4. **Tutorial Mode**: İlk kullanım için interaktif rehber
5. **Progress Visualization**: Daha detaylı ilerleme göstergesi

