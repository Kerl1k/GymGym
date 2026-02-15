import { useState, useRef } from "react";

import {
  WeightIcon,
  RepeatIcon,
  ClockIcon,
  EditIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";

type CurrentExerciseProps = {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][number];
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  open: () => void;
  onCompleteSet: () => void;
};

export function CurrentExercise({
  exercise,
  setTraining,
  open,
  onCompleteSet,
}: CurrentExerciseProps) {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingReps, setIsEditingReps] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);

  const currentSets = exercise.sets.filter((set) => set.done).length;

  const [tempWeight, setTempWeight] = useState(
    exercise.sets[currentSets].weight?.toString() ?? "",
  );
  const [tempReps, setTempReps] = useState(
    exercise.sets[currentSets].repeatCount?.toString() ?? "",
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
                  weight: tempWeight === "" ? 0 : Number(tempWeight),
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
                  repeatCount: tempReps === "" ? 0 : Number(tempReps),
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
                      setTempWeight(
                        exercise.sets[currentSets].weight?.toString() ?? "",
                      );
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
                  onClick={() => {
                    setIsEditingWeight(true);
                    setTimeout(() => weightInputRef.current?.focus(), 0);
                  }}
                  className="p-1"
                >
                  <EditIcon className="h-3 w-3" />
                </Button>
              )}
            </div>

            {isEditingWeight ? (
              <div className="flex items-center gap-2">
                <input
                  ref={weightInputRef}
                  type="number"
                  value={tempWeight}
                  onChange={(e) => setTempWeight(e.target.value)}
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
                      setTempReps(
                        exercise.sets[currentSets].repeatCount?.toString() ??
                          "",
                      );
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
                  onClick={() => {
                    setIsEditingReps(true);
                    setTimeout(() => repsInputRef.current?.focus(), 0);
                  }}
                  className="p-1"
                >
                  <EditIcon className="h-3 w-3" />
                </Button>
              )}
            </div>

            {isEditingReps ? (
              <div className="flex items-center gap-2">
                <input
                  ref={repsInputRef}
                  type="number"
                  value={tempReps}
                  onChange={(e) => setTempReps(e.target.value)}
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

        <Button
          onClick={onCompleteSet}
          size="lg"
          className="w-full gap-2 text-base sm:text-lg"
        >
          <CheckIcon className="h-5 w-5" />
          {exercise.sets.filter((set) => set.done).length >=
          exercise.sets.length
            ? "Все подходы выполнены"
            : `Завершить подход ${exercise.sets.filter((set) => set.done).length + 1}`}
        </Button>
      </CardContent>
    </Card>
  );
}
