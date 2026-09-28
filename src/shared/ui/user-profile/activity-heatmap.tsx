import { CalendarDays } from "lucide-react";

import styles from "./user-profile.module.scss";

import type { HeatmapDay } from "./lib/stats";

type ActivityHeatmapProps = {
  columns: HeatmapDay[][];
};

const ROW_LABELS = ["Пн", "", "Ср", "", "Пт", "", ""];

function getLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

function formatCellTitle(day: HeatmapDay): string {
  const date = day.date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return day.count > 0 ? `${date}: тренировок — ${day.count}` : `${date}: без тренировок`;
}

export function ActivityHeatmap({ columns }: ActivityHeatmapProps) {
  const activeDays = columns.flat().filter((d) => d.count > 0).length;

  return (
    <section className={styles.section} style={{ marginBottom: 24 }}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <CalendarDays size={20} /> Календарь активности
        </h2>
        <span className={styles.statLabel}>
          {activeDays} дн. за {columns.length} нед.
        </span>
      </div>
      <div className={styles.heatmapScroll}>
        <div className={styles.heatmap}>
          <div className={styles.heatmapLabels}>
            {ROW_LABELS.map((label, index) => (
              <span key={index} className={styles.heatmapLabel}>
                {label}
              </span>
            ))}
          </div>
          {columns.map((column) => (
            <div key={column[0]!.key} className={styles.heatmapColumn}>
              {column.map((day) => (
                <div
                  key={day.key}
                  className={styles.heatmapCell}
                  data-level={getLevel(day.count)}
                  data-future={day.isFuture}
                  title={day.isFuture ? undefined : formatCellTitle(day)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heatmapLegend}>
        Меньше
        {[0, 1, 2, 3].map((level) => (
          <div key={level} className={styles.heatmapCell} data-level={level} />
        ))}
        Больше
      </div>
    </section>
  );
}
