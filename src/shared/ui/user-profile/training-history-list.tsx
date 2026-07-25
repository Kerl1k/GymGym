import { Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ROUTES } from "@/shared/model/routes";

import {
  formatHistoryDate,
  type TrainingHistoryItem,
} from "./lib/stats";
import styles from "./user-profile.module.scss";

type TrainingHistoryListProps = {
  history: TrainingHistoryItem[];
  showViewAll?: boolean;
  onDelete?: (id: string) => void;
  isDeletePending?: (id: string) => boolean;
};

export function TrainingHistoryList({
  history,
  showViewAll = false,
  onDelete,
  isDeletePending,
}: TrainingHistoryListProps) {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Calendar size={20} /> История тренировок
        </h2>
        {showViewAll ? (
          <Link to={ROUTES.TRAINING_HISTORY} className={styles.viewAllButton}>
            Показать все
          </Link>
        ) : null}
      </div>

      <div className={styles.historyList}>
        {history.length === 0 ? (
          <div className={styles.emptyHint}>Тренировок пока нет</div>
        ) : (
          history.map((training) => (
            <div key={training.id} className={styles.historyItem}>
              <div className={styles.historyDate}>
                {formatHistoryDate(training.dateStart)}
              </div>
              <div className={styles.historyContent}>
                <div className={styles.historyExercises}>
                  {training.exercises.slice(0, 3).map((exercise, index) => (
                    <span key={index} className={styles.exerciseTag}>
                      {exercise.name}
                    </span>
                  ))}
                  {training.exercises?.length > 3 && (
                    <span className={styles.moreExercises}>
                      +{training.exercises.length - 3}
                    </span>
                  )}
                </div>
                <div className={styles.historyStats}>
                  <span className={styles.stat}>
                    {training.name || "Тренировка"}
                  </span>
                  <span className={styles.stat}>
                    {training.exercises?.length} упражнений
                  </span>
                </div>
              </div>
              <div className={styles.historyActions}>
                <button
                  type="button"
                  className={styles.detailButton}
                  onClick={() =>
                    navigate(ROUTES.END.replace(/:id/, training.id))
                  }
                >
                  Подробнее
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    disabled={isDeletePending?.(training.id)}
                    onClick={() => onDelete(training.id)}
                  >
                    {isDeletePending?.(training.id) ? "Удаление..." : "Удалить"}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
