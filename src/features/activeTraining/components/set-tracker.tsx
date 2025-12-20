import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { CheckIcon } from "lucide-react";
import { ApiSchemas } from "@/shared/schema";

interface SetTrackerProps {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  onCompleteSet: () => void;
}

export function SetTracker({ exercise, onCompleteSet }: SetTrackerProps) {
  const currentActive = exercise.completedSets;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Подходы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {exercise.sets.map((set, index) => (
            <div
              key={set.id}
              className={`p-4 rounded-xl text-center ${
                index < currentActive
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-white border-2 border-gray-200"
              }`}
            >
              <div className="text-sm text-gray-600 mb-1">
                Подход {index + 1}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                Вес {set.weight}
              </div>
              <div
                className={`text-sm font-medium ${
                  index < currentActive ? "text-green-600" : "text-gray-500"
                }`}
              >
                {index < currentActive ? "✓ Выполнен" : "Ожидает"}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onCompleteSet} size="lg" className="w-full gap-2">
          <CheckIcon className="h-5 w-5" />
          {exercise.completedSets >= exercise.sets.length
            ? "Все подходы выполнены"
            : `Завершить подход ${exercise.completedSets + 1}`}
        </Button>
      </CardContent>
    </Card>
  );
}
