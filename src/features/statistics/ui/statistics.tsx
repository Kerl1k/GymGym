import { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useFetchTrainingHistoryWithFilters } from "@/entities/training-history/use-training-history-with-filters";
import { Button } from "@/shared/ui/kit/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/kit/dialog";

export const Statistics = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { exercises } = useExercisesFetchList({});
  const { history: filteredHistory, isPending } =
    useFetchTrainingHistoryWithFilters({
      sort: "dateStart",
      exerciseName: selectedExercise || "",
    });

  // Извлекаем все веса из sets выбранного упражнения
  const exerciseWeights = filteredHistory.flatMap((training) => {
    const exercise = training.exercises.find(
      (ex) => ex.name === selectedExercise,
    );
    return exercise?.sets?.map((set) => set.weight) || [];
  });

  const chartData = filteredHistory
    .sort(
      (a, b) =>
        new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime(),
    )
    .flatMap((training) => {
      const exercise = training.exercises.find(
        (ex) => ex.name === selectedExercise,
      );
      if (!exercise?.sets) return [];

      return exercise.sets.map((set, index) => ({
        date: new Date(training.dateStart).toLocaleDateString("ru-RU", {
          day: "numeric",
        }),
        set: index + 1,
        weight: set.weight,
      }));
    });

  const handleExerciseSelect = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full h-full p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Статистика упражнений
        </h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>Выбрать упражнение</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Выберите упражнение</DialogTitle>
            </DialogHeader>
            <div className="max-h-60 overflow-y-auto border border-border rounded">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-2 hover:bg-accent rounded cursor-pointer transition-colors"
                  onClick={() => handleExerciseSelect(exercise.name)}
                >
                  {exercise.name}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isPending ? (
        <div className="text-center py-8 text-muted-foreground">
          Загрузка...
        </div>
      ) : selectedExercise ? (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-card p-4 md:p-6 rounded-lg shadow-sm border border-border">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">
              Упражнение: {selectedExercise}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Количество тренировок
                </p>
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {filteredHistory.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Общее количество подходов
                </p>
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {exerciseWeights.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card p-4 md:p-6 rounded-lg shadow-sm border border-border">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-foreground">
              График прогресса
            </h2>
            <div className="h-64 md:h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      interval={0}
                      tick={{ transform: "translate(0, 10)" }}
                      tickFormatter={(value) => value}
                      tickSize={12}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} кг`, "Вес"]}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="var(--primary)"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Нет данных для отображения
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Пожалуйста, выберите упражнение для просмот
        </div>
      )}
    </div>
  );
};
