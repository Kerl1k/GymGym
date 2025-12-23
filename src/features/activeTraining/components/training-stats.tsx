import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ClockIcon, TrendingUpIcon, AwardIcon, TargetIcon } from "lucide-react";
import { ApiSchemas } from "@/shared/schema";

interface TrainingStatsProps {
  training: ApiSchemas["ActiveTraining"];
}

const AVG_TIME_PER_SET = 60;

export function TrainingStats({ training }: TrainingStatsProps) {
  const totalExercises = training.exercises.length;

  const totalSets = training.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const completedSets = training.exercises.reduce(
    (sum, ex) => sum + ex.completedSets,
    0,
  );

  const estimateRemainingTime = () => {
    const restTime = training.exercises.reduce((sum, ex) => {
      const unCompletedSets = ex.sets.length - ex.completedSets;
      return (
        sum + ex.restTime * unCompletedSets + unCompletedSets * AVG_TIME_PER_SET
      );
    }, 0);

    const estimatedMinutes = Math.ceil(restTime / 60);
    return Math.max(0, estimatedMinutes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUpIcon className="h-5 w-5" />
          Статистика тренировки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-muted p-2 sm:p-3 rounded-lg">
            <div className="flex items-center gap-2 text-primary mb-1">
              <TargetIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Прогресс</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {Math.round((completedSets / totalSets) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {completedSets} / {totalSets} подходов
            </div>
          </div>

          <div className="bg-muted p-2 sm:p-3 rounded-lg">
            <div className="flex items-center gap-2 text-primary mb-1">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Осталось</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {estimateRemainingTime()} мин
            </div>
            <div className="text-xs text-muted-foreground">ориентировочно</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AwardIcon className="h-4 w-4" />
            <span>Упражнения</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card p-2 rounded border text-center">
              <div className="text-lg font-bold text-foreground">
                {totalExercises}
              </div>
              <div className="text-xs text-muted-foreground">Всего</div>
            </div>
            <div className="bg-card p-2 rounded border text-center">
              <div className="text-lg font-bold text-foreground">
                {
                  training.exercises.filter(
                    (ex) => ex.sets.length > ex.completedSets,
                  ).length
                }
              </div>
              <div className="text-xs text-muted-foreground">Осталось</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
