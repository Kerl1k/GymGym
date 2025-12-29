import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { CheckIcon } from "lucide-react";
import { ApiSchemas } from "@/shared/schema";

interface SetTrackerProps {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  onCompleteSet: () => void;
}

export function SetTracker({ exercise, onCompleteSet }: SetTrackerProps) {
  const currentActive = exercise.sets.filter((set) => set.done).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Подходы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-6">
          {exercise.sets.map((set, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 rounded-xl text-center ${index < currentActive ? "bg-green-50 border-2 border-green-200" : "bg-card border-2 border-border"}`}
            >
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">
                Подход {index + 1}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Вес {set.weight}
              </div>
              <div
                className={`text-xs sm:text-sm font-medium ${index < currentActive ? "text-green-600" : "text-muted-foreground"}`}
              >
                {index < currentActive ? "✓ Выполнен" : "Ожидает"}
              </div>
            </div>
          ))}
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
