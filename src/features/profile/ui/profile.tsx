import { useMemo } from "react";

import {
  User,
  Calendar,
  BarChart3,
  Activity,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFetchProfile } from "@/entities/auth/use-profile-fetch";
import { useFetchActiveHistory } from "@/entities/training-history/use-active-training-history-fetch";
import { useActiveTrainingDelete } from "@/entities/training-history/use-training-history-delete";
import { ROUTES } from "@/shared/model/routes";

import {
  computeDayOfWeekDistribution,
  computeMuscleDistribution,
  computeOverviewStats,
  computePersonalRecords,
  computeTopPrograms,
  computeWeeklyActivity,
  formatShortDate,
} from "../lib/profile-stats";

import styles from "./profile.module.scss";

export const Profile = () => {
  const { profile } = useFetchProfile();
  const { history: trainingHistory } = useFetchActiveHistory({
    sort: "dateStart",
  });
  const { history: allTrainingHistory } = useFetchActiveHistory({
    sort: "dateStart",
    limit: 500,
  });

  const navigator = useNavigate();

  const { deleteExercises, getIsPending: isDeletePendingById } =
    useActiveTrainingDelete();

  const overview = useMemo(
    () => computeOverviewStats(allTrainingHistory),
    [allTrainingHistory],
  );

  const weeklyActivity = useMemo(
    () => computeWeeklyActivity(allTrainingHistory, 12),
    [allTrainingHistory],
  );

  const dayOfWeek = useMemo(
    () => computeDayOfWeekDistribution(allTrainingHistory),
    [allTrainingHistory],
  );

  const muscles = useMemo(
    () => computeMuscleDistribution(allTrainingHistory),
    [allTrainingHistory],
  );

  const topPrograms = useMemo(
    () => computeTopPrograms(allTrainingHistory),
    [allTrainingHistory],
  );

  const personalRecords = useMemo(
    () => computePersonalRecords(allTrainingHistory),
    [allTrainingHistory],
  );

  const maxMuscle = Math.max(...muscles.map((m) => m.count), 1);

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

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Dumbbell size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{overview.trainingsCount}</span>
            <span className={styles.statLabel}>Всего тренировок</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Activity size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{overview.perWeek}</span>
            <span className={styles.statLabel}>В неделю (30 дн.)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Calendar size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{overview.uniqueDays}</span>
            <span className={styles.statLabel}>Дней с тренировкой</span>
          </div>
        </div>
      </div>

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
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
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
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
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

      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
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
              {trainingHistory.length === 0 ? (
                <div className={styles.emptyHint}>Тренировок пока нет</div>
              ) : (
                trainingHistory.map((training) => (
                  <div key={training.id} className={styles.historyItem}>
                    <div className={styles.historyDate}>
                      {formatDate(training.dateStart)}
                    </div>
                    <div className={styles.historyContent}>
                      <div className={styles.historyExercises}>
                        {training.exercises
                          .slice(0, 3)
                          .map((exercise, index) => (
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
                        {isDeletePendingById(training.id)
                          ? "Удаление..."
                          : "Удалить"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Trophy size={20} /> Личные рекорды
              </h2>
            </div>
            {personalRecords.length === 0 ? (
              <div className={styles.emptyHint}>
                Рекорды появятся после тренировок с весом
              </div>
            ) : (
              <div className={styles.recordsList}>
                {personalRecords.map((pr) => (
                  <div key={pr.exerciseName} className={styles.recordItem}>
                    <div className={styles.recordMain}>
                      <span className={styles.recordName}>
                        {pr.exerciseName}
                      </span>
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
        </div>

        <div className={styles.rightColumn}>
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

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Dumbbell size={20} /> Топ программ
              </h2>
            </div>
            {topPrograms.length === 0 ? (
              <div className={styles.emptyHint}>Программ пока нет</div>
            ) : (
              <div className={styles.programsList}>
                {topPrograms.map((program, index) => (
                  <div key={program.name} className={styles.programItem}>
                    <span className={styles.programRank}>{index + 1}</span>
                    <span className={styles.programName}>{program.name}</span>
                    <span className={styles.programCount}>
                      {program.count}×
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
