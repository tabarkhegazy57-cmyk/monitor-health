import type { BodyRegionId } from "@/types/domain";

export type Vec3 = [number, number, number];

export interface CameraFocus {
  position: Vec3;
  target: Vec3;
}

/** Imperative camera API exposed to the page's controls. */
export interface BodyViewerApi {
  zoomIn(): void;
  zoomOut(): void;
  rotate(direction: 1 | -1): void;
  reset(): void;
  focus(id: BodyRegionId | null): void;
}
