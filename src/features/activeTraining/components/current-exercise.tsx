// features/training-active/components/current-exercise.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { Badge } from "@/shared/ui/kit/badge";
import { TrainingExercise } from "../types";
import {
  WeightIcon,
  RepeatIcon,
  ClockIcon,
  EditIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

interface CurrentExerciseProps {
  exercise: TrainingExercise;
  onUpdateWeight: (weight: number) => void;
  open: () => void;
}

export function CurrentExercise({
  exercise,
  onUpdateWeight,
  open,
}: CurrentExerciseProps) {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState(exercise.weight);

  const handleWeightSubmit = () => {
    onUpdateWeight(tempWeight);
    setIsEditingWeight(false);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      strength: "bg-red-100 text-red-800 border-red-200",
      cardio: "bg-blue-100 text-blue-800 border-blue-200",
      flexibility: "bg-green-100 text-green-800 border-green-200",
      balance: "bg-purple-100 text-purple-800 border-purple-200",
      yoga: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pilates: "bg-pink-100 text-pink-800 border-pink-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl md:text-2xl">{exercise.name}</CardTitle>
          <Badge variant="outline" className={getTypeColor(exercise.type)}>
            {exercise.type === "strength" && "💪 Силовая"}
            {exercise.type === "cardio" && "🏃 Кардио"}
            {exercise.type === "flexibility" && "🤸 Гибкость"}
            {exercise.type === "balance" && "⚖️ Баланс"}
            {exercise.type === "yoga" && "🧘 Йога"}
            {exercise.type === "pilates" && "🏋️ Пилатес"}
          </Badge>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleWeightSubmit}
                  >
                    <CheckIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingWeight(false);
                      setTempWeight(exercise.weight);
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
                {exercise.weight}{" "}
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
              {exercise.count}{" "}
              <span className="text-gray-500 text-xl">раз</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {exercise.approaches} подходов
            </div>
          </div>

          {/* Отдых */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium">Отдых</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {exercise.chill}
            </div>
            <div className="text-sm text-gray-500 mt-1">между подходами</div>
          </div>
        </div>

        {/* Прогресс упражнения */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Прогресс упражнения</span>
            <span>
              {exercise.completedSets}/{exercise.approaches} подходов
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${(exercise.completedSets / exercise.approaches) * 100}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
