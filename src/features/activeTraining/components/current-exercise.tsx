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
  exercise: ApiSchemas["ActiveTraining"]["exercises"][number];
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  open: () => void;
};

export function CurrentExercise({
  exercise,
  setTraining,
  open,
}: CurrentExerciseProps) {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingReps, setIsEditingReps] = useState(false);

  const currentSets = exercise.sets.filter((set) => set.done).length;

  const [tempWeight, setTempWeight] = useState(
    exercise.sets[currentSets].weight ?? 0,
  );
  const [tempReps, setTempReps] = useState(
    exercise.sets[currentSets].repeatCount ?? 0,
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

  const updateReps = () => {
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
                  repeatCount: tempReps,
                };
              }
              return set;
            }),
          };
        }
        return ex;
      }),
    }));
    setIsEditingReps(false);
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
          <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
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
                  className="w-16 sm:w-30 px-2 sm:px-3 py-1 border rounded text-xl sm:text-2xl font-bold"
                  min="0"
                  step="0.5"
                />
                <span className="text-muted-foreground text-sm sm:text-base">
                  {" "}
                  кг
                </span>
              </div>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {exercise.sets[currentSets].weight}
                <span className="text-muted-foreground text-lg sm:text-xl">
                  {" "}
                  кг
                </span>
              </div>
            )}
          </div>

          {/* Повторения */}
          <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RepeatIcon className="h-4 w-4" />
                <span className="font-medium text-sm sm:text-base">
                  Повторения
                </span>
              </div>

              {isEditingReps ? (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={updateReps}
                    className="p-1"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingReps(false);
                      setTempReps(exercise.sets[currentSets].repeatCount ?? 0);
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
                  onClick={() => setIsEditingReps(true)}
                  className="p-1"
                >
                  <EditIcon className="h-3 w-3" />
                </Button>
              )}
            </div>

            {isEditingReps ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={tempReps}
                  onChange={(e) => setTempReps(Number(e.target.value))}
                  className="w-16 sm:w-20 px-2 sm:px-3 py-1 border rounded text-xl sm:text-2xl font-bold"
                  min="0"
                />
                <span className="text-muted-foreground text-sm sm:text-base">
                  {" "}
                  раз
                </span>
              </div>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {exercise.sets[currentSets].repeatCount}
                <span className="text-muted-foreground text-lg sm:text-xl">
                  {" "}
                  раз
                </span>
              </div>
            )}
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              {exercise.sets.length} подходов
            </div>
          </div>

          {/* Отдых */}
          <div className="bg-card p-3 sm:p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium text-sm sm:text-base">Отдых</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">
              {exercise.restTime}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              между подходами
            </div>
          </div>
        </div>

        {/* Прогресс упражнения */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm sm:text-base text-muted-foreground gap-1">
            <span>Прогресс упражнения</span>
            <span>
              {currentSets}/{exercise.sets.length} подходов
            </span>
          </div>
          <div className="h-2 sm:h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(currentSets / exercise.sets.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
