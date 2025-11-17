import { Pose } from '../types/pose';

export interface PoseTolerance {
  betaTarget: number;
  betaTol: number;
  gammaTarget: number;
  gammaTol: number;
  maxTotalTilt?: number;
}

export const TOLERANCES: Record<Pose, PoseTolerance> = {
  FRONT:         { betaTarget:  90,  betaTol: 40, gammaTarget:   0,  gammaTol: 60 },
  BACK:          { betaTarget: 0, betaTol: 50, gammaTarget: 140, gammaTol: 50 },
  TOP:           { betaTarget:   0,  betaTol: 60, gammaTarget: 180, gammaTol: 60 },
  RIGHT_PROFILE: { betaTarget:  90,  betaTol: 50, gammaTarget:   0,  gammaTol: 60 },
  LEFT_PROFILE:  { betaTarget:  90,  betaTol: 50, gammaTarget:  60, gammaTol: 60 },
};

