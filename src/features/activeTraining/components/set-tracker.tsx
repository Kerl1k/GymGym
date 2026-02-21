import { PlusIcon, XIcon } from "lucide-react";

import { ApiSchemas } from "@/shared/schema";
import { Card, CardContent } from "@/shared/ui/kit/card";

interface SetTrackerProps {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  indexCurrentExercise: number;
}

export function SetTracker({
  exercise,
  setTraining,
  indexCurrentExercise,
}: SetTrackerProps) {
  const currentActive = exercise.sets.filter((set) => set.done).length;

  const addSet = () => {
    setTraining((prev) => {
      const updatedExercises = prev.exercises.map((ex, index) => {
        if (index === indexCurrentExercise) {
          const lastSet = ex.sets[ex.sets.length - 1];
          const newWeight = lastSet ? lastSet.weight : 0;
          const newRepeatCount = lastSet ? lastSet.repeatCount : 12;

          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                weight: newWeight,
                done: false,
                repeatCount: newRepeatCount,
              },
            ],
          };
        }
        return ex;
      });

      return {
        ...prev,
        exercises: updatedExercises,
      };
    });
  };

  const deleteSet = (setIndex: number) => {
    setTraining((prev) => {
      const updatedExercises = prev.exercises.map((ex, index) => {
        if (index === indexCurrentExercise) {
          const updatedSets = ex.sets.filter((_, index) => index !== setIndex);

          return {
            ...ex,
            sets: updatedSets,
          };
        }
        return ex;
      });

      return {
        ...prev,
        exercises: updatedExercises,
      };
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {exercise.sets.map((set, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 rounded-xl text-center relative ${index < currentActive ? "bg-green-700 border-2 border-green-700" : "bg-card border-2 border-border"}`}
            >
              {!set.done && exercise.sets.length > 1 && (
                <button
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSet(index);
                  }}
                  title="Удалить подход"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">
                Подход {index + 1}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Вес {set.weight}
              </div>
              <div
                className={`text-xs sm:text-sm font-medium ${index < currentActive ? "text-green-100" : "text-muted-foreground"}`}
              >
                {index < currentActive ? "✓ Выполнен" : "Ожидает"}
              </div>
            </div>
          ))}
          <div
            className="p-3 sm:p-4 rounded-xl text-center bg-card border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors"
            onClick={addSet}
          >
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">
              Подход {exercise.sets.length + 1}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
              <PlusIcon className="h-6 w-6 mx-auto" />
            </div>
            <div className="text-xs sm:text-sm font-medium text-primary">
              Добавить
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
