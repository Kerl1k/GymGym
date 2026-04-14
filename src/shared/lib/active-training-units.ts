import type { ApiSchemas } from "@/shared/schema";

export type TrainingSet = ApiSchemas["Set"];
export type TrainingUnit = ApiSchemas["Unit"];

const DEFAULT_FIRST = "Вес";
const DEFAULT_SECOND = "Повторения";

/** Индексы «как раньше»: 0 — вес, 1 — повторения. */
export const WEIGHT_UNIT_INDEX = 0;
export const REPS_UNIT_INDEX = 1;

export function ensureUnitsMinLength(set: TrainingSet, min: number): TrainingSet {
  const units = [...set.units];
  let i = units.length;
  while (i < min) {
    units.push({
      name:
        i === 0
          ? DEFAULT_FIRST
          : i === 1
            ? DEFAULT_SECOND
            : `Параметр ${i + 1}`,
      value: 0,
    });
    i += 1;
  }
  return { ...set, units };
}

export function getUnitValue(set: TrainingSet, index: number): number {
  return set.units[index]?.value ?? 0;
}

export function setUnitValueAt(
  set: TrainingSet,
  index: number,
  value: number,
): TrainingSet {
  const withLen = ensureUnitsMinLength(set, index + 1);
  const units = [...withLen.units];
  const prev = units[index];
  units[index] = {
    name: prev?.name ?? (index === 0 ? DEFAULT_FIRST : DEFAULT_SECOND),
    value,
  };
  return { ...withLen, units };
}

export function getWeightLike(set: TrainingSet): number {
  return getUnitValue(set, WEIGHT_UNIT_INDEX);
}

export function getRepeatsLike(set: TrainingSet): number {
  return getUnitValue(set, REPS_UNIT_INDEX);
}

export function withWeightAndRepeats(
  set: TrainingSet,
  weight: number,
  reps: number,
): TrainingSet {
  let next = ensureUnitsMinLength(set, 2);
  next = setUnitValueAt(next, WEIGHT_UNIT_INDEX, weight);
  next = setUnitValueAt(next, REPS_UNIT_INDEX, reps);
  return next;
}

export function markSetDoneWithValues(
  set: TrainingSet,
  weight: number,
  reps: number,
): TrainingSet {
  return { ...withWeightAndRepeats(set, weight, reps), done: true };
}

export function cloneUnitsTemplate(source: TrainingSet): TrainingUnit[] {
  return source.units.map((u) => ({ name: u.name, value: 0 }));
}

/** Первый подход упражнения как шаблон имён единиц (из справочника упражнения). */
export function createEmptySetFromExerciseTemplate(
  templateSet?: TrainingSet,
): TrainingSet {
  if (templateSet?.units?.length) {
    return {
      done: false,
      units: cloneUnitsTemplate(templateSet),
    };
  }
  return {
    done: false,
    units: [
      { name: DEFAULT_FIRST, value: 0 },
      { name: DEFAULT_SECOND, value: 12 },
    ],
  };
}

export function unitsFromCatalogStrings(catalog: string[] | undefined): TrainingUnit[] {
  const names =
    catalog && catalog.length > 0 ? catalog : [DEFAULT_FIRST, DEFAULT_SECOND];
  return names.map((name, index) => ({
    name,
    value: index === 1 ? 10 : 0,
  }));
}

export function sumSetsWeightLike(sets: TrainingSet[]): number {
  return sets.reduce((sum, s) => sum + getWeightLike(s), 0);
}
