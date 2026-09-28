import {
  getRepeatsLike,
  getWeightLike,
  WEIGHT_UNIT_INDEX,
} from "@/shared/lib/active-training-units";
import { ApiSchemas } from "@/shared/schema";

export type ProgressionHint = {
  previousWeight: number;
  reps: number;
  weight: number;
};

function getWeightStep(weight: number): number {
  return weight >= 20 ? 2.5 : 1;
}

function isWeightUnit(name: string | undefined): boolean {
  const normalized = (name ?? "").trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.startsWith("вес") ||
    normalized.startsWith("кг") ||
    normalized === "kg" ||
    normalized === "weight"
  );
}

/** Suggests adding weight with the same reps; no hint when the previous set had no weight in kg. */
export function getProgressionHint(
  previousSet: ApiSchemas["Set"] | undefined,
): ProgressionHint | null {
  if (!previousSet) return null;
  if (!isWeightUnit(previousSet.units[WEIGHT_UNIT_INDEX]?.name)) return null;

  const previousWeight = getWeightLike(previousSet);
  if (previousWeight <= 0) return null;

  return {
    previousWeight,
    reps: getRepeatsLike(previousSet),
    weight: previousWeight + getWeightStep(previousWeight),
  };
}
