# Teknik Mimari

## Genel Bakış

HairForce mobil uygulaması, React Native ve Expo ekosistemi üzerine kurulu modern bir mimariye sahiptir. Uygulama, saç analizi için gerekli olan poz kontrolü, otomatik fotoğraf çekimi ve AI destekli analiz gibi karmaşık işlevleri yönetmek için modüler bir yapı kullanır.

## Teknoloji Stack'i

### Core Framework
- **React Native 0.81.5**: Cross-platform mobil geliştirme
- **Expo SDK ~54.0**: Geliştirme ve build altyapısı
- **React 19.1.0**: UI kütüphanesi
- **TypeScript 5.9.2**: Tip güvenliği

### Routing & Navigation
- **Expo Router 6.0.14**: File-based routing sistemi
- **React Navigation 7.x**: Navigasyon yönetimi

### State Management
- **Zustand 5.0.8**: Hafif ve performanslı state management
  - `poseCameraStore`: Kamera ve poz yönetimi state'i
  - `useSettingsStore`: Kullanıcı ayarları (dil, tema)
  - `usePhotoHistoryStore`: Fotoğraf geçmişi

### Sensörler & Donanım Erişimi
- **expo-sensors 15.0.7**: Gyroscope ve DeviceMotion sensörleri
- **expo-camera 17.0.9**: Kamera erişimi ve fotoğraf çekimi
- **expo-haptics 15.0.7**: Titreşim geri bildirimi
- **expo-speech 14.0.7**: Sesli rehberlik

### UI & Animasyon
- **Moti 0.30.0**: Performanslı animasyon kütüphanesi
- **expo-blur 15.0.7**: Blur efektleri
- **react-native-reanimated 4.1.1**: Native animasyonlar

### Internationalization
- **i18n-js 4.5.1**: Çoklu dil desteği
- **expo-localization 17.0.7**: Cihaz dil tespiti

### AI & Analiz
- **OpenAI GPT-4o-mini API**: Fotoğraf analizi ve doğrulama

## Mimari Katmanları

### 1. Presentation Layer (UI)

```
app/
├── (app)/              # Ana uygulama ekranları
│   ├── index.tsx       # Ana sayfa
│   ├── doctors.tsx     # Doktor listesi
│   ├── history.tsx      # Fotoğraf geçmişi
│   └── results.tsx     # Analiz sonuçları
├── camera.tsx          # Kamera ekranı (modal)
└── _layout.tsx         # Root layout ve routing yapılandırması
```

**Özellikler:**
- File-based routing ile otomatik navigasyon
- Modal sunumlar için özel ekran konfigürasyonları
- Safe area desteği ile notch/status bar uyumluluğu

### 2. Component Layer

```
components/             # Genel kullanım bileşenleri
src/components/         # Özel iş mantığı bileşenleri
├── FaceGuideOverlay.tsx    # Yüz rehberlik overlay'i
├── PoseProgress.tsx         # Poz ilerleme göstergesi
└── CollapsibleCardItem.tsx # Genel UI bileşeni
```

**Bileşen Prensipleri:**
- Atomic design yaklaşımı
- Presentational ve container component ayrımı
- Zustand store'lardan state okuma (selector pattern)

### 3. Business Logic Layer (Hooks)

```
src/hooks/
├── usePoseSequence.ts      # Poz sırası yönetimi
├── usePoseChecker.ts       # Poz açısı kontrolü
├── usePoseStability.ts     # Poz stabilitesi takibi
├── useAutoCapture.ts       # Otomatik fotoğraf çekimi
├── useGyroscope.ts         # Gyroscope sensör okuması
└── useMotion.ts            # DeviceMotion sensör okuması
```

**Hook Tasarım Prensipleri:**
- Single Responsibility: Her hook tek bir sorumluluğa sahip
- Composable: Hook'lar birbirini kullanabilir (ör: `usePoseStability` → `usePoseChecker`)
- Side Effect Yönetimi: `useEffect` ile sensör listener'ları yönetimi
- Cleanup: Memory leak önleme için proper cleanup

### 4. State Management Layer

```
src/stores/
├── poseCameraStore.ts      # Kamera ve poz state'i
├── useSettingsStore.ts     # Uygulama ayarları
└── usePhotoHistoryStore.ts # Fotoğraf geçmişi
```

**Zustand Store Yapısı:**

```typescript
interface PoseCameraState {
  // State
  currentPose: Pose;
  currentIndex: number;
  isStable: boolean;
  isCapturing: boolean;
  feedback: { message: string; type: FeedbackType };
  
  // Actions
  setStable: (isStable: boolean) => void;
  startCapture: () => void;
  nextSequence: () => void;
  // ...
}
```

**Store Prensipleri:**
- Immutable updates: State değişiklikleri immutable
- Atomic selectors: Component'ler sadece ihtiyaç duydukları state'i seçer
- Action-based updates: State değişiklikleri action metodları üzerinden

### 5. Service Layer

