import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { usePoseCameraStore } from '../stores/poseCameraStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { t } from '../services/i18n';

export const PoseFeedback: React.FC = () => {
  const language = useSettingsStore((state) => state.language);
  const feedback = usePoseCameraStore((state) => state.feedback);
  const isStable = usePoseCameraStore((state) => state.isStable);
  const isCapturing = usePoseCameraStore((state) => state.isCapturing);

  // Feedback tipine göre renk belirleme fonksiyonu
  const getFeedbackColor = (): string => {
    switch (feedback.type) {
      case 'success':
        return '#0b1e33';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'info':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  // Mesaj yoksa bileşeni render etme
  if (!feedback.message) return null;

  const feedbackColor = getFeedbackColor();

  return (
    <AnimatePresence>
      <MotiView
        key={`${feedback.message}-${feedback.type}`}
        from={{ opacity: 0, translateY: -20 }}
        animate={{
          opacity: 1,
          translateY: 0,
          backgroundColor: feedbackColor + '20',
          borderColor: feedbackColor,
        }}
        exit={{
          opacity: 0,
          translateY: -10,
        }}
        transition={{
          opacity: { type: 'spring', damping: 15, stiffness: 120 },
          translateY: { type: 'spring', damping: 15, stiffness: 120 },
          backgroundColor: { type: 'timing', duration: 300 },
          borderColor: { type: 'timing', duration: 300 },
        }}
        style={styles.feedbackBox}
      >
        <Text style={[styles.feedbackText, { color: feedbackColor }]}>
          {feedback.message}
        </Text>
        {isCapturing && (
          <Text style={styles.capturingText}>
            {isStable ? t('camera.feedbackCapturing') : t('camera.feedbackAnalyzing')}
          </Text>
        )}
      </MotiView>
    </AnimatePresence>
  );
};

const styles = StyleSheet.create({
  feedbackBox: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  capturingText: {
    fontSize: 16,
    color: '#0b1e33',
    marginTop: 8,
    fontWeight: '600',
  },
});
