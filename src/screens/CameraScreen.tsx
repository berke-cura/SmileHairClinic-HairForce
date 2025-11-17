import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FaceGuideOverlay } from '../components/FaceGuideOverlay';
import { PoseProgress } from '../components/PoseProgress';
import { POSE_SEQUENCE } from '../constants/poseSequence';
import { useAutoCapture } from '../hooks/useAutoCapture';
import { usePoseSequence } from '../hooks/usePoseSequence';
import { usePoseStability } from '../hooks/usePoseStability';
import { t } from '../services/i18n';
import { enableSpeech, isCurrentlySpeaking, speak, waitForSpeechToFinish } from '../services/speechService';
import { usePoseCameraStore } from '../stores/poseCameraStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [analysisFeedback, setAnalysisFeedback] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const isInitialized = React.useRef<boolean>(false);
  const isCapturingRef = React.useRef<boolean>(false); // Fotoğraf çekim durumunu takip et
  const lastPhotoCaptureTime = React.useRef<number>(0); // Son fotoğraf çekilme zamanı
  const MIN_PHOTO_INTERVAL = 3000; // Fotoğraflar arası minimum 3 saniye
  const isFirstPhotoRef = React.useRef<boolean>(true); // İlk fotoğraf kontrolü

  // Store'dan state ve metodları çek
  const store = usePoseCameraStore();
  const isStable = store.isStable;
  const setStable = store.setStable;
  const setFeedback = store.setFeedback;
  const clearFeedback = store.clearFeedback;
  const setActive = store.setActive;
  const setShowNextPoseArrows = store.setShowNextPoseArrows;
  const startCapture = store.startCapture;
  const endCapture = store.endCapture;
  const addPhoto = store.addPhoto;
  const resetSequence = store.resetSequence;

  // Poz sırası yönetimi
  const poseSequence = usePoseSequence();

  // Store'dan mevcut dili al
  const currentLanguage = useSettingsStore((state) => state.language);

  // onFeedback callback'ini useCallback ile sabitle (sonsuz döngüyü önlemek için)
  const onFeedback = useCallback(
    (message: string) => {
      // *** 1. YENİ KONTROL: Poz sırası aktif değilse feedback gönderme ***
      // Poz sırası (sequence) henüz aktif değilse (yani hoşgeldin mesajı bitmediyse)
      // HİÇBİR feedback (ve dolayısıyla titreşim) tetikleme.
      if (!poseSequence.isActive) {
        return;
      }
      // ************************************************************

      // *** 2. KONTROL: Sesli okuma sırasında titreşimi engelleme ***
      // Eğer sesli asistan şu anda konuşuyorsa (örn: "Photo saved..."),
      // YENİ bir görsel veya haptik (titreşim) geri bildirim GÖNDERME.
      if (isCurrentlySpeaking()) {
        return;
      }
      // ************************************************************

      // Poz değişikliği sırasında feedback verme
      if (isTransitioning || isAnalyzing) {
        return;
      }

      // Store'a feedback gönder (tip otomatik çıkarılacak)
      setFeedback(message);

      // Sesli feedback kaldırıldı - sadece görsel feedback
    },
    [poseSequence.isActive, isTransitioning, isAnalyzing, setFeedback]
  );

  // onStable callback'ini useCallback ile sabitle (sonsuz döngüyü önlemek için)
  const onStable = useCallback(
    (stable: boolean) => {
      // Analiz veya geçiş sırasında stable state'ini güncelleme
      if (isAnalyzing || isTransitioning) {
        return;
      }

      // Store'a stable state'ini gönder
      setStable(stable);
    },
    [isAnalyzing, isTransitioning, setStable]
  );

  // Poz stabilitesi kontrolü
  usePoseStability({
    targetPose: poseSequence.currentPose,
    onFeedback,
    onStable,
    stableDuration: 1000, // 1 saniye stable olunca fotoğraf çek (500ms'den artırıldı)
    // *** GÜNCELLEME: isEnabled MANTIĞI ***
    // Sadece aktif, analiz yapılmıyor, geçiş yok ve konuşma yoksa çalış
    isEnabled:
      poseSequence.isActive &&
      !isAnalyzing &&
      !isTransitioning &&
      !isCurrentlySpeaking(),
  });

  // Otomatik fotoğraf çekimi
  const autoCapture = useAutoCapture({
    cameraRef,
    isStable:
      isStable &&
      poseSequence.isActive &&
      !isAnalyzing &&
      !isTransitioning &&
      !isCurrentlySpeaking() &&
      (isFirstPhotoRef.current ||
        Date.now() - lastPhotoCaptureTime.current >= MIN_PHOTO_INTERVAL), // Analiz, geçiş veya ses oynarken çekme
    currentPose: poseSequence.currentPose,
    isAnalyzing: isAnalyzing || isTransitioning, // Analiz veya geçiş durumunu hook'a geçir
    onPhotoStart: () => {
      isCapturingRef.current = true; // Fotoğraf çekimi başladı
      startCapture(); // Store'a çekim başladığını bildir
    },
    onPhotoCaptured: (uri, pose) => {
      console.log(`Photo captured for ${pose}:`, uri);
      
      // Fotoğrafı store'a kaydet
      addPhoto(uri, pose);
      
      setIsAnalyzing(true);
      setAnalysisFeedback(null);
      isCapturingRef.current = false;
      endCapture();
      lastPhotoCaptureTime.current = Date.now();
      isFirstPhotoRef.current = false;
    },
    onPhotoAnalyzed: async (result, pose) => {
      setIsAnalyzing(false);
      
      if (result.confirmed) {
        // Fotoğraf geçerli, sonraki poza geç
        setAnalysisFeedback(null);
        
        if (!poseSequence.isLastPose) {
          // *** ADIM 3: DÜZELTİLMİŞ GEÇİŞ MANTIĞI ***
          
          // 1. Geçişi BAŞLAT (Stability/Capture'ı hemen durdur)
          setIsTransitioning(true);
          setStable(false);
          clearFeedback();
          
          // 2. BİR SONRAKİ POZU AL (next() çağrılmadan önce)
          const nextPoseIndex = poseSequence.currentIndex + 1;
          const nextPose = POSE_SEQUENCE[nextPoseIndex];
          
          // 3. "Photo Saved" de. Bu sırada OKLAR GÖRÜNMEZ.
          await speak(t('camera.photoSaved'), 'high', currentLanguage);
          await waitForSpeechToFinish();
          
          // 4. Store'u BİR SONRAKİ POZA GÜNCELLE (Bu, showNextPoseArrows'u false yapar)
          poseSequence.next();
          
          // 5. BİR SONRAKİ POZ İÇİN GEÇİŞ MESAJINI OLUŞTUR (nextPose'u kullan)
          let transitionMessage = '';
          if (nextPose === 'TOP') {
            transitionMessage = t('camera.transitionTop');
          } else if (nextPose === 'LEFT_PROFILE') {
            transitionMessage = t('camera.transitionLeftProfile');
          } else if (nextPose === 'RIGHT_PROFILE') {
            transitionMessage = t('camera.transitionRightProfile');
          } else if (nextPose === 'BACK') {
            transitionMessage = t('camera.transitionBack');
          } else if (nextPose === 'FRONT') {
            transitionMessage = t('camera.transitionFront');
          } else {
            const nextPoseName = t(`poseNames.${nextPose}`) || 'next pose';
            transitionMessage = t('camera.transitionGeneric', { poseName: nextPoseName });
          }
          
          // 6. OKLARI GÖSTER ve GEÇİŞ KONUŞMASINI BAŞLAT
          setShowNextPoseArrows(true); // Okları göster
          await speak(transitionMessage, 'high', currentLanguage); // Doğru mesajı oku
          await waitForSpeechToFinish();
          
          // 7. Konuşma sonrası ekstra bekleme
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // 8. GEÇİŞİ BİTİR (Stability/Capture'ı tekrar etkinleştir)
          setIsTransitioning(false);
        } else {
          // Son poz (BACK) tamamlandı - direkt results ekranına yönlendir
          router.replace('/(app)/results');
        }
      } else {
        // Fotoğraf geçersiz, sadece AI feedback'ini söyle
        const feedbackText = result.feedback || t('camera.photoNotSuitable');
        setAnalysisFeedback(feedbackText);
        setStable(false);
        clearFeedback();
        
        // Allow immediate retry after a failed analysis:
        isFirstPhotoRef.current = true;
        
        // AI feedback'ini sesli söyle ve bitmesini bekle
        await speak(feedbackText, 'high', currentLanguage);
        await waitForSpeechToFinish();
        
        // 3 saniye sonra feedback'i temizle
        setTimeout(() => {
          setAnalysisFeedback(null);
        }, 3000);
      }
    },
    onAllPosesCompleted: (total) => {
      console.log(`All ${total} photos captured`);
    },
  });

  // İzin kontrolü
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // *** ADIM 1: isActive mantığı - sadece poseSequence.isActive'e bağlı ***
  // Elips, poseSequence.start() ve poseSequence.stop() dışında hiçbir şey tarafından gizlenmemeli
  useEffect(() => {
    setActive(poseSequence.isActive);
  }, [poseSequence.isActive, setActive]);

  // Otomatik mod başlat
  useEffect(() => {
    if (permission?.granted && !poseSequence.isActive && !isInitialized.current) {
      isInitialized.current = true;
      
      // İlk başta 1-2 saniye bekle, sonra başlat
      setTimeout(async () => {
        // --- KRİTİK DÜZELTME: SERVİSİ YENİDEN ETKİNLEŞTİR ---
        // Yeni oturum başlarken servisi tekrar etkinleştir
        enableSpeech();
        // -----------------------------------------------------
        
        // Hoş geldin mesajı - ilk kısım
        await speak(t('camera.welcomeMessagePart1'), 'high', currentLanguage);
        await waitForSpeechToFinish();
        
        // 0.5 saniye bekleme
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hoş geldin mesajı - ikinci kısım
        await speak(t('camera.welcomeMessagePart2'), 'high', currentLanguage);
        await waitForSpeechToFinish();
        
        // Speech sonrası kısa bekleme (1 saniye)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Poz sırasını başlat
        poseSequence.start();
      }, 1000);
    }
  }, [permission?.granted, currentLanguage]);

  // Poz değiştiğinde analiz durumunu sıfırla
  useEffect(() => {
    setIsAnalyzing(false);
    setAnalysisFeedback(null);
    isFirstPhotoRef.current = true;
  }, [poseSequence.currentPose, poseSequence.isActive, poseSequence.currentIndex, isTransitioning]);

  // İptal butonu için handler - state'i sıfırla ve modalı kapat
  const handleCancel = () => {
    resetSequence(); // Mevcut oturumu ve state'i temizle
    router.back();   // Modalı kapat
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionBox}>
            <Text style={styles.permissionIcon}>📷</Text>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>{t('camera.permissionTitle')}</Text>
              <Text style={styles.permissionDescription}>
                {t('camera.permissionDescription')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      {/* İptal butonu */}
      <Pressable style={styles.cancelButton} onPress={handleCancel}>
        <Ionicons name="close" size={30} color="white" />
      </Pressable>

      {/* İlerleme göstergesi */}
      {poseSequence.isActive && <PoseProgress />}

      {/* Yüz rehberlik overlay'i (Artık feedback'i de bu yönetiyor) */}
      <FaceGuideOverlay />

      {/* Analiz durumu */}
      {(isAnalyzing || store.isCapturing) && !analysisFeedback && (
        <View style={styles.analyzingContainer}>
          <Text style={styles.analyzingText}>{t('camera.analyzingPhoto')}</Text>
        </View>
      )}

      {/* Analiz geri bildirimi (geçersiz fotoğraf) */}
      {analysisFeedback && !isAnalyzing && (
        <View style={styles.analysisFeedbackContainer}>
          <Text style={styles.analysisFeedbackText}>⚠️ {analysisFeedback}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cancelButton: {
    position: 'absolute',
    top: 60, // Güvenli alanı (notch) geçecek kadar aşağıda
    right: 20,
    zIndex: 100, // Diğer her şeyin üstünde
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Okunabilirliği artır
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTextContainer: {
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  analysisFeedbackContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analysisFeedbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  analyzingContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
