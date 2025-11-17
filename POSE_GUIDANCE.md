# Zorlu Açılardaki Kılavuzlama Mekanizması

## Genel Bakış

HairForce uygulaması, saç analizi için gerekli olan 5 farklı açıdan (FRONT, LEFT_PROFILE, RIGHT_PROFILE, TOP, BACK) fotoğraf çekmek için gelişmiş bir poz kontrolü ve kılavuzlama sistemi kullanır. Bu sistem, sensör verilerini analiz ederek kullanıcıya gerçek zamanlı geri bildirim sağlar ve doğru açıda stabil kalındığında otomatik olarak fotoğraf çeker.

## Poz Sırası

### Tanımlı Pozlar

```typescript
const POSE_SEQUENCE: Pose[] = [
  'FRONT',           // 1. Ön görünüm
  'LEFT_PROFILE',    // 2. Sol profil
  'RIGHT_PROFILE',   // 3. Sağ profil
  'TOP',             // 4. Üstten görünüm
  'BACK'             // 5. Arkadan görünüm
];
```

**Sıralama Mantığı:**
- En kolay pozlardan zora doğru ilerler
- FRONT: En doğal poz (başlangıç)
- LEFT/RIGHT_PROFILE: Orta zorluk (yön değişikliği gerektirir)
- TOP: Zor (telefonu yukarı kaldırma)
- BACK: En zor (görsel geri bildirim yok)

## Sensör Sistemi

### 1. DeviceMotion (Beta & Gamma Açıları)

**Beta (β) Açısı:**
- **Eksen**: Front-back tilt (öne-arkaya eğim)
- **Aralık**: -180° ile +180° arası
- **Kullanım**: Telefonun dikey eksende eğimini ölçer
  - β = 90°: Telefon dikey (normal tutuş)
  - β > 90°: Telefon geriye eğik
  - β < 90°: Telefon öne eğik

**Gamma (γ) Açısı:**
- **Eksen**: Left-right tilt (sağa-sola eğim)
- **Aralık**: -180° ile +180° arası
- **Kullanım**: Telefonun yatay eksende eğimini ölçer
  - γ = 0°: Telefon düz (normal tutuş)
  - γ > 0°: Telefon sağa eğik
  - γ < 0°: Telefon sola eğik

**Update Interval**: 100ms (10 Hz) - dengeli hassasiyet/performans

### 2. Gyroscope (Titreşim Tespiti)

**Kullanım**: Cihazın titreşim/sallanma durumunu tespit eder

**Eşik Değeri**: 1.5 rad/s (her eksende: x, y, z)

**Debounce**: 200ms (titreşim durumu güncellemesi için)

**Fonksiyon**: 
- Titreşim tespit edildiğinde açı kontrolü devre dışı bırakılır
- "Shaking..." mesajı gösterilir
- Stabilite sayacı sıfırlanır

## Poz Toleransları

### Tolerans Tanımları

Her poz için hedef açılar ve tolerans değerleri:

```typescript
const TOLERANCES: Record<Pose, PoseTolerance> = {
  FRONT: {
    betaTarget: 90,   // Dikey tutuş
    betaTol: 40,      // ±40° tolerans
    gammaTarget: 0,   // Düz (sağa-sola eğim yok)
    gammaTol: 60,      // ±60° tolerans
  },
  LEFT_PROFILE: {
    betaTarget: 90,   // Dikey tutuş
    betaTol: 50,       // ±50° tolerans
    gammaTarget: 0,    // Sola dönük (negatif gamma)
    gammaTol: 60,      // ±60° tolerans
  },
  RIGHT_PROFILE: {
    betaTarget: 90,   // Dikey tutuş
    betaTol: 50,       // ±50° tolerans
    gammaTarget: 0,    // Sağa dönük (pozitif gamma)
    gammaTol: 60,      // ±60° tolerans
  },
  TOP: {
    betaTarget: 0,     // Yatay (telefon yukarı bakıyor)
    betaTol: 60,       // ±60° tolerans
    gammaTarget: 180,  // 180° dönüş
    gammaTol: 60,      // ±60° tolerans
  },
  BACK: {
    betaTarget: 0,     // Yatay
    betaTol: 50,       // ±50° tolerans
    gammaTarget: 140,  // Arkaya dönük
    gammaTol: 50,      // ±50° tolerans
  },
};
```

### Tolerans Mantığı

**Açı Farkı Hesaplama:**
```typescript
const angleDiff = (angle1: number, angle2: number): number => {
  // Wrap-around desteği ile minimum açı farkı
  const a1 = normalizeAngle(angle1);
  const a2 = normalizeAngle(angle2);
  let diff = Math.abs(a1 - a2);
  if (diff > 180) diff = 360 - diff; // Kısa yolu seç
  return diff;
};
```

