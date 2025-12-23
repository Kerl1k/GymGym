import { useState, useEffect } from "react";
import { href, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { Label } from "@/shared/ui/kit/label";
import { Textarea } from "@/shared/ui/kit/Textarea";
import { Switch } from "@/shared/ui/kit/switch";
import { Badge } from "@/shared/ui/kit/badge";
import { TrashIcon, CopyIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import styles from "./training-start.module.scss";
import { cn } from "@/shared/lib/css";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import Approach from "./approach";
import { useTrainingList } from "@/entities/training/use-training-fetch";

const TrainingStartPage = () => {
  const { trainingId } = useParams<{ trainingId: string }>();

  const { trainings: training } = useTrainingList({});

  const [activeTraining, setActiveTraining] = useState<
    ApiSchemas["ActiveTraining"] | null
  >(null);

  const { isPending: isUpdating } = useUpdateActiveTraining();

  const navigate = useNavigate();

  useEffect(() => {
    if (training && training.length > 0 && !activeTraining) {
      const trainingData = training[0];
      const exercises = trainingData.exercises || [];

      const initializedExercises = exercises.map(
        (exercise: {
          exerciseId: string;
          name: string;
          type: string[];
          notes: string;
        }) => {
          const defaultSets = Array.from({ length: 3 }, (_, i) => ({
            id: i + 1,
            weight: 0,
            repeatCount: 10,
          }));

          return {
            id: crypto.randomUUID(),
            name: exercise.name,
            favorite: false,
            description: exercise.notes || "",
            muscleGroups: exercise.type || ["strength"],
            restTime: 60,
            useCustomSets: false,
            completedSets: 0,
            sets: defaultSets,
          };
        },
      );

      const newActiveTraining: ApiSchemas["ActiveTraining"] = {
        id: crypto.randomUUID(),
        dateStart: new Date().toISOString(),
        exercises: initializedExercises,
      };

      setActiveTraining(newActiveTraining);
    }
  }, [training, activeTraining]);

  const toggleCustomSets = (exerciseIndex: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const exercise = newExercises[exerciseIndex];
      const newUseCustomSets = !exercise.useCustomSets;

      if (!newUseCustomSets && exercise.sets.length > 0) {
        const firstSet = exercise.sets[0];
        newExercises[exerciseIndex] = {
          ...exercise,
          useCustomSets: newUseCustomSets,
          sets: exercise.sets.map((set) => ({
            ...set,
            weight: firstSet.weight,
            reps: firstSet.repeatCount,
            restTime: firstSet.repeatCount,
          })),
        };
      } else {
        newExercises[exerciseIndex] = {
          ...exercise,
          useCustomSets: newUseCustomSets,
        };
      }

      return {
        ...prev,
        exercises: newExercises,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removeExercise = (exerciseIndex: number) => {
    if (!activeTraining || activeTraining.exercises.length <= 1) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== exerciseIndex),
        updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
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
        id: crypto.randomUUID(),
        sets: exerciseToDuplicate.sets.map((set) => ({
          ...set,
          setId: crypto.randomUUID(),
        })),
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
        updatedAt: new Date().toISOString(),
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

  // Функция для обновления заметок упражнения
  const updateExerciseNotes = (exerciseIndex: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex] = {
        ...newExercises[exerciseIndex],
      };

      return {
        ...prev,
        exercises: newExercises,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleSave = async () => {
    if (!activeTraining || !trainingId) return;

    // const trainingToSave: ApiSchemas["CreateActiveTraining"] = {
    //   exercises: activeTraining.exercises.map((ex) => ({
    //     ...ex,
    //   })),
    // };

    navigate(href(ROUTES.ACTIVE_TRAINING, { trainingId: activeTraining.id }));
  };

  if (!activeTraining) {
    return <div className={styles.loading}>Загрузка тренировки...</div>;
  }

  if (!training) {
    return <div className={styles.notFound}>Тренировка не найдена</div>;
  }

  return (
    <div className={styles.container}>
      {/* Шапка */}
      <div className={styles.header}>
        <h1 className={styles.title}>{"Тренировка"}</h1>
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
          <Card key={exercise.id} className={styles.exerciseCard}>
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
                      {exercise.muscleGroups.slice(0, 3).map((group, i) => (
                        <Badge key={i} variant="outline" className={styles.tag}>
                          {group}
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

              {/* Переключатель разных весов */}
              <div className={styles.customSetsToggle}>
                <div className={styles.toggleContainer}>
                  <Label
                    htmlFor={`custom-${exerciseIndex}`}
                    className={styles.toggleLabel}
                  >
                    Разные веса/повторения для подходов
                  </Label>
                  <Switch
                    id={`custom-${exerciseIndex}`}
                    checked={exercise.useCustomSets}
                    onCheckedChange={() => toggleCustomSets(exerciseIndex)}
                  />
                </div>
                <p className={styles.toggleDescription}>
                  {exercise.useCustomSets
                    ? "Каждый подход настраивается отдельно"
                    : "Все подходы с одинаковыми параметрами"}
                </p>
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
                  value={exercise.description}
                  onChange={() => updateExerciseNotes(exerciseIndex)}
                  placeholder="Заметки по технике, ощущения..."
                  className={styles.notesTextarea}
                />
              </div>
            </CardContent>
          </Card>
        ))}
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
    </div>
  );
};

export const Component = TrainingStartPage;
