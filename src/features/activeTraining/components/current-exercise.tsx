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
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl md:text-2xl">{exercise.name}</CardTitle>
          <Button onClick={open}>Изменить</Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Вес */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-600">
                <WeightIcon className="h-4 w-4" />
                <span className="font-medium">Вес</span>
              </div>

              {isEditingWeight ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={updateWeight}>
                    <CheckIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingWeight(false);
                      setTempWeight(exercise.sets[currentSets].weight ?? 0);
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingWeight(true)}
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
                  className="w-20 px-3 py-1 border rounded text-2xl font-bold text-center"
                  min="0"
                  step="0.5"
                />
                <span className="text-gray-500">кг</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {exercise.sets[currentSets].weight}{" "}
                <span className="text-gray-500 text-xl">кг</span>
              </div>
            )}
          </div>

          {/* Повторения */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <RepeatIcon className="h-4 w-4" />
              <span className="font-medium">Повторения</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {exercise.sets[currentSets].repeatCount}{" "}
              <span className="text-gray-500 text-xl">раз</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {exercise.sets.length} подходов
            </div>
          </div>

          {/* Отдых */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium">Отдых</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {exercise.restTime}
            </div>
            <div className="text-sm text-gray-500 mt-1">между подходами</div>
          </div>
        </div>

        {/* Прогресс упражнения */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Прогресс упражнения</span>
            <span>
              {exercise.completedSets}/{exercise.sets.length} подходов
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
