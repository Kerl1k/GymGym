import type { ApiSchemas } from "@/shared/schema";

import {
  getSetOneRepMax,
  sumSetsTonnage,
} from "./active-training-units";

type TrainingHistory = ApiSchemas["TrainingHistory"];

const CSV_SEPARATOR = ";";

function escapeCsv(value: string | number | boolean): string {
  const str = String(value);
  if (/[";\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** One row per set; unit columns are the union of unit names in order of appearance. */
export function trainingHistoryToCsv(history: TrainingHistory[]): string {
  const unitNames: string[] = [];
  const seen = new Set<string>();
  for (const training of history) {
    for (const exercise of training.exercises) {
      for (const set of exercise.sets) {
        for (const unit of set.units) {
          const name = unit.name?.trim() || "Параметр";
          if (!seen.has(name)) {
            seen.add(name);
            unitNames.push(name);
          }
        }
      }
    }
  }

  const header = [
    "Дата",
    "Тренировка",
    "Упражнение",
    "Группы мышц",
    "Подход",
    "Выполнен",
    ...unitNames,
  ];

  const rows = [header.map(escapeCsv).join(CSV_SEPARATOR)];

  for (const training of history) {
    for (const exercise of training.exercises) {
      exercise.sets.forEach((set, index) => {
        const valuesByName = new Map<string, number>();
        for (const unit of set.units) {
          valuesByName.set(unit.name?.trim() || "Параметр", unit.value);
        }
        const row = [
          formatDateTime(training.dateStart),
          training.name,
          exercise.name,
          exercise.muscleGroups.join(", "),
          index + 1,
          set.done ? "да" : "нет",
          ...unitNames.map((name) =>
            valuesByName.has(name)
              ? String(valuesByName.get(name)).replace(".", ",")
              : "",
          ),
        ];
        rows.push(row.map(escapeCsv).join(CSV_SEPARATOR));
      });
    }
  }

  return rows.join("\r\n");
}

export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string,
) {
  // BOM lets Excel detect UTF-8 for Cyrillic text.
  const bom = mimeType.startsWith("text/csv") ? "\uFEFF" : "";
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportFileName(extension: "csv" | "json"): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `gym-note-history-${y}-${m}-${d}.${extension}`;
}

export function trainingSummaryText(training: TrainingHistory): string {
  const date = new Date(training.dateStart).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  const lines = [`🏋️ ${training.name} — ${date}`, ""];
  let totalDoneSets = 0;
  let totalTonnage = 0;

  for (const exercise of training.exercises) {
    const done = exercise.sets.filter((s) => s.done);
    if (done.length === 0) continue;
    totalDoneSets += done.length;
    totalTonnage += sumSetsTonnage(done);

    const setsText = done
      .map((set) => {
        const [first, second] = set.units;
        if (!first) return "—";
        return second ? `${first.value}×${second.value}` : `${first.value}`;
      })
      .join(", ");
    const oneRepMax = Math.max(0, ...done.map(getSetOneRepMax));
    lines.push(
      `• ${exercise.name}: ${setsText}${oneRepMax > 0 ? ` (1ПМ ≈ ${oneRepMax} кг)` : ""}`,
    );
  }

  lines.push("");
  lines.push(`Подходов: ${totalDoneSets}`);
  if (totalTonnage > 0) {
    lines.push(`Тоннаж: ${Math.round(totalTonnage).toLocaleString("ru-RU")} кг`);
  }

  return lines.join("\n");
}

/** Returns how the text was shared so the caller can show feedback. */
export async function shareText(
  title: string,
  text: string,
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
