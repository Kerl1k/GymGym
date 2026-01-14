import { Calendar, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";

import { useFetchActiveHistrory } from "@/entities/training-history/use-active-training-history-fetch";
import { ROUTES } from "@/shared/model/routes";

import styles from "./training-history.module.scss";

export const TrainingHistory = () => {
  const { history: trainingHistory, isPending } = useFetchActiveHistrory({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (
    sets: { weight: number; repeatCount: number; done: boolean }[],
  ) => {
    // Calculate total duration based on sets and rest time
    const totalSets = sets.filter((s) => s.done).length;
    return `${totalSets} подходов`;
  };

  if (isPending) {
    return <div className={styles.loading}>Загрузка истории тренировок...</div>;
  }

  return (
    <div className={styles.trainingHistoryPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Calendar size={24} /> История тренировок
        </h1>
        <Link to={ROUTES.PROFILE} className={styles.backButton}>
          Назад в профиль
        </Link>
      </div>

      {trainingHistory.length === 0 ? (
        <div className={styles.emptyState}>
          <Activity size={48} />
          <p>У вас пока нет завершённых тренировок</p>
          <Link to={ROUTES.TRAINING} className={styles.startTrainingButton}>
            Начать первую тренировку
          </Link>
        </div>
      ) : (
        <div className={styles.historyList}>
          {trainingHistory.map((training) => (
            <div key={training.id} className={styles.historyItem}>
              <div className={styles.historyHeader}>
                <div className={styles.historyDate}>
                  {formatDate(training.dateStart)}
                </div>
                <div className={styles.historyDuration}>
                  <Clock size={16} />
                  {formatDuration(training.exercises.flatMap((e) => e.sets))}
                </div>
              </div>

              <div className={styles.historyContent}>
                <div className={styles.exercisesList}>
                  {training.exercises.map((exercise, index) => (
                    <div key={index} className={styles.exerciseItem}>
                      <span className={styles.exerciseName}>
                        {exercise.name}
                      </span>
                      <span className={styles.exerciseStats}>
                        {exercise.sets.filter((s) => s.done).length} подходов ×{" "}
                        {exercise.sets.length} серий
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.trainingStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Упражнений</span>
                    <span className={styles.statValue}>
                      {training.exercises.length}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Всего подходов</span>
                    <span className={styles.statValue}>
                      {training.exercises.reduce(
                        (sum, ex) => sum + ex.sets.filter((s) => s.done).length,
                        0,
                      )}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Всего серий</span>
                    <span className={styles.statValue}>
                      {training.exercises.reduce(
                        (sum, ex) => sum + ex.sets.length,
                        0,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