**Kontrol Kriterleri:**
1. **Beta kontrolü**: `betaDiff <= betaTol`
2. **Gamma kontrolü**: `gammaDiff <= gammaTol`
3. **Her iki kontrol de geçmeli**: `betaCheck && gammaCheck`

**Özel Durumlar:**
- **TOP ve BACK pozları**: ±180° karşılıkları da kabul edilir (cihaz ters çevrilebilir)
- **FRONT poz**: Toplam eğim kontrolü (`maxTotalTilt`) ile ekstra güvenlik

## Poz Kontrolü Akışı

### 1. usePoseChecker Hook'u

**Fonksiyon**: Sensör verilerini okuyup açı kontrolü yapar

**Akış:**
```
1. DeviceMotion listener kurulur (100ms interval)
   ↓
2. Her veri geldiğinde:
   a. Beta ve Gamma açıları normalize edilir
   b. Hedef açılarla karşılaştırılır
   c. Tolerans içindeyse → "Stay Stable" mesajı
   d. Tolerans dışındaysa → Yönlendirme mesajı ("Move up/down/left/right")
   ↓
3. Gyroscope listener (titreşim kontrolü)
   a. X, Y, Z eksenlerinde 1.5 rad/s'den fazla hareket varsa
   b. "Shaking..." mesajı gönderilir
   c. Açı kontrolü devre dışı bırakılır
```

**Yönlendirme Mantığı:**
```typescript
// Beta (front-back) kontrolü
if (betaDiff > tolerance.betaTol) {
  if (betaDiffRaw > 0) {
    directionMessage += 'down ';  // Cihaz geriye eğik → öne eğmeli
  } else {
    directionMessage += 'up ';    // Cihaz öne eğik → geriye eğmeli
  }
}

// Gamma (left-right) kontrolü
if (gammaDiff > tolerance.gammaTol) {
  if (gammaDiffRaw > 0) {
    directionMessage += 'left ';  // Cihaz sağa eğik → sola eğmeli
  } else {
    directionMessage += 'right ';  // Cihaz sola eğik → sağa eğmeli
  }
}
```

### 2. usePoseStability Hook'u

**Fonksiyon**: Pozun belirli süre stabil kalıp kalmadığını kontrol eder

**Stabilite Kriterleri:**
- Doğru açıda olmalı ("Stay Stable" mesajı gelmeli)
- 1 saniye (1000ms) boyunca stabil kalmalı
- Titreşim olmamalı
- Analiz yapılmamalı

**Akış:**
```
1. usePoseChecker'dan "Stay Stable" mesajı gelir
   ↓
2. İlk stabil an → zamanlayıcı başlar (stableStartTime)
   ↓
3. Sürekli "Stay Stable" mesajı gelirse:
   a. Süre kontrol edilir (now - stableStartTime)
   b. 1000ms geçtiyse → onStable(true) çağrılır
   ↓
4. "Stay Stable" dışında mesaj gelirse:
   a. Zamanlayıcı sıfırlanır
   b. onStable(false) çağrılır
```

**Özellikler:**
- Debouncing: Kısa süreli stabilite değişiklikleri yok sayılır
- Reset mekanizması: Poz değiştiğinde veya hook devre dışı bırakıldığında sıfırlanır

### 3. useAutoCapture Hook'u

**Fonksiyon**: Poz stabil olduğunda otomatik fotoğraf çeker

**Tetikleme Koşulları:**
```typescript
if (
  isStable &&                    // Poz stabil
  !isCapturing &&                // Zaten çekim yapılmıyor
  !isAnalyzing &&                // Analiz yapılmıyor
  cameraRef.current &&           // Kamera hazır
  !isCurrentlySpeaking()         // Sesli rehberlik konuşmuyor
) {
  capturePhoto();
}
```

**Fotoğraf Çekim Süreci:**
```
1. Haptic feedback (Success + Medium impact)
   ↓
2. Fotoğraf çekilir (quality: 0.5, base64: true)
   ↓
3. onPhotoCaptured callback → Store'a kaydedilir
   ↓
4. OpenAI API'ye gönderilir (analyzePhoto)
   ↓
5. Analiz sonucu:
   a. confirmed: true → Sonraki poza geç
   b. confirmed: false → Feedback göster, tekrar dene
```

**Throttling:**
- Minimum 3 saniye (3000ms) fotoğraflar arası bekleme
- İlk fotoğraf için throttle yok (isFirstPhotoRef)

