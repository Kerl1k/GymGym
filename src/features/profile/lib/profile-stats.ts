import {
  getRepeatsLike,
  getWeightLike,
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

export function computeOverviewStats(history: TrainingHistoryItem[]) {
  const dates = history
    .map((t) => toDate(t.dateStart))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const uniqueDays = new Set(dates.map((d) => startOfDay(d)));
  const trainingsCount = history.length;

  let totalExercises = 0;
  let totalSets = 0;
  let doneSets = 0;

  for (const training of history) {
    totalExercises += training.exercises.length;
    for (const exercise of training.exercises) {
      totalSets += exercise.sets.length;
      doneSets += exercise.sets.filter((s) => s.done).length;
    }
  }

  const now = Date.now();
  const days30 = 30 * 24 * 60 * 60 * 1000;
  const recent = dates.filter((d) => now - d.getTime() <= days30).length;
  const perWeek = recent / (30 / 7);

  // Streak: consecutive calendar days with ≥1 training, counting back from today or yesterday
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
    streak,
    avgExercises:
      trainingsCount > 0
        ? Math.round((totalExercises / trainingsCount) * 10) / 10
        : 0,
    avgSets:
      trainingsCount > 0
        ? Math.round((totalSets / trainingsCount) * 10) / 10
        : 0,
    donePercent:
      totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0,
  };
}

export function computeWeeklyActivity(
  history: TrainingHistoryItem[],
  weeks = 12,
) {
  const now = new Date();
  const buckets = new Map<string, number>();

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(now);
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

  // reorder to Mon..Sun
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

export function computeTopPrograms(
  history: TrainingHistoryItem[],
  limit = 5,
) {
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
};

export function computePersonalRecords(
  history: TrainingHistoryItem[],
  limit = 6,
): PersonalRecord[] {
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
        const better =
          !prev ||
          weight > prev.weight ||
          (weight === prev.weight && reps > prev.reps);

        if (better) {
          best.set(exercise.name, {
            exerciseName: exercise.name,
            weight,
            reps,
            date: training.dateStart,
            dateTs,
          });
        }
      }
    }
  }

  return [...best.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

export type HeatmapDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export function computeHeatmap(
  history: TrainingHistoryItem[],
  days = 119,
): { cells: HeatmapDay[]; weeks: HeatmapDay[][] } {
  const counts = new Map<string, number>();

  for (const training of history) {
    const date = toDate(training.dateStart);
    if (!date) continue;
    const key = toLocalDateKey(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toLocalDateKey(d);
    const count = counts.get(key) ?? 0;
    let level: HeatmapDay["level"] = 0;
    if (count === 1) level = 1;
    else if (count === 2) level = 2;
    else if (count === 3) level = 3;
    else if (count >= 4) level = 4;
    cells.push({ date: key, count, level });
  }

  // pad start so weeks start on Monday
  const firstKey = cells[0]!.date;
  const [fy, fm, fd] = firstKey.split("-").map(Number);
  const first = new Date(fy!, fm! - 1, fd!);
  const pad = (first.getDay() + 6) % 7;
  const padded: (HeatmapDay | null)[] = [
    ...Array.from({ length: pad }, () => null),
    ...cells,
  ];

  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7).map(
      (cell) =>
        cell ??
        ({
          date: "",
          count: 0,
          level: 0,
        } as HeatmapDay),
    );
    while (week.length < 7) {
      week.push({ date: "", count: 0, level: 0 });
    }
    weeks.push(week as HeatmapDay[]);
  }

  return { cells, weeks };
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
