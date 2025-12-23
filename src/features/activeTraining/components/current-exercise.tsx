import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import {
  WeightIcon,
  RepeatIcon,
  ClockIcon,
  EditIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { ApiSchemas } from "@/shared/schema";

type CurrentExerciseProps = {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  setTraining: React.Dispatch<
    React.SetStateAction<{
      id: string;
      dateStart: string;
      exercises: ApiSchemas["ActiveTraining"]["exercises"];
    }>
  >;
  open: () => void;
};

export function CurrentExercise({
  exercise,
  setTraining,
  open,
}: CurrentExerciseProps) {
  const [isEditingWeight, setIsEditingWeight] = useState(false);

  const currentSets = exercise.completedSets;

  const [tempWeight, setTempWeight] = useState(
    exercise.sets[currentSets].weight ?? 0,
  );

  const updateWeight = () => {
    setTraining((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id === exercise.id) {
          return {
            ...ex,
            sets: ex.sets.map((set, index) => {
              if (index === currentSets) {
                return {
                  ...set,
                  weight: tempWeight,
                };
              }
              return set;
            }),
          };
        }
        return ex;
      }),
    }));
    setIsEditingWeight(false);
  };

  if (!exercise.sets) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl">
            {exercise.name}
          </CardTitle>
          <Button onClick={open} size="sm" className="sm:size-auto">
            Изменить
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {/* Вес */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-600">
                <WeightIcon className="h-4 w-4" />
                <span className="font-medium text-sm sm:text-base">Вес</span>
              </div>

              {isEditingWeight ? (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={updateWeight}
                    className="p-1"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingWeight(false);
                      setTempWeight(exercise.sets[currentSets].weight ?? 0);
                    }}
                    className="p-1"
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingWeight(true)}
                  className="p-1"
                >
                  <EditIcon className="h-3 w-3" />
                </Button>
              )}
            </div>

            {isEditingWeight ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempWeight}
                  onChange={(e) => setTempWeight(Number(e.target.value))}
                  className="w-16 sm:w-20 px-2 sm:px-3 py-1 border rounded text-xl sm:text-2xl font-bold text-center"
                  min="0"
                  step="0.5"
                />
                <span className="text-gray-500 text-sm sm:text-base">кг</span>
              </div>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {exercise.sets[currentSets].weight}
                <span className="text-gray-500 text-lg sm:text-xl">кг</span>
              </div>
            )}
          </div>

          {/* Повторения */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <RepeatIcon className="h-4 w-4" />
              <span className="font-medium text-sm sm:text-base">
                Повторения
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {exercise.sets[currentSets].repeatCount}
              <span className="text-gray-500 text-lg sm:text-xl">раз</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              {exercise.sets.length} подходов
            </div>
          </div>

          {/* Отдых */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium text-sm sm:text-base">Отдых</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900">
              {exercise.restTime}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              между подходами
            </div>
          </div>
        </div>

        {/* Прогресс упражнения */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm sm:text-base text-gray-600 gap-1">
            <span>Прогресс упражнения</span>
            <span>
              {exercise.completedSets}/{exercise.sets.length} подходов
            </span>
          </div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${(exercise.completedSets / exercise.sets.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
