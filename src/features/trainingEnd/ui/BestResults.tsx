import { Trophy } from "lucide-react";

import { Badge } from "@/shared/ui/kit/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import {
  computeBestByExercise,
  formatShortDate,
  isBetterRecord,
  type PersonalRecord,
  type TrainingHistoryItem,
} from "@/shared/ui/user-profile";

type BestResultsProps = {
  current: TrainingHistoryItem;
  previousHistory: TrainingHistoryItem[];
  isPending?: boolean;
};

function formatSet(record: Pick<PersonalRecord, "weight" | "reps">) {
  return record.reps > 0
    ? `${record.weight} кг × ${record.reps}`
    : `${record.weight} кг`;
}

export function BestResults({
  current,
  previousHistory,
  isPending = false,
}: BestResultsProps) {
  if (isPending) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const previousBestByExercise = computeBestByExercise(previousHistory);
  const currentBestByExercise = computeBestByExercise([current]);

  const exerciseNames = [
    ...new Set(current.exercises.map((exercise) => exercise.name)),
  ];

  const rows = exerciseNames
    .map((exerciseName) => {
      const currentBest = currentBestByExercise.get(exerciseName);
      const previousBest = previousBestByExercise.get(exerciseName);
      if (!currentBest && !previousBest) return null;

      const isNewRecord = Boolean(
        currentBest &&
          previousBest &&
          isBetterRecord(currentBest, previousBest),
      );

      return {
        exerciseName,
        currentBest,
        previousBest,
        isNewRecord,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
      <Card className="gap-4 py-4">
        <CardHeader className="px-4 pb-0 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Лучшие результаты
          </CardTitle>
          <CardDescription>
            {previousHistory.length > 0
              ? `По тренировке «${current.name}» · ${previousHistory.length} предыдущих`
              : `Первая тренировка «${current.name}»`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.exerciseName}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{row.exerciseName}</div>
                  {row.previousBest ? (
                    <div className="text-muted-foreground text-xs">
                      Лучший ранее: {formatSet(row.previousBest)}
                      {" · "}
                      {formatShortDate(row.previousBest.date)}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      Нет предыдущих результатов
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {row.currentBest ? (
                    <span className="font-semibold tabular-nums">
                      {formatSet(row.currentBest)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                  {row.isNewRecord ? (
                    <Badge variant="success" size="sm">
                      Новый рекорд
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
