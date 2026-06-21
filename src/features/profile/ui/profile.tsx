import { useMemo } from "react";

import { User, Calendar, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useFetchProfile } from "@/entities/auth/use-profile-fetch";
import { useFetchActiveHistrory } from "@/entities/training-history/use-active-training-history-fetch";
import { useActiveTrainingDelete } from "@/entities/training-history/use-training-history-delete";
import { ROUTES } from "@/shared/model/routes";

import styles from "./profile.module.scss";

const MONTH_LABELS = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

export const Profile = () => {
  const { profile } = useFetchProfile();
  const { history: trainingHistory } = useFetchActiveHistrory({
    sort: "dateStart",
  });
  const { history: allTrainingHistory } = useFetchActiveHistrory({
    sort: "dateStart",
    limit: 500,
  });

  const navigator = useNavigate();

  const { deleteExercises, getIsPending: isDeletePendingById } =
    useActiveTrainingDelete();

  const monthlyWorkouts = useMemo(() => {
    const year = new Date().getFullYear();
    const counts = Array.from({ length: 12 }, () => 0);

    for (const training of allTrainingHistory) {
      const date = new Date(training.dateStart);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) continue;
      counts[date.getMonth()]! += 1;
    }

    const maxCount = Math.max(...counts, 1);

    return counts.map((count, index) => ({
      label: MONTH_LABELS[index]!,
      count,
      heightPercent: count > 0 ? (count / maxCount) * 100 : 0,
    }));
  }, [allTrainingHistory]);

  const workoutsThisMonth = useMemo(() => {
    const now = new Date();
    return allTrainingHistory.filter((training) => {
      const date = new Date(training.dateStart);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }).length;
  }, [allTrainingHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.profilePage}>
      {/* Шапка профиля */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <User size={40} />
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{profile?.email ?? "—"}</h1>
          </div>
        </div>
      </div>

      {/* Основной контент в две колонки */}
      <div className={styles.contentGrid}>
        {/* Левая колонка */}
        <div className={styles.leftColumn}>
          {/* История тренировок */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Calendar size={20} /> История тренировок
              </h2>
              <Link
                to={ROUTES.TRAINING_HISTORY}
                className={styles.viewAllButton}
              >
                Показать все
              </Link>
            </div>

            <div className={styles.historyList}>
              {trainingHistory.map((training) => (
                <div key={training.id} className={styles.historyItem}>
                  <div className={styles.historyDate}>
                    {formatDate(training.dateStart)}
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
                          +{training.exercises?.length - 3}
                        </span>
                      )}
                    </div>
                    <div className={styles.historyStats}>
                      <span className={styles.stat}>подходов</span>
                      <span className={styles.stat}>
                        {training.exercises?.length} упражнений
                      </span>
                    </div>
                  </div>
                  <div className={styles.historyActions}>
                    <button
                      className={styles.repeatButton}
                      onClick={() =>
                        navigator(`${ROUTES.END.replace(/:id/, training.id)}`)
                      }
                    >
                      Подробнее
                    </button>
                    <button
                      className={styles.deleteButton}
                      disabled={isDeletePendingById(training.id)}
                      onClick={() => deleteExercises(training.id)}
                    >
                      {isDeletePendingById(training.id) ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Правая колонка */}
        <div className={styles.rightColumn}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <BarChart3 size={20} /> Тренировок за месяц
              </h2>
              <span className={styles.sectionCount}>{workoutsThisMonth}</span>
            </div>

            <div className={styles.progressChart}>
              <div className={styles.chartPlaceholder}>
                <div className={styles.chartBars}>
                  {monthlyWorkouts.map((month) => (
                    <div
                      key={month.label}
                      className={styles.chartBarWrapper}
                      title={`${month.label}: ${month.count}`}
                    >
                      <div
                        className={styles.chartBar}
                        style={{
                          height:
                            month.count > 0
                              ? `${Math.max(month.heightPercent, 8)}%`
                              : "4px",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className={styles.chartLabels}>
                  {monthlyWorkouts.map((month) => (
                    <span key={month.label}>{month.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
