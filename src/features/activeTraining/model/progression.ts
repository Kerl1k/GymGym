import {
  getRepeatsLike,
  getWeightLike,
  WEIGHT_UNIT_INDEX,
} from "@/shared/lib/active-training-units";
import { ApiSchemas } from "@/shared/schema";

export type ProgressionHint = {
  previousWeight: number;
  previousReps: number;
  weight: number;
  reps: number;
};

/** How many reps above the start of this weight before the load goes up. */
const REP_WINDOW = 3;

/**
 * Plate step used once the rep window is full.
 * Under 20 kg the jump stays 1 kg, from 20 kg it is 2.5 kg, from 60 kg it is 5 kg.
 */
function getWeightStep(weight: number): number {
  if (weight >= 60) return 5;
  if (weight >= 20) return 2.5;
  return 1;
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

function sameWeight(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

function addWeight(weight: number, step: number): number {
  return Math.round((weight + step) * 100) / 100;
}

/**
 * Newest session uses the last set when this workout has more sets than the past one.
 * Older sessions count only the set with the same index, so a short workout does not
 * rewrite the rep window of a later set.
 */
export function selectPreviousSetsAtIndex(
  historyNewestFirst: ApiSchemas["Set"][][],
  setIndex: number,
): Array<ApiSchemas["Set"] | undefined> {
  return historyNewestFirst.map((sets, sessionIndex) => {
    if (sets.length === 0) return undefined;
    if (sessionIndex === 0) {
      return sets[Math.min(setIndex, sets.length - 1)];
    }
    return sets[setIndex];
  });
}

/**
 * Double progression on the current weight.
 * The floor is the reps from the oldest recent session that still used this weight.
 * The ceiling is that floor plus 3. Below it, keep the weight and add one rep.
 * On the ceiling, add a plate step and return to the floor. A session below the floor
 * is sent back to it. With no reps logged, only the plate step is suggested.
 */
export function getProgressionHint(
  previousSetsNewestFirst: Array<ApiSchemas["Set"] | undefined>,
): ProgressionHint | null {
  const last = previousSetsNewestFirst[0];
  if (!last) return null;
  if (!isWeightUnit(last.units[WEIGHT_UNIT_INDEX]?.name)) return null;

  const previousWeight = getWeightLike(last);
  if (previousWeight <= 0) return null;

  const previousReps = getRepeatsLike(last);
  if (previousReps <= 0) {
    return {
      previousWeight,
      previousReps: 0,
      weight: addWeight(previousWeight, getWeightStep(previousWeight)),
      reps: 0,
    };
  }

  let floorReps = previousReps;
  for (let i = 1; i < previousSetsNewestFirst.length; i += 1) {
    const set = previousSetsNewestFirst[i];
    if (!set) break;
    if (!isWeightUnit(set.units[WEIGHT_UNIT_INDEX]?.name)) break;
    const weight = getWeightLike(set);
    if (weight <= 0 || !sameWeight(weight, previousWeight)) break;
    const reps = getRepeatsLike(set);
    if (reps > 0) floorReps = reps;
  }

  const ceilingReps = floorReps + REP_WINDOW;
  if (previousReps < floorReps) {
    return {
      previousWeight,
      previousReps,
      weight: previousWeight,
      reps: floorReps,
    };
  }

  if (previousReps < ceilingReps) {
    return {
      previousWeight,
      previousReps,
      weight: previousWeight,
      reps: previousReps + 1,
    };
  }

  return {
    previousWeight,
    previousReps,
    weight: addWeight(previousWeight, getWeightStep(previousWeight)),
    reps: floorReps,
  };
}