## Zorlu Açılar için Özel Mekanizmalar

### 1. LEFT_PROFILE ve RIGHT_PROFILE

**Zorluk**: Kullanıcı telefonu yan tarafa çevirmeli, görsel geri bildirim sınırlı

**Çözüm:**
- **Yön Okları**: Elips'in yanında animasyonlu oklar gösterilir
  - LEFT_PROFILE: Sağ ok (→)
  - RIGHT_PROFILE: Sol ok (←)
- **Sesli Rehberlik**: "Turn your head to the left/right" mesajı
- **Geniş Tolerans**: ±60° gamma toleransı (daha esnek)

**Geçiş Mekanizması:**
```
1. Önceki poz tamamlandı
   ↓
2. "Photo Saved" mesajı (sesli)
   ↓
3. Oklar gösterilir (showNextPoseArrows = true)
   ↓
4. "Now turn your head to the left" mesajı (sesli)
   ↓
5. 2 saniye bekleme
   ↓
6. Yeni poz aktif → Açı kontrolü başlar
```

### 2. TOP Pozu

**Zorluk**: Telefonu yukarı kaldırmak, kullanıcı yukarı bakmalı

**Çözüm:**
- **Alt Ok**: Elips'in altında animasyonlu ok (↓)
- **Sesli Rehberlik**: "Look up and hold phone above your head"
- **Geniş Tolerans**: ±60° beta ve gamma toleransı
- **±180° Desteği**: Cihaz ters çevrilebilir (alternatif açılar kabul edilir)

**Özel Kontrol:**
```typescript
if (targetPose === 'TOP') {
  // ±180° karşılıklarını da kabul et
  const betaAlt = angleDiff(betaDeg, tolerance.betaTarget + 180);
  const betaAlt2 = angleDiff(betaDeg, tolerance.betaTarget - 180);
  // ...
}
```

### 3. BACK Pozu

**Zorluk**: En zor poz - kullanıcı telefonu göremez, görsel geri bildirim yok

**Çözüm:**
- **Alt Ok**: Elips'in altında animasyonlu ok (↓)
- **Sesli Rehberlik**: "Turn around, hold phone behind your head"
- **Geniş Tolerans**: ±50° beta ve gamma toleransı
- **±180° Desteği**: Cihaz ters çevrilebilir
- **Ekstra Sesli Feedback**: Açı yanlışsa daha detaylı yönlendirme

**Özel Durum:**
- Görsel overlay minimal (sadece sesli rehberlik)
- AI analiz daha toleranslı (açı biraz yanlış olsa bile kabul edilebilir)

## Geri Bildirim Sistemi

### Feedback Tipleri

