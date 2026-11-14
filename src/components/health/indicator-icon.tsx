import {
  ArrowDownToDot,
  Droplet,
  Gauge,
  HeartPulse,
  MoonStar,
  Orbit,
  Radiation,
  Smile,
  Thermometer,
  UsersRound,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { HazardId, IndicatorId } from "@/types/domain";

export const INDICATOR_ICONS: Record<IndicatorId, LucideIcon> = {
  "heart-rate": HeartPulse,
  "blood-pressure": Gauge,
  "blood-sugar": Droplet,
  "body-temperature": Thermometer,
  sleep: MoonStar,
  mood: Smile,
};

export const HAZARD_ICONS: Record<HazardId, LucideIcon> = {
  radiation: Radiation,
  isolation: UsersRound,
  distance: Orbit,
  gravity: ArrowDownToDot,
  "closed-environment": Wind,
};