```
src/services/
├── i18n.ts                  # Internationalization servisi
├── photoAnalysisService.ts  # OpenAI API entegrasyonu
└── speechService.ts         # Sesli rehberlik servisi
```

**Servis Özellikleri:**
- Stateless: Servisler kendi state'lerini tutmaz
- Async operations: Tüm API çağrıları async/await
- Error handling: Try-catch blokları ile hata yönetimi
- Debouncing/Throttling: Performans optimizasyonları

### 6. Constants & Configuration

```
src/constants/
├── poseSequence.ts      # Poz sırası tanımları
├── poseTolerances.ts   # Poz açı toleransları
├── poseGuides.ts       # Poz rehberlik metinleri
├── poseNames.ts        # Poz isimleri (i18n)
└── posePrompts.ts      # AI analiz prompt'ları
```

**Konfigürasyon Yapısı:**
- Type-safe: TypeScript interface'leri ile tip güvenliği
- Centralized: Tüm konfigürasyonlar tek yerden yönetilir
- Extensible: Yeni poz eklemek kolay

## Veri Akışı (Data Flow)

### Poz Kontrolü ve Fotoğraf Çekimi Akışı

```
1. CameraScreen başlatılır
   ↓
2. usePoseSequence hook'u poz sırasını başlatır
   ↓
3. usePoseStability hook'u aktif olur
   ↓
4. usePoseChecker hook'u sensörleri dinlemeye başlar
   ↓
5. DeviceMotion/Gyroscope verileri analiz edilir
   ↓
6. Açı kontrolü yapılır → feedback store'a yazılır
   ↓
7. Poz stabil olduğunda (1 saniye) → useAutoCapture tetiklenir
   ↓
8. Fotoğraf çekilir → OpenAI API'ye gönderilir
   ↓
9. Analiz sonucu → Store güncellenir → Sonraki poza geçilir
```

### State Güncelleme Akışı

```
Component → Hook → Store Action → Store State Update → Component Re-render
```

**Örnek:**
```typescript
// Component
const feedback = usePoseCameraStore((state) => state.feedback);

// Hook
usePoseChecker(targetPose, (message) => {
  setFeedback(message); // Store action
});

// Store
setFeedback: (message) => set({ feedback: { message, type } })
```

## Performans Optimizasyonları

### 1. Sensör Verisi İşleme
- **Update Interval**: 100ms (10 Hz) - dengeli hassasiyet/performans
- **Debouncing**: Feedback mesajları için 500ms throttle
- **Ref-based checks**: Re-render'ları önlemek için ref kullanımı

### 2. State Management
- **Atomic selectors**: Sadece gerekli state parçalarını seçme
- **Immutable updates**: Zustand'ın shallow comparison optimizasyonu
- **Memoization**: `useCallback` ve `useMemo` kullanımı

### 3. Render Optimizasyonları
- **Conditional rendering**: `isActive` kontrolü ile gereksiz render'ları önleme
- **AnimatePresence**: Moti ile smooth geçişler
- **Lazy loading**: Modal ekranlar lazy load edilir

### 4. Memory Management
- **Cleanup functions**: Sensör listener'ları düzgün şekilde temizlenir
- **Ref management**: Closure trap'lerini önlemek için ref kullanımı
- **Queue management**: Speech servisinde queue yönetimi ile memory leak önleme

## Güvenlik & Hata Yönetimi

### 1. API Güvenliği
- **API Key**: Environment variable olarak yönetilmeli (şu an hardcoded - düzeltilmeli)
- **Error handling**: Network hataları için fallback mekanizmaları
- **Rate limiting**: API çağrıları için throttle mekanizması

### 2. Sensör Hata Yönetimi
- **Permission checks**: Sensör izinleri kontrol edilir
- **Availability checks**: Sensör mevcutluğu kontrol edilir
- **Graceful degradation**: Sensör yoksa uygulama çalışmaya devam eder

### 3. Fotoğraf İşleme
- **Quality control**: Base64 encoding ile kalite kontrolü
- **Error recovery**: Fotoğraf çekilemezse retry mekanizması
- **Storage management**: Fotoğraf geçmişi için storage limitleri

## Build & Deployment

### EAS Build Konfigürasyonu

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "android": { "buildType": "apk" }
    }
  }
}
```

### Platform-Specific Konfigürasyonlar
- **iOS**: Info.plist, Entitlements, PrivacyInfo.xcprivacy
- **Android**: build.gradle, proguard-rules.pro, keystore

## Gelecek Geliştirmeler

### Mimari İyileştirmeler
1. **API Key Management**: Environment variables ile güvenli yönetim
2. **Error Boundary**: React Error Boundary ile hata yakalama
3. **Analytics**: Kullanıcı davranışı takibi
4. **Offline Support**: Offline mod desteği
5. **Testing**: Unit ve integration testleri

### Performans İyileştirmeleri
1. **Image Optimization**: Fotoğraf sıkıştırma ve optimizasyon
2. **Code Splitting**: Lazy loading ile bundle size azaltma
3. **Caching**: API yanıtları için cache mekanizması
4. **Background Processing**: Arka planda fotoğraf işleme

