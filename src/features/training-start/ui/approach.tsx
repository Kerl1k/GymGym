import { ApiSchemas } from "@/shared/schema";
import styles from "../training-start.module.scss";
import { Input } from "@/shared/ui/kit/inputLogin";
import { Label } from "@/shared/ui/kit/label";
import {
  PlusIcon,
  TrashIcon,
  WeightIcon,
  RepeatIcon,
  LayersIcon,
  ClockIcon,
  DumbbellIcon,
} from "lucide-react";
import { FC } from "react";
import { Button } from "@/shared/ui/kit/button";

type Props = {
  exercise: ApiSchemas["ActiveExercise"];
  activeTraining: ApiSchemas["ActiveTraining"] | null;
  setActiveTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"] | null>
  >;
  exerciseIndex: number;
};

interface TrainingSet {
  setId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  restTime: number;
  completed?: boolean;
  completedAt?: string;
  notes: string;
}
const Approach: FC<Props> = ({
  exercise,
  activeTraining,
  setActiveTraining,
  exerciseIndex,
}) => {
  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof TrainingSet,
    value: number | string,
  ) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex].sets[setIndex] = {
        ...newExercises[exerciseIndex].sets[setIndex],
        [field]: value,
      };

      return {
        ...prev,
        exercises: newExercises,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const addSet = (exerciseIndex: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const exercise = newExercises[exerciseIndex];
      const newSetNumber = exercise.sets.length + 1;

      newExercises[exerciseIndex] = {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            setId: crypto.randomUUID(),
            exerciseId: exercise.exerciseId,
            setNumber: newSetNumber,
            weight: 0,
            reps: 10,
            restTime: 60,
            completed: false,
            notes: "",
          },
        ],
      };

      return {
        ...prev,
        exercises: newExercises,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const exercise = newExercises[exerciseIndex];

      if (exercise.sets.length <= 1) return prev;

      newExercises[exerciseIndex] = {
        ...exercise,
        sets: exercise.sets
          .filter((_, i) => i !== setIndex)
          .map((set, index) => ({
            ...set,
            setNumber: index + 1,
          })),
      };

      return {
        ...prev,
        exercises: newExercises, // Исправлено
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateAllSets = (
    exerciseIndex: number,
    field: "weight" | "reps" | "restTime",
    value: number,
  ) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises]; // Исправлено
      newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.map(
        (set) => ({
          ...set,
          [field]: value,
        }),
      );

      return {
        ...prev,
        exercises: newExercises, // Исправлено
        updatedAt: new Date().toISOString(),
      };
    });
  };

  return (
    <div className={styles.setsSection}>
      {!exercise.useCustomSets ? (
        // Режим одинаковых подходов
        <div className={styles.uniformSets}>
          <div className={styles.uniformFields}>
            <div className={styles.fieldGroup}>
              <Label className={styles.fieldLabel}>
                <WeightIcon className={styles.fieldIcon} />
                Вес (кг)
              </Label>
              <Input
                type="number"
                value={exercise.sets[0]?.weight || 0}
                onChange={(e) =>
                  updateAllSets(exerciseIndex, "weight", Number(e.target.value))
                }
                className={styles.fieldInput}
                min="0"
                step="0.5"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label className={styles.fieldLabel}>
                <RepeatIcon className={styles.fieldIcon} />
                Повторения
              </Label>
              <Input
                type="number"
                value={exercise.sets[0]?.reps || 10}
                onChange={(e) =>
                  updateAllSets(exerciseIndex, "reps", Number(e.target.value))
                }
                className={styles.fieldInput}
                min="1"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label className={styles.fieldLabel}>
                <LayersIcon className={styles.fieldIcon} />
                Подходы
              </Label>
              <Input
                type="number"
                value={exercise.sets.length}
                onChange={(e) => {
                  const newCount = Number(e.target.value);
                  const currentCount = exercise.sets.length;

                  if (newCount > currentCount) {
                    for (let i = currentCount; i < newCount; i++) {
                      addSet(exerciseIndex);
                    }
                  } else if (newCount < currentCount) {
                    for (let i = currentCount - 1; i >= newCount; i--) {
                      removeSet(exerciseIndex, i);
                    }
                  }
                }}
                className={styles.fieldInput}
                min="1"
              />
            </div>

            <div className={styles.fieldGroup}>
              <Label className={styles.fieldLabel}>
                <ClockIcon className={styles.fieldIcon} />
                Отдых (сек)
              </Label>
              <Input
                type="number"
                value={exercise.sets[0]?.restTime || 60}
                onChange={(e) =>
                  updateAllSets(
                    exerciseIndex,
                    "restTime",
                    Number(e.target.value),
                  )
                }
                className={styles.fieldInput}
                min="0"
              />
            </div>
          </div>
        </div>
      ) : (
        // Режим разных подходов
        <div className={styles.customSets}>
          <div className={styles.setsList}>
            {exercise.sets.map((set, setIndex) => (
              <div key={set.setId} className={styles.setItem}>
                <div className={styles.setHeader}>
                  <div className={styles.setNumber}>
                    <DumbbellIcon className={styles.setIcon} />
                    <span>Подход {set.setNumber}</span>
                  </div>
                  <div className={styles.setActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      disabled={exercise.sets.length <= 1}
                      className={styles.removeButton}
                    >
                      <TrashIcon className={styles.removeIcon} />
                    </Button>
                  </div>
                </div>

                <div className={styles.setFields}>
                  <div className={styles.setField}>
                    <Label className={styles.setFieldLabel}>Вес (кг)</Label>
                    <Input
                      type="number"
                      value={set.weight}
                      onChange={(e) =>
                        handleSetChange(
                          exerciseIndex,
                          setIndex,
                          "weight",
                          Number(e.target.value),
                        )
                      }
                      className={styles.setInput}
                      min="0"
                      step="0.5"
                    />
                  </div>

                  <div className={styles.setField}>
                    <Label className={styles.setFieldLabel}>Повторения</Label>
                    <Input
                      type="number"
                      value={set.reps}
                      onChange={(e) =>
                        handleSetChange(
                          exerciseIndex,
                          setIndex,
                          "reps",
                          Number(e.target.value),
                        )
                      }
                      className={styles.setInput}
                      min="1"
                    />
                  </div>

                  <div className={styles.setField}>
                    <Label className={styles.setFieldLabel}>Отдых (сек)</Label>
                    <Input
                      type="number"
                      value={set.restTime}
                      onChange={(e) =>
                        handleSetChange(
                          exerciseIndex,
                          setIndex,
                          "restTime",
                          Number(e.target.value),
                        )
                      }
                      className={styles.setInput}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => addSet(exerciseIndex)}
            variant="outline"
            className={styles.addSetButton}
          >
            <PlusIcon className={styles.addIcon} />
            Добавить подход
          </Button>
        </div>
      )}
    </div>
  );
};

export default Approach;
