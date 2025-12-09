// features/training-active/components/set-tracker.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { TrainingExercise } from "../types";
import { CheckIcon } from "lucide-react";

interface SetTrackerProps {
  exercise: TrainingExercise;
  onCompleteSet: () => void;
  trainingStatus: string;
}

export function SetTracker({
  exercise,
  onCompleteSet,
  trainingStatus,
}: SetTrackerProps) {
  const sets = Array.from({ length: exercise.approaches }, (_, i) => ({
    number: i + 1,
    completed: i < exercise.completedSets,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Подходы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {sets.map((set) => (
            <div
              key={set.number}
              className={`p-4 rounded-xl text-center ${
                set.completed
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-white border-2 border-gray-200"
              }`}
            >
              <div className="text-sm text-gray-600 mb-1">
                Подход {set.number}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {exercise.count} × {exercise.weight} кг
              </div>
              <div
                className={`text-sm font-medium ${
                  set.completed ? "text-green-600" : "text-gray-500"
                }`}
              >
                {set.completed ? "✓ Выполнен" : "Ожидает"}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onCompleteSet}
          size="lg"
          className="w-full gap-2"
          disabled={
            trainingStatus !== "in-progress" ||
            exercise.completedSets >= exercise.approaches
          }
        >
          <CheckIcon className="h-5 w-5" />
          {exercise.completedSets >= exercise.approaches
            ? "Все подходы выполнены"
            : `Завершить подход ${exercise.completedSets + 1}`}
        </Button>
      </CardContent>
    </Card>
  );
}
