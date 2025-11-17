import { Pose } from '../types/pose';

export const POSE_PROMPTS: Record<Pose, string> = {
  FRONT: `This is a photo taken from the front angle for hair analysis. 

SCALE: Face and hair should be fully visible, including shoulders
ANGLE: Device should be at face level, in vertical position, screen facing the user
IMPORTANT POINTS:
- Face should be clear and in focus
- Hairline and hair structure should be fully visible
- Lighting should be adequate, face should not be in shadow
- Background should not be cluttered
- Facial expression should be neutral`,

  LEFT_PROFILE: `This is a photo taken from the left profile angle for hair analysis.

SCALE: Head and hair should be fully visible, including ear and nape
ANGLE: Device should be positioned from the left side, at 90 degrees
IMPORTANT POINTS:
- Left profile should be clear and in focus
- Hairline and hair structure should be fully visible from the side
- Ear and nape area should be visible
- Lighting should be adequate
- Face profile should be clear`,

  RIGHT_PROFILE: `This is a photo taken from the right profile angle for hair analysis.

SCALE: Head and hair should be fully visible, including ear and nape
ANGLE: Device should be positioned from the right side, at 90 degrees
IMPORTANT POINTS:
- Right profile should be clear and in focus
- Hairline and hair structure should be fully visible from the side
- Ear and nape area should be visible
- Lighting should be adequate
- Face profile should be clear`,

  TOP: `This is a photo taken from the top angle for hair analysis.

SCALE: Top of head and hair should be fully visible
ANGLE: Device should be positioned from above, looking at the front-top of the head
IMPORTANT POINTS:
- Top of head and hairline should be clearly visible
- Lighting should be adequate, no shadows should form
- Hair part and pattern should be visible`,

  BACK: `This is a photo taken from the back angle for hair analysis.

SCALE: Back of head and hair should be fully visible, including nape and shoulders
ANGLE: Device should be positioned from behind, looking at the user's back
IMPORTANT POINTS:
- Back of head and nape should be clearly visible
- Hair structure and density should be assessable from the back
- Hairline and hair loss pattern should be visible
- Lighting should be adequate`,
};

