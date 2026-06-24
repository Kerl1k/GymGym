import { REPS_UNIT_INDEX, WEIGHT_UNIT_INDEX } from "@/shared/lib/active-training-units";
import { ApiSchemas } from "@/shared/schema";

import {
  distanceCmPresets,
  distanceMPresets,
  minPresets,
  percent1rmPresets,
  repPresets,
  rpePresets,
  secPresets,
  weightPresets,
} from "./NotedWeightModal.config";

export function getPresetsForUnit(
  unitName: string | undefined,
  unitIndex: number,
) {
  const raw = (unitName ?? "").trim().toLowerCase();
  // normalize: collapse spaces, remove trailing dots
  const name = raw.replace(/\s+/g, " ").replace(/\.+$/g, "");
  const compact = name.replace(/\s/g, "");

  // Backwards compatible defaults for the first two units.
  if (!name) {
    if (unitIndex === WEIGHT_UNIT_INDEX) return weightPresets;
    if (unitIndex === REPS_UNIT_INDEX) return repPresets;
    return [];
  }

  if (["кг", "kg", "lb", "lbs"].includes(name)) return weightPresets;
  if (name.startsWith("кг")) return weightPresets;

  if (
    ["раз", "повт", "повтор", "повторения", "reps", "rep"].includes(name) ||
    name.startsWith("повт") ||
    name.startsWith("повтор")
  )
    return repPresets;

  if (
    ["подход", "подходы", "set", "sets"].includes(name) ||
    name.startsWith("подход")
  )
    return [1, 2, 3, 4, 5, 6];

  if (
    ["сек", "s", "sec", "second", "seconds"].includes(name) ||
    name.startsWith("сек")
  )
    return secPresets;

  if (
    ["мин", "min", "minute", "minutes"].includes(name) ||
    name.startsWith("мин")
  )
    return minPresets;

  // Distance
  if (name === "м") return distanceMPresets;
  if (name === "см") return distanceCmPresets;

  // Effort
  if (name === "rpe") return rpePresets;

  // % 1RM / 1ПМ
  if (
    name === "%" ||
    compact === "%от1пм" ||
    compact === "%от1rm" ||
    name.includes("1пм") ||
    name.includes("1rm") ||
    name.startsWith("%")
  )
    return percent1rmPresets;

  // Fallback: only show presets for legacy positions.
  if (unitIndex === WEIGHT_UNIT_INDEX) return weightPresets;
  if (unitIndex === REPS_UNIT_INDEX) return repPresets;
  return [];
}

export function getPreviousSetByIndexWithFallback(
  previousSets: ApiSchemas["Set"][] | undefined,
  setIndex: number,
) {
  if (!previousSets || previousSets.length === 0) return undefined;
  const fallbackIndex = Math.min(setIndex, previousSets.length - 1);
  return previousSets[fallbackIndex];
}
