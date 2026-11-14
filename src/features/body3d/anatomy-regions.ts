import type { BodyRegionId } from "@/types/domain";

/**
 * Which explorer region each Open Anatomy 3D structure belongs to. Selecting a
 * structure on the model selects its region, which drives the linked-readings
 * panel. Skin is not selectable in the viewer, so it is not listed.
 */
const STRUCTURES_BY_REGION: Record<BodyRegionId, readonly string[]> = {
  head: [
    "brain", "brainstem", "cerebellum", "pituitary", "eye_l", "eye_r", "tongue", "pharynx", "larynx",
    "salivary_glands", "skull", "mandible", "teeth", "spine_cervical", "cranial_nerves", "spinal_cord",
    "arteries_head", "carotid_l", "carotid_r", "neck_muscles_l", "neck_muscles_r",
  ],
  chest: [
    "heart", "lung_l", "lung_r", "bronchi", "trachea", "esophagus", "thymus", "breast_l", "breast_r",
    "ribs_l", "ribs_r", "sternum", "spine_thoracic", "chest_muscles_l", "chest_muscles_r",
    "intercostals_l", "intercostals_r", "diaphragm", "back_muscles_l", "back_muscles_r",
    "trapezius_l", "trapezius_r", "aorta", "coronary_arteries", "pulmonary_vessels",
    "vena_cava_superior", "arteries_thorax", "veins_thorax",
  ],
  abdomen: [
    "liver", "stomach", "gallbladder", "pancreas", "spleen", "small_intestine", "colon", "appendix",
    "kidney_l", "kidney_r", "adrenal_l", "adrenal_r", "ureter_l", "ureter_r", "bladder", "reproductive",
    "prostate", "uterus", "ovary_l", "ovary_r", "fallopian_tubes", "vagina", "pelvis", "spine_lumbar",
    "abdominal_muscles", "pelvic_floor", "iliopsoas_l", "iliopsoas_r", "vena_cava_inferior",
    "arteries_abdomen", "arteries_pelvis", "veins_abdomen", "veins_pelvis",
  ],
  arms: [
    "shoulder_l", "shoulder_r", "elbow_l", "elbow_r", "wrist_l", "wrist_r", "clavicle_l", "clavicle_r",
    "scapula_l", "scapula_r", "humerus_l", "humerus_r", "forearm_l", "forearm_r", "hand_l", "hand_r",
    "deltoid_l", "deltoid_r", "rotator_cuff_l", "rotator_cuff_r", "shoulder_muscles_l", "shoulder_muscles_r",
    "upper_arm_muscles_l", "upper_arm_muscles_r", "forearm_muscles_l", "forearm_muscles_r",
    "hand_muscles_l", "hand_muscles_r", "arteries_arm_l", "arteries_arm_r", "veins_arm_l", "veins_arm_r",
  ],
  legs: [
    "hip_l", "hip_r", "knee_l", "knee_r", "ankle_l", "ankle_r", "femur_l", "femur_r", "patella_l",
    "patella_r", "lower_leg_l", "lower_leg_r", "foot_l", "foot_r", "gluteal_l", "gluteal_r",
    "quadriceps_l", "quadriceps_r", "hamstrings_l", "hamstrings_r", "adductors_l", "adductors_r",
    "calf_l", "calf_r", "shin_muscles_l", "shin_muscles_r", "foot_muscles_l", "foot_muscles_r",
    "arteries_leg_l", "arteries_leg_r", "veins_leg_l", "veins_leg_r",
  ],
};

const REGION_BY_STRUCTURE = new Map<string, BodyRegionId>(
  (Object.entries(STRUCTURES_BY_REGION) as [BodyRegionId, readonly string[]][]).flatMap(([region, keys]) =>
    keys.map((key) => [key, region] as const),
  ),
);

export function regionForStructure(key: string): BodyRegionId | null {
  return REGION_BY_STRUCTURE.get(key) ?? null;
}

export function structuresInRegion(region: BodyRegionId): readonly string[] {
  return STRUCTURES_BY_REGION[region];
}
