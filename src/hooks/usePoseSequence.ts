import { useCallback } from 'react';
import { POSE_SEQUENCE } from '../constants/poseSequence';
import { usePoseCameraStore } from '../stores/poseCameraStore';

/**
 * Hook that provides pose sequence management.
 * Uses usePoseCameraStore as the single source of truth.
 * This hook is now a selector/wrapper around the store.
 */
export const usePoseSequence = () => {
  // Read state from store (single source of truth)
  const currentPose = usePoseCameraStore((state) => state.currentPose);
  const currentIndex = usePoseCameraStore((state) => state.currentIndex);
  const totalPoses = usePoseCameraStore((state) => state.totalPoses);
  const isActive = usePoseCameraStore((state) => state.isActive);

  // Get actions from store
  const nextSequence = usePoseCameraStore((state) => state.nextSequence);
  const startSequence = usePoseCameraStore((state) => state.startSequence);
  const stopSequence = usePoseCameraStore((state) => state.stopSequence);
  const resetSequence = usePoseCameraStore((state) => state.resetSequence);

  const isLastPose = currentIndex === POSE_SEQUENCE.length - 1;

  // Wrapper methods that call store actions
  const start = useCallback(() => {
    startSequence();
  }, [startSequence]);

  const stop = useCallback(() => {
    stopSequence();
  }, [stopSequence]);

  const next = useCallback(() => {
    if (!isLastPose) {
      nextSequence();
    }
  }, [isLastPose, nextSequence]);

  const reset = useCallback(() => {
    resetSequence();
  }, [resetSequence]);

  return {
    currentPose,
    currentIndex,
    totalPoses,
    isActive,
    isLastPose,
    start,
    stop,
    next,
    reset,
  };
};

