import { DeviceMotion, Gyroscope } from 'expo-sensors';
import { useEffect, useRef } from 'react';
import { TOLERANCES } from '../constants/poseTolerances';
import { t } from '../services/i18n';
import { Pose } from '../types/pose';

// Radyan'dan dereceye dönüştürme fonksiyonu
const deg = (rad: number) => rad * (180 / Math.PI);

// Açıyı normalize et (-180–180 aralığına veya 0–360 aralığına)
const normalizeAngle = (angle: number): number => {
  let a = angle % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
};

// İki açı arasındaki minimum farkı hesapla (wrap-around desteği ile)
const angleDiff = (angle1: number, angle2: number): number => {
  const a1 = normalizeAngle(angle1);
  const a2 = normalizeAngle(angle2);
  let diff = Math.abs(a1 - a2);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
};

export const usePoseChecker = (
  targetPose: Pose,
  onFeedback: (message: string) => void,
  isEnabled: boolean = true
) => {
  const feedbackRef = useRef(onFeedback);
  const lastShakeCheck = useRef<number>(Date.now());
  const isShaking = useRef<boolean>(false);
  const isEnabledRef = useRef(isEnabled);
  // Not: Stabilite zamanlayıcısı usePoseStability hook'u tarafından yönetiliyor

  // Callback'i her zaman güncel tut
  useEffect(() => {
    feedbackRef.current = onFeedback;
  }, [onFeedback]);

  // isEnabled'i ref'te güncel tut (listener'larda güncel değeri görmek için)
  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    let motionSub: any = null;
    let gyroSub: any = null;
    let isMounted = true;

    // *** GÜNCELLEME: isEnabled KONTROLÜ ***
    if (!isEnabled) {
      // Eğer hook kapalıysa, listener'ları kurma ve çalıştırma
      return () => {
        isMounted = false;
        if (motionSub) motionSub.remove();
        if (gyroSub) gyroSub.remove();
      };
    }
    // *** GÜNCELLEME SONU ***

    const setupPoseChecker = async () => {
      try {
        // DeviceMotion izinleri ve kurulumu
        const motionAvailable = await DeviceMotion.isAvailableAsync();
        if (!motionAvailable) {
          console.warn('DeviceMotion is not available');
          return;
        }

        const { status: motionStatus } = await DeviceMotion.getPermissionsAsync();
        if (motionStatus !== 'granted') {
          const { status: newStatus } = await DeviceMotion.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            console.warn('DeviceMotion permission not granted');
            return;
          }
        }

        // Gyroscope izinleri ve kurulumu
        const { status: gyroStatus } = await Gyroscope.getPermissionsAsync();
        if (gyroStatus !== 'granted') {
          const { status: newGyroStatus } = await Gyroscope.requestPermissionsAsync();
          if (newGyroStatus !== 'granted') {
            console.warn('Gyroscope permission not granted');
            return;
          }
        }

        const gyroAvailable = await Gyroscope.isAvailableAsync();
        if (!gyroAvailable) {
          console.warn('Gyroscope is not available');
        }

        // Update interval'ları ayarla
        DeviceMotion.setUpdateInterval(100);
        Gyroscope.setUpdateInterval(100);

        const tolerance = TOLERANCES[targetPose];

        // DeviceMotion listener - açı kontrolü
        motionSub = DeviceMotion.addListener((data) => {
          if (!isMounted || !isEnabledRef.current) return; // isEnabled kontrolü eklendi (ref kullanıldı)

          const rotation = data.rotation;
          if (!rotation) return;

          // Radyan'dan dereceye dönüştür ve normalize et
          const betaDeg = normalizeAngle(deg(rotation.beta || 0));
          const gammaDeg = normalizeAngle(deg(rotation.gamma || 0));

          // **** DIAGNOSTIK: Ham sensör verileri ve hedefler ****
          console.log(
            `[POSE CHECK] Poz: ${targetPose} | ` +
            `Beta: ${betaDeg.toFixed(1)}° (hedef: ${tolerance.betaTarget}° ±${tolerance.betaTol}°) | ` +
            `Gamma: ${gammaDeg.toFixed(1)}° (hedef: ${tolerance.gammaTarget}° ±${tolerance.gammaTol}°)`
          );
          // ******************************************************

          // Açı farklarını hesapla (wrap-around desteği ile)
          const betaDiff = angleDiff(betaDeg, tolerance.betaTarget);
          const gammaDiff = angleDiff(gammaDeg, tolerance.gammaTarget);
          
          // **** DIAGNOSTIK: Açı farkları ve kontrol sonuçları ****
          console.log(
            `[POSE CHECK] Beta fark: ${betaDiff.toFixed(1)}° | Gamma fark: ${gammaDiff.toFixed(1)}° | ` +
            `Beta OK: ${betaDiff <= tolerance.betaTol} | Gamma OK: ${gammaDiff <= tolerance.gammaTol}`
          );
          // ******************************************************
          
          // Ortalama sapma yöntemiyle esnek kontrol
          const meanDiff = (betaDiff + gammaDiff) / 2;
          const maxTolerance = Math.max(tolerance.betaTol, tolerance.gammaTol);
          
          // Her eksen için ayrı kontrol (daha esnek)
          const betaCheck = betaDiff <= tolerance.betaTol;
          const gammaCheck = gammaDiff <= tolerance.gammaTol;
          
          // Ortalama sapma kontrolü (daha esnek)
          const meanCheck = meanDiff <= maxTolerance;
          
          // Her iki kontrol de geçerli olmalı (esnek ama güvenli)
          let withinAngle = betaCheck && gammaCheck;
                    
          // Özel durumlar için ek kontroller
          if (targetPose === 'TOP' || targetPose === 'BACK') {
            // ±180° karşılıklarını da kabul et
            const betaAlt = angleDiff(betaDeg, tolerance.betaTarget + 180);
            const betaAlt2 = angleDiff(betaDeg, tolerance.betaTarget - 180);
            const gammaAlt = angleDiff(gammaDeg, tolerance.gammaTarget + 180);
            const gammaAlt2 = angleDiff(gammaDeg, tolerance.gammaTarget - 180);
            
            const betaAltCheck = betaAlt <= tolerance.betaTol || betaAlt2 <= tolerance.betaTol;
            const gammaAltCheck = gammaAlt <= tolerance.gammaTol || gammaAlt2 <= tolerance.gammaTol;
            
            if (betaAltCheck && gammaAltCheck) {
              withinAngle = true;
            }
          }
          
          // FRONT için toplam eğim kontrolü
          if (targetPose === 'FRONT' && tolerance.maxTotalTilt) {
            const totalTilt = betaDiff + gammaDiff;
            if (totalTilt > tolerance.maxTotalTilt) {
              withinAngle = false;
            }
          }

          // Titreşim yoksa açı kontrolü yap
          if (!isShaking.current) {
            if (withinAngle) {
              // Açı doğruysa sürekli "Stay Stable" mesajı gönder
              // usePoseStability hook'u bu mesajı dinleyip kendi zamanlayıcısını yönetecek
              feedbackRef.current(t('camera.feedbackStable'));
              // **** DIAGNOSTIK: Stabil durum ****
              console.log(`[POSE CHECK] ✅ Açı doğru - Stay Stable mesajı gönderildi`);
              // **********************************
            } else {
              // Hangi yöne hareket ettirmesi gerektiğini hesapla
              // Normalize edilmiş açı farklarını kullan
              const betaDiffRaw = normalizeAngle(betaDeg - tolerance.betaTarget);
              const gammaDiffRaw = normalizeAngle(gammaDeg - tolerance.gammaTarget);
              
              let directionMessage = '';
              
              // Beta (front-back) kontrolü
              // betaDiffRaw > 0: cihaz geriye eğik → kullanıcı öne eğmeli (down)
              // betaDiffRaw < 0: cihaz öne eğik → kullanıcı geriye eğmeli (up)
              if (betaDiff > tolerance.betaTol) {
                if (betaDiffRaw > 0) {
                  directionMessage += 'down '; // DÜZELTME: Tersine çevrildi
                } else {
                  directionMessage += 'up '; // DÜZELTME: Tersine çevrildi
                }
              }
              
              // Gamma (left-right) kontrolü
              // gammaDiffRaw > 0: cihaz sağa eğik → kullanıcı sola eğmeli (left)
              // gammaDiffRaw < 0: cihaz sola eğik → kullanıcı sağa eğmeli (right)
              if (gammaDiff > tolerance.gammaTol) {
                if (gammaDiffRaw > 0) {
                  directionMessage += 'left '; // DÜZELTME: Tersine çevrildi
                } else {
                  directionMessage += 'right '; // DÜZELTME: Tersine çevrildi
                }
              }
              
              const feedbackText = directionMessage 
                ? t('camera.feedbackWrongAngle', { direction: directionMessage.trim() })
                : t('camera.feedbackWrongAngleSlightly');
              
              feedbackRef.current(feedbackText);
              
              // **** DIAGNOSTIK: Yanlış açı ve yönlendirme ****
              console.log(
                `[POSE CHECK] ⚠️ Açı yanlış | ` +
                `BetaDiffRaw: ${betaDiffRaw.toFixed(1)}° | GammaDiffRaw: ${gammaDiffRaw.toFixed(1)}° | ` +
                `Yönlendirme: "${directionMessage.trim() || 'rotate slightly'}"`
              );
              // ************************************************
            }
          }
          // Not: Titreşim durumunda usePoseStability kendi sıfırlamasını yapıyor
        });

        // Gyroscope listener - titreşim kontrolü
        if (gyroAvailable) {
          gyroSub = Gyroscope.addListener((gyro) => {
            if (!isMounted || !isEnabledRef.current) return; // isEnabled kontrolü eklendi (ref kullanıldı)

            const now = Date.now();
            const x = Math.abs(gyro.x || 0);
            const y = Math.abs(gyro.y || 0);
            const z = Math.abs(gyro.z || 0);

            // Titreşim eşiği: 1.5 rad/s (x, y, z eksenlerinin hepsini kontrol et)
            const shakeThreshold = 1.5;
            const isCurrentlyShaking = x > shakeThreshold || y > shakeThreshold || z > shakeThreshold;

            // Debounce: titreşim durumunu güncelle
            if (isCurrentlyShaking) {
              isShaking.current = true;
              feedbackRef.current(t('camera.feedbackShaking'));
              lastShakeCheck.current = now;
            } else if (now - lastShakeCheck.current > 200) {
              // 200ms boyunca titreşim yoksa, titreşim durumunu sıfırla
              isShaking.current = false;
            }
          });
        }
      } catch (error) {
        console.error('Error setting up PoseChecker:', error);
      }
    };

    setupPoseChecker();

    return () => {
      isMounted = false;
      if (motionSub) {
        motionSub.remove();
      }
      if (gyroSub) {
        gyroSub.remove();
      }
    };
  }, [targetPose, isEnabled]); // isEnabled bağımlılığa eklendi
};

