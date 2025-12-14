import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { Progress } from "@/shared/ui/kit/progress";
import { Timer } from "../components/timer";
import { CurrentExercise } from "../components/current-exercise";
import { SetTracker } from "../components/set-tracker";
import { TrainingStats } from "../components/training-stats";
import { mockTraining } from "../data/mock-training";
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  SkipForwardIcon,
  RotateCcwIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/model/routes";
import { useTrainingFetch } from "@/entities/training-active/use-training-active";
import { useOpen } from "@/shared/lib/useOpen";
import { ChangeModal } from "./ChangeModal";

function ActiveTraining() {
  const navigate = useNavigate();
  const { close, isOpen, open } = useOpen();

  const data = useTrainingFetch();
  console.log(data);
  const [training, setTraining] = useState(mockTraining);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(90);

  const currentExercise = training.exercises[training.currentExerciseIndex];
  const totalExercises = training.exercises.length;
  const totalSets = training.exercises.reduce(
    (sum, ex) => sum + ex.approaches,
    0,
  );
  const completedSets = training.exercises.reduce(
    (sum, ex) => sum + ex.completedSets,
    0,
  );

  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // Функция для начала тренировки
  const startTraining = () => {
    setTraining((prev) => ({
      ...prev,
      status: "in-progress",
      startTime: new Date().toISOString(),
    }));
  };

  // Функция для паузы тренировки
  const pauseTraining = () => {
    setTraining((prev) => ({
      ...prev,
      status: "paused",
    }));
  };

  // Функция для завершения подхода
  const completeSet = (exerciseId: string) => {
    setTraining((prev) => {
      const updatedExercises = prev.exercises.map((ex) => {
        if (ex.id === exerciseId && ex.completedSets < ex.approaches) {
          return { ...ex, completedSets: ex.completedSets + 1 };
        }
        return ex;
      });

      // Если все подходы текущего упражнения выполнены, переходим к следующему
      const currentEx = updatedExercises[prev.currentExerciseIndex];
      if (currentEx.completedSets >= currentEx.approaches) {
        return {
          ...prev,
          exercises: updatedExercises,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          status: "in-progress",
        };
      }

      // Начинаем отдых
      setIsResting(true);
      setRestTime(parseInt(currentEx.chill) || 90);

      return {
        ...prev,
        exercises: updatedExercises,
        status: "resting",
      };
    });
  };

  // Функция для пропуска отдыха
  const skipRest = () => {
    setIsResting(false);
    setTraining((prev) => ({
      ...prev,
      status: "in-progress",
    }));
  };

  // Функция для изменения веса
  const updateWeight = (exerciseId: string, newWeight: number) => {
    setTraining((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, weight: newWeight } : ex,
      ),
    }));
  };

  // Функция для завершения тренировки
  const finishTraining = () => {
    setTraining((prev) => ({
      ...prev,
      status: "completed",
      endTime: new Date().toISOString(),
    }));

    navigate(ROUTES.HOME);
  };

  // Когда отдых закончен
  useEffect(() => {
    if (isResting && restTime <= 0) {
      setIsResting(false);
      setTraining((prev) => ({
        ...prev,
        status: "in-progress",
      }));
    }
  }, [isResting, restTime]);

  console.log(currentExercise);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Хедер тренировки */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {training.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Упражнение {training.currentExerciseIndex + 1} из{" "}
                {totalExercises}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {training.status === "not-started" ? (
                <Button onClick={startTraining} size="lg" className="gap-2">
                  <PlayIcon className="h-5 w-5" />
                  Начать тренировку
                </Button>
              ) : training.status === "paused" ? (
                <Button
                  onClick={startTraining}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  Продолжить
                </Button>
              ) : (
                <Button
                  onClick={pauseTraining}
                  size="lg"
                  variant="outline"
                  className="gap-2"
                >
                  <PauseIcon className="h-5 w-5" />
                  Пауза
                </Button>
              )}

              <Button
                onClick={finishTraining}
                size="lg"
                variant="ghost"
                className="gap-2"
              >
                <CheckIcon className="h-5 w-5" />
                Завершить
              </Button>
            </div>
          </div>

          {/* Прогресс бар */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Прогресс тренировки</span>
              <span>
                {Math.round(progress)}% ({completedSets}/{totalSets} подходов)
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Текущее упражнение и таймер */}
          <div className="lg:col-span-2 space-y-6">
            {/* Карточка текущего упражнения */}
            <CurrentExercise
              exercise={currentExercise}
              onUpdateWeight={(newWeight) =>
                updateWeight(currentExercise.id, newWeight)
              }
              open={open}
            />

            {/* Таймер отдыха */}
            {isResting && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <RotateCcwIcon className="h-5 w-5" />
                    Отдых
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Timer
                    duration={restTime}
                    onComplete={() => setIsResting(false)}
                  />
                  <Button
                    onClick={skipRest}
                    variant="outline"
                    className="mt-4 w-full gap-2"
                  >
                    <SkipForwardIcon className="h-4 w-4" />
                    Пропустить отдых
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Трекер подходов */}
            <SetTracker
              exercise={currentExercise}
              onCompleteSet={() => completeSet(currentExercise.id)}
              trainingStatus={training.status}
            />
          </div>

          {/* Правая колонка - Статистика и следующие упражнения */}
          <div className="space-y-6">
            {/* Статистика тренировки */}
            <TrainingStats training={training} />

            {/* Следующие упражнения */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Следующие упражнения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {training.exercises
                  .slice(training.currentExerciseIndex + 1)
                  .map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                        {training.currentExerciseIndex + index + 2}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {exercise.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {exercise.approaches} × {exercise.count} повторений
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {exercise.weight} кг
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ChangeModal
        currentExercise={currentExercise}
        close={close}
        isOpen={isOpen}
      />
    </div>
  );
}

export const Component = ActiveTraining;
