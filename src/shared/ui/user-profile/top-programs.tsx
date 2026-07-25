import { Dumbbell } from "lucide-react";

import styles from "./user-profile.module.scss";

type TopProgramsProps = {
  programs: Array<{ name: string; count: number }>;
};

export function TopPrograms({ programs }: TopProgramsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Dumbbell size={20} /> Топ программ
        </h2>
      </div>
      {programs.length === 0 ? (
        <div className={styles.emptyHint}>Программ пока нет</div>
      ) : (
        <div className={styles.programsList}>
          {programs.map((program, index) => (
            <div key={program.name} className={styles.programItem}>
              <span className={styles.programRank}>{index + 1}</span>
              <span className={styles.programName}>{program.name}</span>
              <span className={styles.programCount}>{program.count}×</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
