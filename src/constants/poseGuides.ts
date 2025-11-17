import { Pose } from '../types/pose';
import { t } from '../services/i18n';

// Helper function to get pose guides with i18n
export const getPoseGuides = (): Record<
  Pose,
  {
    faceMovement: string;
    phoneMovement: string;
    arrows: {
      top?: boolean;
      bottom?: boolean;
      left?: boolean;
      right?: boolean;
    };
  }
> => ({
  FRONT: {
    faceMovement: t('poseGuides.FRONT.faceMovement'),
    phoneMovement: t('poseGuides.FRONT.phoneMovement'),
    arrows: {},
  },
  LEFT_PROFILE: {
    faceMovement: t('poseGuides.LEFT_PROFILE.faceMovement'),
    phoneMovement: t('poseGuides.LEFT_PROFILE.phoneMovement'),
    arrows: {
      right: true,
    },
  },
  RIGHT_PROFILE: {
    faceMovement: t('poseGuides.RIGHT_PROFILE.faceMovement'),
    phoneMovement: t('poseGuides.RIGHT_PROFILE.phoneMovement'),
    arrows: {
      left: true,
    },
  },
  TOP: {
    faceMovement: t('poseGuides.TOP.faceMovement'),
    phoneMovement: t('poseGuides.TOP.phoneMovement'),
    arrows: {
      bottom: true,
    },
  },
  BACK: {
    faceMovement: t('poseGuides.BACK.faceMovement'),
    phoneMovement: t('poseGuides.BACK.phoneMovement'),
    arrows: {
      bottom: true,
    },
  },
});

// Legacy export for backward compatibility (will use i18n)
export const POSE_GUIDES = getPoseGuides();

