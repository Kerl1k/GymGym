import { BarChart3, Calendar } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import styles from "./user-profile.module.scss";

type ChartPoint = {
  count: number;
};

type ActivityChartsProps = {
  weeklyActivity: Array<ChartPoint & { week: string }>;
  dayOfWeek: Array<ChartPoint & { day: string }>;
};

function ChartTooltipStyle() {
  return {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
  };
}

export function ActivityCharts({
  weeklyActivity,
  dayOfWeek,
}: ActivityChartsProps) {
  return (
    <div className={styles.chartsRow}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={20} /> По неделям
          </h2>
        </div>
        <div className={styles.chartBox}>
          {weeklyActivity.some((w) => w.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value) => [`${value}`, "Тренировок"]}
                  contentStyle={ChartTooltipStyle()}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-2, #4299e1)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyHint}>Пока нет данных</div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Calendar size={20} /> Дни недели
          </h2>
        </div>
        <div className={styles.chartBox}>
          {dayOfWeek.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeek}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  formatter={(value) => [`${value}`, "Тренировок"]}
                  contentStyle={ChartTooltipStyle()}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-1, #667eea)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyHint}>Пока нет данных</div>
          )}
        </div>
      </section>
    </div>
  );
}
