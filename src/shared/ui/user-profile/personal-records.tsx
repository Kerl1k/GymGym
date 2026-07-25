import { Trophy } from "lucide-react";

import {
  formatShortDate,
  type PersonalRecord,
} from "./lib/stats";
import styles from "./user-profile.module.scss";

type PersonalRecordsProps = {
  records: PersonalRecord[];
};

export function PersonalRecords({ records }: PersonalRecordsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Trophy size={20} /> Личные рекорды
        </h2>
      </div>
      {records.length === 0 ? (
        <div className={styles.emptyHint}>
          Рекорды появятся после тренировок с весом
        </div>
      ) : (
        <div className={styles.recordsList}>
          {records.map((pr) => (
            <div key={pr.exerciseName} className={styles.recordItem}>
              <div className={styles.recordMain}>
                <span className={styles.recordName}>{pr.exerciseName}</span>
                <span className={styles.recordDate}>
                  {formatShortDate(pr.date)}
                </span>
              </div>
              <div className={styles.recordValue}>
                {pr.weight} кг
                {pr.reps > 0 ? (
                  <span className={styles.recordReps}>× {pr.reps}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
