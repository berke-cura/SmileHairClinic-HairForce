import { BlurView } from 'expo-blur';
import { AnimatePresence, MotiView } from 'moti';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { getPoseGuides } from '../constants/poseGuides';
import { t } from '../services/i18n';
import { usePoseCameraStore } from '../stores/poseCameraStore';
import { useSettingsStore } from '../stores/useSettingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ELLIPSE_WIDTH = SCREEN_WIDTH * 0.6;
const ELLIPSE_HEIGHT = SCREEN_HEIGHT * 0.4;

// Feedback tipine göre renk belirleme fonksiyonu
type FeedbackType = 'success' | 'warning' | 'error' | 'info' | null;

const getFeedbackColors = (type: FeedbackType) => {
  switch (type) {
    case 'success':
      return { text: '#0b1e33' }; // "Capturing"
    case 'warning':
      return { text: '#FF9800' }; // "Wrong Angle"
    case 'error':
      return { text: '#F44336' }; // "Shaking"
    case 'info':
      return { text: '#FFFFFF' }; // "Analyzing" veya normal rehber
    default:
      return { text: '#FFFFFF' }; // Varsayılan
  }
};

export const FaceGuideOverlay: React.FC = () => {
  const language = useSettingsStore((state) => state.language);
  // *** DÜZELTME: Sonsuz döngüyü önlemek için atomik seçiciler ***
  const isActive = usePoseCameraStore((state) => state.isActive);
  const currentPose = usePoseCameraStore((state) => state.currentPose);
  const feedback = usePoseCameraStore((state) => state.feedback);
  const showNextPoseArrows = usePoseCameraStore((state) => state.showNextPoseArrows);
  const isCapturing = usePoseCameraStore((state) => state.isCapturing);
  const isStable = usePoseCameraStore((state) => state.isStable);
  // *** DÜZELTME SONU ***

  if (!isActive) return null;

  const guide = getPoseGuides()[currentPose];

  // Üstte gösterilecek metni ve rengini belirle
  let topText: string;
  let currentFeedbackType: FeedbackType = 'info';

  if (isCapturing) {
    // Fotoğraf çekimi/analizi sırasındaysa, bu en önceliklidir
    topText = isStable ? t('camera.feedbackCapturing') : t('camera.feedbackAnalyzing');
    currentFeedbackType = isStable ? 'success' : 'info';
  } else if (feedback.message && feedback.type) {
    // Aktif bir feedback (hata/uyarı) varsa, bunu göster
    topText = feedback.message;
    currentFeedbackType = feedback.type;
  } else {
    // Hiçbiri yoksa, normal poz rehberini göster
    topText = guide.faceMovement;
    currentFeedbackType = 'info'; // 'info' beyaz renk içindir
  }

  const bottomText = guide.phoneMovement;
  const feedbackColors = getFeedbackColors(currentFeedbackType);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 1. ÜST MESAJ ALANI (Artık tüm mantığı burada) */}
      <View style={styles.topTextContainer}>
        <AnimatePresence>
          <MotiView
            key={topText} // Metin değiştiğinde animasyonla gelsin
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -10 }}
            transition={{ type: 'timing', duration: 250 }}
            style={styles.blurContainer}
          >
            <BlurView intensity={70} tint="dark" style={styles.textBackground}>
              <Text
                style={[
                  styles.guideText,
                  { color: feedbackColors.text }, // Renk artık dinamik
                ]}
              >
                {topText}
              </Text>
            </BlurView>
          </MotiView>
        </AnimatePresence>
      </View>

      {/* 2. ELİPS VE OKLAR ALANI */}
      <View style={styles.ellipseContainer}>
        <View style={styles.ellipse} />

        <AnimatePresence>
          {showNextPoseArrows && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.arrowOverlayContainer}
            >
              {/* Üst Ok */}
              {guide.arrows.top && (
                <MotiView
                  style={[styles.arrowContainer, styles.arrowTop]}
                  from={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.15, opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 800,
                    loop: true,
                    repeatReverse: true,
                  }}
                >
                  <Text style={[styles.arrowText, styles.arrowVerticalText]}>
                    ↑
                  </Text>
                </MotiView>
              )}

              {/* Alt Ok */}
              {guide.arrows.bottom && (
                <MotiView
                  style={[styles.arrowContainer, styles.arrowBottom]}
                  from={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.15, opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 800,
                    loop: true,
                    repeatReverse: true,
                  }}
                >
                  <Text style={[styles.arrowText, styles.arrowVerticalText]}>
                    ↓
                  </Text>
                </MotiView>
              )}

              {/* Sol Ok */}
              {guide.arrows.left && (
                <MotiView
                  style={[styles.arrowContainer, styles.arrowLeft]}
                  from={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.15, opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 800,
                    loop: true,
                    repeatReverse: true,
                  }}
                >
                  <Text style={styles.arrowText}>←</Text>
                </MotiView>
              )}

              {/* Sağ Ok */}
              {guide.arrows.right && (
                <MotiView
                  style={[styles.arrowContainer, styles.arrowRight]}
                  from={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.15, opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 800,
                    loop: true,
                    repeatReverse: true,
                  }}
                >
                  <Text style={styles.arrowText}>→</Text>
                </MotiView>
              )}
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* 3. ALT MESAJ ALANI (Telefon rehberi) */}
      <View style={styles.bottomTextContainer}>
        <AnimatePresence>
          <MotiView
            key={bottomText} // Metin değiştiğinde animasyonla gelsin
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 10 }}
            transition={{ type: 'timing', duration: 250 }}
            style={styles.blurContainer}
          >
            <BlurView intensity={70} tint="dark" style={styles.textBackground}>
              <Text style={styles.guideText}>{bottomText}</Text>
            </BlurView>
          </MotiView>
        </AnimatePresence>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTextContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 20, // Metin taşmasın
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 20, // Metin taşmasın
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  textBackground: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  guideText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // capturingText'e artık gerek kalmadı, guideText'i kullanıyoruz.
  ellipseContainer: {
    width: ELLIPSE_WIDTH,
    height: ELLIPSE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },
  ellipse: {
    width: '100%',
    height: '100%',
    borderRadius: ELLIPSE_HEIGHT / 2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  arrowOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  arrowContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  arrowTop: {
    top: -60,
    left: ELLIPSE_WIDTH / 2 - 20,
  },
  arrowBottom: {
    bottom: -60,
    left: ELLIPSE_WIDTH / 2 - 20,
  },
  arrowLeft: {
    left: -60,
    top: ELLIPSE_HEIGHT / 2 - 20,
  },
  arrowRight: {
    right: -60,
    top: ELLIPSE_HEIGHT / 2 - 20,
  },
  arrowText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  arrowVerticalText: {
    fontSize: 48,
    transform: [{ scaleY: 1.1 }],
  },
});