1. **Success (✅)**
   - Mesaj: "Stay Stable" veya "Capturing..."
   - Renk: Koyu mavi (#0b1e33)
   - Haptic: Success notification

2. **Warning (⚠️)**
   - Mesaj: "Wrong Angle - Move up/down/left/right"
   - Renk: Turuncu (#FF9800)
   - Haptic: Error notification
   - Yön Okları: Gösterilir (showNextPoseArrows = true)

3. **Error (🔄)**
   - Mesaj: "Shaking - Hold still"
   - Renk: Kırmızı (#F44336)
   - Haptic: Error notification
   - Açı Kontrolü: Devre dışı (titreşim bitene kadar)

4. **Info (ℹ️)**
   - Mesaj: Normal poz rehberliği
   - Renk: Beyaz (#FFFFFF)
   - Haptic: Yok

### Feedback Throttling

**Haptic Feedback:**
- Minimum 500ms aralık (saniyede maksimum 2 titreşim)
- Aynı mesaj tekrarı: 5 saniye debounce

**Görsel Feedback:**
- Anında gösterilir (throttle yok)
- Animasyonlu geçişler (250ms fade)

## Sesli Rehberlik Sistemi

### Konuşma Öncelikleri

1. **High Priority**: Kritik mesajlar (geçişler, hatalar)
   - Mevcut konuşmayı keser
   - Kuyruğu temizler
   - Hemen oynatılır

2. **Normal Priority**: Bilgilendirici mesajlar
   - Kuyruğa eklenir
   - Sırayla oynatılır

### Konuşma Senaryoları

**Başlangıç:**
```
1. "Welcome to HairForce. We'll guide you through 5 photos."
2. "Let's start with the front view."
```

**Poz Geçişleri:**
```
1. "Photo saved."
2. [2 saniye bekleme]
3. "Now turn your head to the left." (veya ilgili yön)
4. [2 saniye bekleme]
5. Yeni poz aktif
```

**Hata Durumları:**
```
1. AI analiz başarısız → "Photo not suitable. [Feedback]"
2. Titreşim tespit edildi → "Shaking. Hold still."
3. Yanlış açı → "Wrong angle. Move [direction]."
```

### Konuşma Yönetimi

**Debouncing:**
- Aynı mesaj: 5 saniye içinde tekrar edilmez
- Normal priority: 2 saniye throttle

**Queue Management:**
- Sıralı işleme (bir mesaj bitmeden diğeri başlamaz)
- 300ms mesajlar arası gecikme
- Hata durumunda queue temizlenir

**Service Control:**
- `enableSpeech()`: Yeni oturum başladığında
- `stopAllSpeech()`: Oturum iptal edildiğinde
- `isCurrentlySpeaking()`: Konuşma durumu kontrolü

## AI Fotoğraf Analizi

### OpenAI Entegrasyonu

**Model**: GPT-4o-mini (düşük maliyet, yeterli kalite)

**Prompt Yapısı:**
```
[Poz-spesifik kriterler]
+ 
"Evaluate this photo according to the above criteria.
IMPORTANT: Unless the photo quality is very low or angle is completely wrong, accept as VALID.
Only mark as INVALID for: very blurry, very dark, completely wrong angle, face/hair not visible."
```

**Response Format:**
```json
{
  "confirmed": boolean,
  "feedback": string (optional, max 15 words)
}
```

### Analiz Kriterleri

**Kabul Edilir:**
- Küçük gölgeler
- Hafif bulanıklık
- Açı biraz yanlış (tolerans içinde)
- Normal aydınlatma sorunları

**Reddedilir:**
- Çok bulanık (yüz/saç görünmüyor)
- Çok karanlık (hiçbir şey görünmüyor)
- Tamamen yanlış açı (örn: BACK için FRONT fotoğrafı)
- Yüz veya saç hiç görünmüyor

### Analiz Akışı

```
1. Fotoğraf base64 formatında alınır
   ↓
2. OpenAI API'ye gönderilir (low detail, quality: 0.5)
   ↓
3. JSON response parse edilir
   ↓
4. confirmed: true → Sonraki poza geç
   ↓
5. confirmed: false → Feedback göster, tekrar dene
```

## Hata Yönetimi ve Kurtarma

### Sensör Hataları

**Permission Denied:**
- Kullanıcıya izin istenir
- İzin verilmezse uygulama çalışmaz (graceful degradation)

**Sensör Mevcut Değil:**
- Uyarı loglanır
- Uygulama çalışmaya devam eder (sadece ilgili özellik devre dışı)

### API Hataları

**Network Error:**
- Retry mekanizması (3 deneme)
- Hata mesajı gösterilir
- Fotoğraf geçersiz sayılır, tekrar çekilir

**API Rate Limit:**
- Throttling ile önleme
- Hata durumunda kullanıcıya bilgi verilir

### Fotoğraf Çekim Hataları

**Kamera Hatası:**
- Hata loglanır
- Kullanıcıya bilgi verilir
- Tekrar deneme imkanı

**Storage Hatası:**
- Fotoğraf kaydedilemezse uyarı
- Geçmişe eklenmez
- Analiz yapılmaz

## Performans Optimizasyonları

### 1. Sensör Verisi İşleme
- **Update Interval**: 100ms (10 Hz) - dengeli hassasiyet/performans
- **Debouncing**: Feedback mesajları için 500ms throttle
- **Ref-based checks**: Re-render'ları önlemek için ref kullanımı

### 2. State Management
- **Atomic selectors**: Sadece gerekli state parçalarını seçme
- **Immutable updates**: Zustand'ın shallow comparison optimizasyonu
- **Memoization**: `useCallback` ve `useMemo` kullanımı

### 3. Memory Management
- **Cleanup functions**: Sensör listener'ları düzgün şekilde temizlenir
- **Ref management**: Closure trap'lerini önlemek için ref kullanımı
- **Queue management**: Speech servisinde queue yönetimi ile memory leak önleme

## Gelecek Geliştirmeler

### Önerilen İyileştirmeler

1. **Machine Learning Model**: Cihaz üzerinde çalışan ML modeli (offline)
2. **Adaptive Tolerances**: Kullanıcı deneyimine göre tolerans ayarlama
3. **Pose Prediction**: Bir sonraki poz için önceden hazırlık
4. **Multi-user Support**: Farklı kullanıcılar için farklı toleranslar
5. **Analytics**: Poz başarı oranları ve iyileştirme önerileri

