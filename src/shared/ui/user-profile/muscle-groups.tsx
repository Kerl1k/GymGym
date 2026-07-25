import { Activity } from "lucide-react";

import styles from "./user-profile.module.scss";

type MuscleGroupsProps = {
  muscles: Array<{ name: string; count: number }>;
};

export function MuscleGroups({ muscles }: MuscleGroupsProps) {
  const maxMuscle = Math.max(...muscles.map((m) => m.count), 1);

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Activity size={20} /> Группы мышц
        </h2>
      </div>
      {muscles.length === 0 ? (
        <div className={styles.emptyHint}>Нет данных по мышцам</div>
      ) : (
        <div className={styles.muscleList}>
          {muscles.map((muscle) => (
            <div key={muscle.name} className={styles.muscleRow}>
              <div className={styles.muscleMeta}>
                <span className={styles.muscleName}>{muscle.name}</span>
                <span className={styles.muscleCount}>{muscle.count}</span>
              </div>
              <div className={styles.muscleBarTrack}>
                <div
                  className={styles.muscleBarFill}
                  style={{
                    width: `${(muscle.count / maxMuscle) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
