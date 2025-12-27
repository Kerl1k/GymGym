import { useState } from "react";
import {
  User,
  Clock,
  Target,
  Star,
  Calendar,
  Activity,
  Award,
  BarChart3,
} from "lucide-react";
import styles from "./profile.module.scss";
import { trainingHistory as w, workouts as er } from "../mockData";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/model/routes";

export const Profile = () => {
  const [userData] = useState({
    id: "123",
    email: "user@example.com",
    // Будущие поля - заглушки
    name: "Алексей QWE",
    avatarUrl: null,
    level: "Продвинутый",
    joinDate: "2024-01-15",
    bio: "Люблю активный образ жизни и регулярные тренировки",
    goals: ["Набрать мышечную массу", "Улучшить выносливость"],
  });

  const [trainingHistory, setTrainingHistory] = useState<any>(w);
  const [workouts, setWorkouts] = useState<any>(er);
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalDuration: 0,
    totalCalories: 0,
    favoriteExerciseCount: 0,
    streakDays: 7,
    completedThisWeek: 3,
  });

  const formatDate = (dateString: any) => {
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
            {userData.avatarUrl ? (
              <img src={userData.avatarUrl} alt={userData.name} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{userData.name}</h1>
            <p className={styles.userEmail}>{userData.email}</p>
            <div className={styles.userTags}>
              <span className={styles.tag}>
                Участник с {new Date(userData.joinDate).getFullYear()}
              </span>
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
              <button className={styles.viewAllButton}>Показать все</button>
            </div>

            <div className={styles.historyList}>
              {trainingHistory.map((training: any) => (
                <div key={training.id} className={styles.historyItem}>
                  <div className={styles.historyDate}>
                    {formatDate(training.dateStart)}
                  </div>
                  <div className={styles.historyContent}>
                    <div className={styles.historyExercises}>
                      {training.exercises.slice(0, 3).map((exercise: any) => (
                        <span key={exercise.id} className={styles.exerciseTag}>
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
              {workouts
                .filter((w: any) => w.favorite)
                .map((workout: any) => (
                  <div key={workout.id} className={styles.workoutCard}>
                    <div className={styles.workoutHeader}>
                      <h3 className={styles.workoutName}>{workout.name}</h3>
                      <button className={styles.workoutFavorite}>
                        <Star size={16} fill="currentColor" />
                      </button>
                    </div>
                    <div className={styles.workoutExercises}>
                      {workout.exercises.map((exercise: any) => (
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
