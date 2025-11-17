import { useEffect, useRef } from 'react';
import { Pose } from '../types/pose';
import { usePoseChecker } from './usePoseChecker';

interface UsePoseStabilityOptions {
  targetPose: Pose;
  onFeedback: (message: string) => void;
  onStable: (isStable: boolean) => void;
  stableDuration?: number; // ms cinsinden, varsayılan 1000ms
  isEnabled: boolean; // Hook'un aktif olup olmadığını kontrol eder
}

/**
 * Poz stabilitesini kontrol eden hook
 * Doğru açıda belirli süre sabit kalırsa onStable(true) çağırır
 */
export const usePoseStability = ({
  targetPose,
  onFeedback,
  onStable,
  stableDuration = 1000,
  isEnabled,
}: UsePoseStabilityOptions) => {
  const stableStartTime = useRef<number | null>(null);
  const isStableRef = useRef<boolean>(false);

  // usePoseChecker'dan gelen feedback'i dinle
  usePoseChecker(
    targetPose,
    (message) => {
      // *** GÜNCELLEME: isEnabled KONTROLÜ ***
      if (!isEnabled) {
        // Eğer hook "kapalıysa", tüm feedback'leri yok say ve stabiliteyi sıfırla
        stableStartTime.current = null;
        if (isStableRef.current) {
          isStableRef.current = false;
          onStable(false);
        }
        return;
      }
      // *** GÜNCELLEME SONU ***

      const isCurrentlyStable = message.includes('✅ Stay Stable');
      const now = Date.now();

      // *** DEĞİŞİKLİK BURADA ***
      // SADECE "Stay Stable" mesajı DEĞİLSE ekrana feedback yolla.
      // Diğer tüm mesajlar (örn: '⚠️ Wrong Angle...') gösterilmeye devam eder.
      if (!isCurrentlyStable) {
        onFeedback(message);
      }
      // *************************

      if (isCurrentlyStable) {
        // İlk kez stabil olduğunda zamanı kaydet
        if (stableStartTime.current === null) {
          stableStartTime.current = now;
          isStableRef.current = false;
        } else {
          // Stabil süreyi kontrol et
          const duration = now - stableStartTime.current;
          if (duration >= stableDuration && !isStableRef.current) {
            isStableRef.current = true;
            onStable(true);
          }
        }
      } else {
        // Stabil değilse sıfırla
        stableStartTime.current = null;
        if (isStableRef.current) {
          isStableRef.current = false;
          onStable(false);
        }
      }
    },
    isEnabled // usePoseChecker'a isEnabled prop'unu geçir
  );

  // Poz veya isEnabled durumu değiştiğinde sıfırla
  useEffect(() => {
    stableStartTime.current = null;
    isStableRef.current = false;
    onStable(false);
  }, [targetPose, onStable, isEnabled]); // isEnabled'i bağımlılıklara ekle
};

