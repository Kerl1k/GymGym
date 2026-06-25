import { useEffect, useMemo, useState } from "react";

import { Calendar, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useFetchTrainingHistoryWithFilters } from "@/entities/training-history/use-training-history-with-filters";
import { useDebounce } from "@/shared/lib/useDebounce";
import { ROUTES } from "@/shared/model/routes";
import type { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

import styles from "./training-history.module.scss";

type PeriodKey = "all" | "30d" | "90d" | "365d";

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string; days?: number }> = [
  { key: "all", label: "За всё время" },
  { key: "30d", label: "30 дней", days: 30 },
  { key: "90d", label: "90 дней", days: 90 },
  { key: "365d", label: "1 год", days: 365 },
];

export const TrainingHistory = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("10");
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [period, setPeriod] = useState<PeriodKey>("all");

  const { exercises, isPending: isExercisesPending } = useExercisesFetchList({
    limit: 200,
  });
  const debouncedExerciseFilter = useDebounce(exerciseFilter, 500);
  const normalizedExerciseFilter = debouncedExerciseFilter.trim();
  const dateFrom = useMemo(() => {
    const periodOption = PERIOD_OPTIONS.find((option) => option.key === period);
    if (!periodOption?.days) return undefined;
    return new Date(
      Date.now() - periodOption.days * 24 * 60 * 60 * 1000,
    ).toISOString();
  }, [period]);

  useEffect(() => {
    setPage(1);
  }, [limit, normalizedExerciseFilter, sortDirection, period]);

  const numericLimit = Number(limit);
  const { history: trainingHistory, meta, isPending } =
    useFetchTrainingHistoryWithFilters({
      limit: Number.isFinite(numericLimit) ? numericLimit : 10,
      page,
      sort: "dateStart",
      sortDirection,
      exerciseName: normalizedExerciseFilter || undefined,
      dateFrom,
    });

  const totalPages = meta?.pages ?? 1;
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

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

  const formatDuration = (sets: ApiSchemas["Set"][]) => {
    // Calculate total duration based on sets and rest time
    const totalSets = sets.filter((s) => s.done).length;
    return `${totalSets} подходов`;
  };

  const handleExerciseSelect = (exerciseId: string) => {
    const selected = exercises.find((exercise) => exercise.id === exerciseId);
    if (!selected) return;
    setExerciseFilter(selected.name);
  };

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

      <div className={styles.filters}>
        <div className={styles.exerciseFilterControl}>
          <Button
            variant="outline"
            className={styles.exerciseFilterButton}
            onClick={() => setIsExerciseModalOpen(true)}
          >
            {exerciseFilter || "Выбрать упражнение"}
          </Button>

          <ExerciseSelectModal
            exercises={exercises}
            onSelect={handleExerciseSelect}
            isOpen={isExerciseModalOpen}
            close={() => setIsExerciseModalOpen(false)}
            isLoading={isExercisesPending}
            searchPlaceholder="Поиск упражнения"
            includeAllOption
            onSelectAll={() => setExerciseFilter("")}
          />
          {exerciseFilter && (
            <Button
              variant="ghost"
              onClick={() => setExerciseFilter("")}
              className={styles.clearExerciseFilterButton}
            >
              Сбросить
            </Button>
          )}
        </div>

        <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as "asc" | "desc")}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Сначала новые</SelectItem>
            <SelectItem value="asc">Сначала старые</SelectItem>
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className={styles.filterSelect}>
            <SelectValue placeholder="На странице" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 на странице</SelectItem>
            <SelectItem value="20">20 на странице</SelectItem>
            <SelectItem value="50">50 на странице</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <div className={styles.loading}>Загрузка истории тренировок...</div>
      )}

      {!isPending && trainingHistory.length === 0 ? (
        <div className={styles.emptyState}>
          <Activity size={48} />
          {normalizedExerciseFilter || period !== "all" ? (
            <p>По выбранным фильтрам тренировок не найдено</p>
          ) : (
            <>
              <p>У вас пока нет завершённых тренировок</p>
              <Link to={ROUTES.TRAINING} className={styles.startTrainingButton}>
                Начать первую тренировку
              </Link>
            </>
          )}
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

          <div className={styles.pagination}>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!hasPrevPage || isPending}
            >
              Назад
            </Button>
            <span className={styles.pageInfo}>
              Страница {Math.min(page, totalPages)} из {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!hasNextPage || isPending}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
