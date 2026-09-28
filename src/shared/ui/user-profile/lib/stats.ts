import {
  estimateOneRepMax,
  getRepeatsLike,
  getWeightLike,
  sumSetsTonnage,
} from "@/shared/lib/active-training-units";
import type { ApiSchemas } from "@/shared/schema";

export type TrainingHistoryItem = ApiSchemas["TrainingHistory"];

const DAY_LABELS_ORDERED = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function weekKey(date: Date): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return toLocalDateKey(d);
}

function formatWeekLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export type OverviewStatsOptions = {
  /** Length of the selected period in days; when set, perWeek uses the whole period */
  spanDays?: number | null;
};

export function computeOverviewStats(
  history: TrainingHistoryItem[],
  options: OverviewStatsOptions = {},
) {
  const dates = history
    .map((t) => toDate(t.dateStart))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const uniqueDays = new Set(dates.map((d) => startOfDay(d)));
  const trainingsCount = history.length;

  let totalExercises = 0;
  let totalSets = 0;
  let doneSets = 0;
  let totalTonnage = 0;

  for (const training of history) {
    totalExercises += training.exercises.length;
    for (const exercise of training.exercises) {
      totalSets += exercise.sets.length;
      const done = exercise.sets.filter((s) => s.done);
      doneSets += done.length;
      totalTonnage += sumSetsTonnage(done);
    }
  }

  const now = Date.now();
  const spanDays =
    options.spanDays != null && options.spanDays > 0 ? options.spanDays : 30;
  const spanMs = spanDays * 24 * 60 * 60 * 1000;
  const inSpan =
    options.spanDays != null && options.spanDays > 0
      ? trainingsCount
      : dates.filter((d) => now - d.getTime() <= spanMs).length;
  const perWeek = inSpan / (spanDays / 7);

  const daySet = uniqueDays;
  let streak = 0;
  const today = startOfDay(new Date());
  let cursor = daySet.has(today) ? today : today - 24 * 60 * 60 * 1000;
  while (daySet.has(cursor)) {
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }

  return {
    trainingsCount,
    uniqueDays: uniqueDays.size,
    perWeek: Math.round(perWeek * 10) / 10,
    perWeekSpanDays: spanDays,
    streak,
    avgExercises:
      trainingsCount > 0
        ? Math.round((totalExercises / trainingsCount) * 10) / 10
        : 0,
    avgSets:
      trainingsCount > 0
        ? Math.round((totalSets / trainingsCount) * 10) / 10
        : 0,
    donePercent: totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0,
    totalTonnage: Math.round(totalTonnage),
  };
}

export type HeatmapDay = {
  key: string;
  date: Date;
  count: number;
  isFuture: boolean;
};

/** Columns are weeks (Mon..Sun), the last column contains today. */
export function computeActivityHeatmap(
  history: TrainingHistoryItem[],
  weeks = 26,
  endDate: Date = new Date(),
): HeatmapDay[][] {
  const counts = new Map<string, number>();
  for (const training of history) {
    const date = toDate(training.dateStart);
    if (!date) continue;
    const key = toLocalDateKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = startOfDay(endDate);
  const lastMonday = new Date(endDate);
  lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay() + 6) % 7));
  lastMonday.setHours(0, 0, 0, 0);

  const columns: HeatmapDay[][] = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const column: HeatmapDay[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(lastMonday);
      date.setDate(lastMonday.getDate() - w * 7 + d);
      const key = toLocalDateKey(date);
      column.push({
        key,
        date,
        count: counts.get(key) ?? 0,
        isFuture: date.getTime() > today,
      });
    }
    columns.push(column);
  }

  return columns;
}

export function computeWeeklyActivity(
  history: TrainingHistoryItem[],
  weeks = 12,
  endDate: Date = new Date(),
) {
  const buckets = new Map<string, number>();

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i * 7);
    buckets.set(weekKey(d), 0);
  }

  for (const training of history) {
    const date = toDate(training.dateStart);
    if (!date) continue;
    const key = weekKey(date);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([key, count]) => ({
    week: formatWeekLabel(key),
    count,
  }));
}

export function computeDayOfWeekDistribution(history: TrainingHistoryItem[]) {
  const counts = Array.from({ length: 7 }, () => 0);

  for (const training of history) {
    const date = toDate(training.dateStart);
    if (!date) continue;
    counts[date.getDay()]! += 1;
  }

  const ordered = [1, 2, 3, 4, 5, 6, 0].map((dow, index) => ({
    day: DAY_LABELS_ORDERED[index]!,
    count: counts[dow]!,
  }));

  return ordered;
}

export function computeMuscleDistribution(history: TrainingHistoryItem[]) {
  const map = new Map<string, number>();

  for (const training of history) {
    for (const exercise of training.exercises) {
      for (const muscle of exercise.muscleGroups) {
        const name = muscle.trim();
        if (!name) continue;
        map.set(name, (map.get(name) ?? 0) + 1);
      }
    }
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function computeTopPrograms(history: TrainingHistoryItem[], limit = 5) {
  const map = new Map<string, number>();

  for (const training of history) {
    const name = training.name?.trim() || "Без названия";
    map.set(name, (map.get(name) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type PersonalRecord = {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  dateTs: number;
  /** Best estimated 1RM across all sets, may come from a different set than `weight`. */
  estimatedOneRepMax: number;
};

export function isBetterRecord(
  candidate: Pick<PersonalRecord, "weight" | "reps">,
  baseline: Pick<PersonalRecord, "weight" | "reps">,
): boolean {
  return (
    candidate.weight > baseline.weight ||
    (candidate.weight === baseline.weight && candidate.reps > baseline.reps)
  );
}

export function computeBestByExercise(
  history: TrainingHistoryItem[],
): Map<string, PersonalRecord> {
  const best = new Map<string, PersonalRecord>();

  for (const training of history) {
    const date = toDate(training.dateStart);
    if (!date) continue;
    const dateTs = date.getTime();

    for (const exercise of training.exercises) {
      for (const set of exercise.sets) {
        if (!set.done && set.units.every((u) => u.value === 0)) continue;
        const weight = getWeightLike(set);
        const reps = getRepeatsLike(set);
        if (weight <= 0) continue;

        const prev = best.get(exercise.name);
        const better = !prev || isBetterRecord({ weight, reps }, prev);
        const oneRepMax = Math.max(
          estimateOneRepMax(weight, reps),
          prev?.estimatedOneRepMax ?? 0,
        );

        if (better) {
          best.set(exercise.name, {
            exerciseName: exercise.name,
            weight,
            reps,
            date: training.dateStart,
            dateTs,
            estimatedOneRepMax: oneRepMax,
          });
        } else if (prev) {
          prev.estimatedOneRepMax = oneRepMax;
        }
      }
    }
  }

  return best;
}

export function computePersonalRecords(
  history: TrainingHistoryItem[],
  limit = 6,
): PersonalRecord[] {
  return [...computeBestByExercise(history).values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

export function formatShortDate(value: string): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatHistoryDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
