import type { BodyRegionId } from "@/types/domain";

import type { CameraFocus } from "./types";

/** Camera views in the Open Anatomy 3D model's space (metres, feet at y = 0). */
export const DEFAULT_VIEW: CameraFocus = { position: [0, 1.02, 3.55], target: [0, 0.92, 0] };

export const REGION_VIEWS: Record<BodyRegionId, CameraFocus> = {
  head: { position: [0.35, 1.7, 1.25], target: [0, 1.6, 0] },
  chest: { position: [0.45, 1.42, 1.75], target: [0, 1.32, 0] },
  abdomen: { position: [0.45, 1.12, 1.8], target: [0, 1.02, 0] },
  arms: { position: [1.35, 1.25, 1.75], target: [0.12, 1.08, 0] },
  legs: { position: [0.55, 0.7, 2.5], target: [0, 0.5, 0] },
};
