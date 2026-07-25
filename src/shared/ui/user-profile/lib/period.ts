import type { TrainingHistoryItem } from "./stats";

export type ScaleKey = "7d" | "30d" | "90d" | "365d" | "all";

export const SCALE_OPTIONS: Array<{
  key: ScaleKey;
  label: string;
  days?: number;
}> = [
  { key: "7d", label: "7 дней", days: 7 },
  { key: "30d", label: "30 дней", days: 30 },
  { key: "90d", label: "90 дней", days: 90 },
  { key: "365d", label: "1 год", days: 365 },
  { key: "all", label: "Всё время" },
];

export type DateRange = {
  fromTs: number | null;
  toTs: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getRangeFromScale(scale: ScaleKey, now = Date.now()): DateRange {
  const option = SCALE_OPTIONS.find((o) => o.key === scale);
  if (!option?.days) {
    return { fromTs: null, toTs: null };
  }
  return {
    fromTs: now - option.days * DAY_MS,
    toTs: null,
  };
}

export function filterHistoryByRange(
  history: TrainingHistoryItem[],
  range: DateRange,
): TrainingHistoryItem[] {
  const { fromTs, toTs } = range;
  if (fromTs == null && toTs == null) return history;

  return history.filter((item) => {
    const ts = new Date(item.dateStart).getTime();
    if (!Number.isFinite(ts)) return false;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  });
}

export function getRangeSpanDays(
  range: DateRange,
  now = Date.now(),
): number | null {
  if (range.fromTs == null) return null;
  const to = range.toTs ?? now;
  return Math.max(1, Math.ceil((to - range.fromTs) / DAY_MS));
}

export function getWeeksForRange(range: DateRange, now = Date.now()): number {
  const spanDays = getRangeSpanDays(range, now);
  if (spanDays == null) return 12;
  return Math.min(52, Math.max(1, Math.ceil(spanDays / 7)));
}

export function getRangeEndDate(range: DateRange, now = Date.now()): Date {
  return new Date(range.toTs ?? now);
}
