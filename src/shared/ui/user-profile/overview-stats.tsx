import { Activity, Calendar, Dumbbell } from "lucide-react";

import styles from "./user-profile.module.scss";

type OverviewStatsProps = {
  trainingsCount: number;
  perWeek: number;
  uniqueDays: number;
  perWeekSpanDays?: number;
};

export function OverviewStats({
  trainingsCount,
  perWeek,
  uniqueDays,
  perWeekSpanDays = 30,
}: OverviewStatsProps) {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Dumbbell size={22} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{trainingsCount}</span>
          <span className={styles.statLabel}>Всего тренировок</span>
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Activity size={22} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{perWeek}</span>
          <span className={styles.statLabel}>
            В неделю ({perWeekSpanDays} дн.)
          </span>
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Calendar size={22} />
        </div>
        <div className={styles.statContent}>
          <span className={styles.statValue}>{uniqueDays}</span>
          <span className={styles.statLabel}>Дней с тренировкой</span>
        </div>
      </div>
    </div>
  );
}
