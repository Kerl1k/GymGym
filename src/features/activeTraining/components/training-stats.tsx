// features/training-active/components/training-stats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { TrainingSession } from "../types";
import {
  ClockIcon,
  FlameIcon,
  WeightIcon,
  TrendingUpIcon,
  AwardIcon,
  TargetIcon,
} from "lucide-react";
import { Badge } from "@/shared/ui/kit/badge";

interface TrainingStatsProps {
  training: TrainingSession;
}

export function TrainingStats({ training }: TrainingStatsProps) {
  // Рассчитываем статистику
  const totalExercises = training.exercises.length;
  const totalSets = training.exercises.reduce(
    (sum, ex) => sum + ex.approaches,
    0,
  );
  const completedSets = training.exercises.reduce(
    (sum, ex) => sum + ex.completedSets,
    0,
  );
  const totalVolume = training.exercises.reduce((sum, ex) => {
    const completedVolume = ex.weight * ex.count * ex.completedSets;
    const remainingVolume =
      ex.weight * ex.count * (ex.approaches - ex.completedSets);
    return sum + completedVolume + remainingVolume;
  }, 0);

  const completedVolume = training.exercises.reduce((sum, ex) => {
    return sum + ex.weight * ex.count * ex.completedSets;
  }, 0);

  // Оцениваем сложность тренировки
  const getDifficulty = () => {
    const totalWeight = training.exercises.reduce(
      (sum, ex) => sum + ex.weight,
      0,
    );
    const totalReps = training.exercises.reduce(
      (sum, ex) => sum + ex.count * ex.approaches,
      0,
    );

    if (totalWeight > 300 && totalReps > 100)
      return { level: "Сложная", color: "bg-red-100 text-red-800" };
    if (totalWeight > 150 && totalReps > 50)
      return { level: "Средняя", color: "bg-amber-100 text-amber-800" };
    return { level: "Легкая", color: "bg-green-100 text-green-800" };
  };

  const difficulty = getDifficulty();

  // Оставшееся время (оценка)
  const estimateRemainingTime = () => {
    const avgRestTime = 90; // секунды
    const setsLeft = totalSets - completedSets;
    const estimatedMinutes = Math.ceil((setsLeft * avgRestTime) / 60);
    return Math.max(0, estimatedMinutes);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5" />
          Статистика тренировки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Прогресс */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <TargetIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Прогресс</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((completedSets / totalSets) * 100)}%
            </div>
            <div className="text-xs text-gray-600">
              {completedSets} / {totalSets} подходов
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Осталось</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {estimateRemainingTime()} мин
            </div>
            <div className="text-xs text-gray-600">ориентировочно</div>
          </div>
        </div>

        {/* Объем */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <WeightIcon className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">
                Рабочий объем
              </span>
            </div>
            <Badge variant="outline" className={difficulty.color}>
              {difficulty.level}
            </Badge>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Выполнено</span>
                <span className="font-medium text-gray-900">
                  {completedVolume} кг
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${Math.min(100, (completedVolume / totalVolume) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Всего</span>
                <span className="font-medium text-gray-900">
                  {totalVolume} кг
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Вес × Повторы × Подходы
              </div>
            </div>
          </div>
        </div>

        {/* Упражнения */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <AwardIcon className="h-4 w-4" />
            <span>Упражнения</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded border text-center">
              <div className="text-lg font-bold text-gray-900">
                {totalExercises}
              </div>
              <div className="text-xs text-gray-600">Всего</div>
            </div>
            <div className="bg-white p-2 rounded border text-center">
              <div className="text-lg font-bold text-gray-900">
                {training.exercises.filter((ex) => ex.completedSets > 0).length}
              </div>
              <div className="text-xs text-gray-600">В работе</div>
            </div>
          </div>
        </div>

        {/* Сожженные калории (оценка) */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 text-amber-800 mb-2">
            <FlameIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Сожжено калорий</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(completedSets * 8)}
              </div>
              <div className="text-xs text-amber-700">
                ~{Math.round(totalSets * 8)} ккал всего
              </div>
            </div>
            <div className="text-xs text-gray-600">*примерный расчет</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
