import { BlurView } from 'expo-blur';
import { AnimatePresence, MotiView } from 'moti';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { POSE_NAMES } from '../constants/poseNames';
import { usePoseCameraStore } from '../stores/poseCameraStore';

export const PoseProgress: React.FC = () => {
  const currentIndex = usePoseCameraStore((state) => state.currentIndex);
  const totalPoses = usePoseCameraStore((state) => state.totalPoses);
  const currentPose = usePoseCameraStore((state) => state.currentPose);

  // Progress bar için animasyonlu width değeri
  const progressWidth = useSharedValue(0);

  // currentIndex veya totalPoses değiştiğinde progress bar'ı anime et
  React.useEffect(() => {
    const progress = ((currentIndex + 1) / totalPoses) * 100;
    progressWidth.value = withTiming(progress, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [currentIndex, totalPoses]);

  // Progress bar için animasyonlu stil
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  return (
    <BlurView intensity={80} tint="dark" style={styles.container}>
      {/* Metin geçişi için AnimatePresence ile cross-fade efekti */}
      <AnimatePresence>
        <MotiView
          key={currentPose}
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 10 }}
          transition={{ type: 'timing', duration: 250 }}
        >
          <Text style={styles.text}>
            {currentIndex + 1} / {totalPoses} - {POSE_NAMES[currentPose]}
          </Text>
        </MotiView>
      </AnimatePresence>

      {/* Progress bar container */}
      <View style={styles.progressBar}>
        {/* Animasyonlu progress fill */}
        <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0b1e33',
  },
});
