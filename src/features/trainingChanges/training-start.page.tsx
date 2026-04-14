import { useState, useEffect, FC } from "react";

import {
  TrashIcon,
  CopyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
} from "lucide-react";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { unitsFromCatalogStrings } from "@/shared/lib/active-training-units";
import { cn } from "@/shared/lib/css";
import { getMuscleGroupColor } from "@/shared/lib/utils";
import { ApiSchemas } from "@/shared/schema";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";
import { Label } from "@/shared/ui/kit/label";
import { Loader } from "@/shared/ui/kit/loader";
import { Textarea } from "@/shared/ui/kit/Textarea";

import Approach from "./approach";
import styles from "./training-start.module.scss";

type TrainingChangesProps = {
  data: ApiSchemas["ActiveTraining"];
  onSave: (data: ApiSchemas["ActiveTraining"]) => void;
};

export const TrainingChanges: FC<TrainingChangesProps> = ({ data, onSave }) => {
  const [activeTraining, setActiveTraining] = useState<
    ApiSchemas["ActiveTraining"] | null
  >(data);

  const { isPending: isUpdating } = useUpdateActiveTraining();
  const { exercises, isPending: isExercisesLoading } = useExercisesFetchList(
    {},
  );

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  useEffect(() => {
    setActiveTraining((prev) => {
      if (!prev) return prev;
      const nextExercises = prev.exercises.map((ex) =>
        ex.useCustomSets ? ex : { ...ex, useCustomSets: true },
      );
      return { ...prev, exercises: nextExercises };
    });
  }, []);

  const removeExercise = (exerciseIndex: number) => {
    if (!activeTraining || activeTraining.exercises.length <= 1) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== exerciseIndex),
      };
    });
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    if (!activeTraining) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < activeTraining.exercises.length) {
      setActiveTraining((prev) => {
        if (!prev) return prev;

        const newExercises = [...prev.exercises];
        [newExercises[index], newExercises[newIndex]] = [
          newExercises[newIndex],
          newExercises[index],
        ];

        return {
          ...prev,
          exercises: newExercises,
        };
      });
    }
  };

  const duplicateExercise = (index: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const exerciseToDuplicate = prev.exercises[index];
      const newExercise = {
        ...exerciseToDuplicate,
        sets: exerciseToDuplicate.sets.map((set) => ({
          ...set,
        })),
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  };

  // Функция для получения общего количества подходов
  const getTotalSets = () => {
    if (!activeTraining) return 0;
    return activeTraining.exercises.reduce(
      (total, ex) => total + ex.sets.length,
      0,
    );
  };

  const handleAddExercise = (exerciseId: string) => {
    if (!activeTraining) return;

    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    if (!selectedExercise) return;

    const newExercise: ApiSchemas["ActiveTraining"]["exercises"][0] = {
      id: selectedExercise.id,
      name: selectedExercise.name,
      muscleGroups: selectedExercise.muscleGroups || [],
      description: selectedExercise.description || "",
      useCustomSets: true,
      sets: [
        {
          units: unitsFromCatalogStrings(selectedExercise.units),
          done: false,
        },
      ],
      restTime: 0,
    };

    setActiveTraining((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });

    setIsExerciseModalOpen(false);
  };

  const handleSave = async () => {
    if (activeTraining) {
      onSave(activeTraining);
    }
  };

  useEffect(() => {
    if (data && !activeTraining) {
      setActiveTraining(data);
    }
  }, [data, activeTraining]);

  if (!activeTraining) {
    return (
      <div className={styles.loading}>
        <Loader size="large" />
      </div>
    );
  }

  if (!data) {
    return <div className={styles.notFound}>Тренировка не найдена</div>;
  }

  return (
    <div className={styles.container}>
      {/* Шапка */}
      <div className={styles.header}>
        <h1 className={styles.title}>{"Тренировка: " + activeTraining.name}</h1>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {activeTraining.exercises.length}
            </span>
            <span className={styles.statLabel}>упражнений</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{getTotalSets()}</span>
            <span className={styles.statLabel}>подходов</span>
          </div>
        </div>
      </div>

      {/* Упражнения */}
      <div className={styles.exercisesList}>
        {activeTraining.exercises.map((exercise, exerciseIndex) => (
          <Card key={exerciseIndex} className={styles.exerciseCard}>
            <CardContent className={styles.exerciseContent}>
              {/* Заголовок упражнения */}
              <div className={styles.exerciseHeader}>
                <div className={styles.exerciseTitle}>
                  <div className={styles.exerciseNumber}>
                    {exerciseIndex + 1}
                  </div>
                  <div>
                    <h3 className={styles.exerciseName}>{exercise.name}</h3>
                    <div className={styles.exerciseTags}>
                      {exercise.muscleGroups?.map((group, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={` ${styles.tag} ${getMuscleGroupColor(group)}`}
                        >
                          {group}
                        </Badge>
                      ))}
                      {exercise.sets[0]?.units?.map((unit, i) => (
                        <Badge
                          key={`unit-${exercise.id}-${i}-${unit.name}`}
                          variant="outline"
                          className={cn(
                            styles.tag,
                            "border-orange-200/90 bg-orange-50 font-medium text-orange-950",
                            "dark:border-orange-800/90 dark:bg-orange-950/45 dark:text-orange-100",
                          )}
                        >
                          {unit.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.exerciseActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveExercise(exerciseIndex, "up")}
                    disabled={exerciseIndex === 0}
                    className={styles.actionButton}
                  >
                    <ArrowUpIcon className={styles.actionIcon} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveExercise(exerciseIndex, "down")}
                    disabled={
                      exerciseIndex === activeTraining.exercises.length - 1
                    }
                    className={styles.actionButton}
                  >
                    <ArrowDownIcon className={styles.actionIcon} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicateExercise(exerciseIndex)}
                    className={styles.actionButton}
                  >
                    <CopyIcon className={styles.actionIcon} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeExercise(exerciseIndex)}
                    disabled={activeTraining.exercises.length <= 1}
                    className={cn(
                      styles.actionButton,
                      "text-red-500 hover:text-red-600 hover:bg-red-50",
                    )}
                  >
                    <TrashIcon className={styles.actionIcon} />
                  </Button>
                </div>
              </div>

              <Approach
                exercise={exercise}
                activeTraining={activeTraining}
                setActiveTraining={setActiveTraining}
                exerciseIndex={exerciseIndex}
              />
              <div className={styles.exerciseNotes}>
                <Label className={styles.notesLabel}>
                  Заметки к упражнению
                </Label>
                <Textarea
                  value={
                    exercise.description !== undefined
                      ? exercise.description
                      : ""
                  }
                  onChange={(e) => {
                    if (!activeTraining) return;
                    setActiveTraining((prev) => {
                      if (!prev) return prev;
                      const newExercises = [...prev.exercises];
                      newExercises[exerciseIndex] = {
                        ...newExercises[exerciseIndex],
                        description: e.target.value,
                      };
                      return {
                        ...prev,
                        exercises: newExercises,
                      };
                    });
                  }}
                  placeholder="Заметки по технике, ощущения..."
                  className={styles.notesTextarea}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          onClick={() => setIsExerciseModalOpen(true)}
          className={styles.addExerciseButton}
          variant="outline"
        >
          <PlusIcon className={styles.addExerciseIcon} />
          Добавить упражнение
        </Button>
      </div>

      <div className={styles.footer}>
        <Button
          onClick={handleSave}
          size="lg"
          className={styles.saveButton}
          disabled={isUpdating}
        >
          {isUpdating ? "Сохранение..." : "Сохранить параметры"}
        </Button>
      </div>

      <ExerciseSelectModal
        exercises={exercises}
        onSelect={handleAddExercise}
        isOpen={isExerciseModalOpen}
        close={() => setIsExerciseModalOpen(false)}
        isLoading={isExercisesLoading}
      />
    </div>
  );
};
