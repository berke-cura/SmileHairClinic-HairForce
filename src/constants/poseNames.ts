import { Pose } from '../types/pose';
import { t } from '../services/i18n';

export const POSE_NAMES: Record<Pose, string> = {
  FRONT: t('poseNames.FRONT'),
  LEFT_PROFILE: t('poseNames.LEFT_PROFILE'),
  RIGHT_PROFILE: t('poseNames.RIGHT_PROFILE'),
  TOP: t('poseNames.TOP'),
  BACK: t('poseNames.BACK'),
};

