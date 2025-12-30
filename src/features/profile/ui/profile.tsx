import { useState } from "react";
import {
  User,
  Clock,
  Star,
  Calendar,
  Activity,
  Award,
  BarChart3,
} from "lucide-react";
import styles from "./profile.module.scss";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/model/routes";
import { useFetchProfile } from "@/entities/auth/use-profile-fetch";
import { useFetchActiveHistrory } from "@/entities/training-active/use-active-training-history-fetch";
import { useTrainingList } from "@/entities/training/use-training-fetch";

export const Profile = () => {
  const { profile } = useFetchProfile();
  const { history: trainingHistory } = useFetchActiveHistrory();
  const { trainings } = useTrainingList({});

  const [userData] = useState(profile);

  const stats = {
    totalTrainings: 0,
    totalDuration: 0,
    totalCalories: 0,
    favoriteExerciseCount: 0,
    streakDays: 7,
    completedThisWeek: 3,
  };

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
            <h1 className={styles.userName}>{userData?.email}</h1>
            <div className={styles.userTags}>
              <span className={styles.tag}>Участник с когда-то, я хз</span>
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <button className={styles.editButton}>Редактировать профиль</button>
          <button className={styles.settingsButton}>Настройки</button>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Activity size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalTrainings}</div>
            <div className={styles.statLabel}>Тренировок</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalDuration} мин</div>
            <div className={styles.statLabel}>Общее время</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Star size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.favoriteExerciseCount}
            </div>
            <div className={styles.statLabel}>Избранных упражнений</div>
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
                  <button className={styles.repeatButton}>
                    <Link to={ROUTES.TEST}>Подробнее</Link>
                  </button>
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
                <BarChart3 size={20} /> Прогресс за месяц
              </h2>
            </div>

            <div className={styles.progressChart}>
              <div className={styles.chartPlaceholder}>
                <div className={styles.chartBars}>
                  {[65, 80, 45, 90, 75, 85, 70, 95, 60, 82, 78, 88].map(
                    (height, index) => (
                      <div
                        key={index}
                        className={styles.chartBar}
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
                <div className={styles.chartLabels}>
                  <span>Янв</span>
                  <span>Фев</span>
                  <span>Мар</span>
                  <span>Апр</span>
                  <span>Май</span>
                  <span>Июн</span>
                  <span>Июл</span>
                  <span>Авг</span>
                  <span>Сен</span>
                  <span>Окт</span>
                  <span>Ноя</span>
                  <span>Дек</span>
                </div>
              </div>
            </div>
          </section>
          {/* Будущие избранные тренировки */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Award size={20} /> Избранные тренировки
              </h2>
            </div>

            <div className={styles.workoutsList}>
              {trainings
                .filter((w) => w.favorite)
                .map((training) => (
                  <div key={training.id} className={styles.workoutCard}>
                    <div className={styles.workoutHeader}>
                      <h3 className={styles.workoutName}>{training.name}</h3>
                      <button className={styles.workoutFavorite}>
                        <Star size={16} fill="currentColor" />
                      </button>
                    </div>
                    <div className={styles.workoutExercises}>
                      {training.exerciseTypes.map((exercise) => (
                        <span
                          key={exercise.id}
                          className={styles.workoutExercise}
                        >
                          {exercise.name}
                        </span>
                      ))}
                    </div>
                    <button className={styles.startWorkoutButton}>
                      Начать тренировку
                    </button>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
