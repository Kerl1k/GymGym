import { FC } from "react";

import {
  PlusIcon,
  TrashIcon,
  WeightIcon,
  RepeatIcon,
  LayersIcon,
  ClockIcon,
  DumbbellIcon,
} from "lucide-react";

import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";

import styles from "./training-start.module.scss";

type Props = {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  activeTraining: ApiSchemas["ActiveTraining"] | null;
  setActiveTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"] | null>
  >;
  exerciseIndex: number;
};

const Approach: FC<Props> = ({
  exercise,
  activeTraining,
  setActiveTraining,
  exerciseIndex,
}) => {
  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field:
      | keyof ApiSchemas["ActiveTraining"]["exercises"][0]
      | keyof ApiSchemas["ActiveTraining"]["exercises"][0]["sets"][0],
    value: number | string,
  ) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex].sets[setIndex] = {
        ...newExercises[exerciseIndex].sets[setIndex],
        [field]: value === "" ? (field === "repeatCount" ? 1 : 0) : value,
      };

      return {
        ...prev,
        exercises: newExercises,
      };
    });
  };

  const addSet = () => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];

      newExercises[exerciseIndex] = {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            weight: 0,
            repeatCount: 0,
            done: false,
          },
        ],
      };

      return {
        ...prev,
        exercises: newExercises,
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex?: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const exercise = newExercises[exerciseIndex];

      if (exercise.sets.length <= 1) return prev;

      // Remove the specific set or the last set if no index provided
      const indexToRemove =
        setIndex !== undefined ? setIndex : exercise.sets.length - 1;
      newExercises[exerciseIndex] = {
        ...exercise,
        sets: exercise.sets.filter((_, i) => i !== indexToRemove),
      };

      return {
        ...prev,
        exercises: newExercises,
      };
    });
  };

  const updateAllSets = (
    exerciseIndex: number,
    field: "weight" | "repeatCount" | "restTime",
    value: number | string,
  ) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.map(
        (set) => ({
          ...set,
          [field]: value === "" ? (field === "repeatCount" ? 1 : 0) : value,
        }),
      );

      return {
        ...prev,
        exercises: newExercises,
      };
    });
  };

  return (
    <div className={styles.setsSection}>
      {!exercise.useCustomSets ? (
        <div className={styles.uniformSets}>
          <div className={styles.uniformFields}>
            <div className={styles.fieldGroup}>
              <Label className={styles.fieldLabel}>
                <WeightIcon className={styles.fieldIcon} />
                Вес (кг)
              </Label>
              <Input
                type="number"
                value={
                  exercise.sets[0]?.weight !== undefined
                    ? exercise.sets[0]?.weight
                    : ""
                }
                onChange={(e) =>
                  updateAllSets(
                    exerciseIndex,
                    "weight",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
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
                value={
                  exercise.sets[0]?.repeatCount !== undefined
                    ? exercise.sets[0]?.repeatCount
                    : ""
                }
                onChange={(e) =>
                  updateAllSets(
                    exerciseIndex,
                    "repeatCount",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
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
                      addSet();
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
                value={exercise.restTime !== undefined ? exercise.restTime : ""}
                onChange={(e) => {
                  if (!activeTraining) return;
                  setActiveTraining((prev) => {
                    if (!prev) return prev;
                    const newExercises = [...prev.exercises];
                    newExercises[exerciseIndex] = {
                      ...newExercises[exerciseIndex],
                      restTime:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    };
                    return {
                      ...prev,
                      exercises: newExercises,
                    };
                  });
                }}
                className={styles.fieldInput}
                min="0"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.customSets}>
          <div className={styles.fieldGroup}>
            <Label className={styles.fieldLabel}>
              <ClockIcon className={styles.fieldIcon} />
              Отдых (сек)
            </Label>
            <Input
              type="number"
              value={exercise.restTime !== undefined ? exercise.restTime : ""}
              onChange={(e) => {
                if (!activeTraining) return;
                setActiveTraining((prev) => {
                  if (!prev) return prev;
                  const newExercises = [...prev.exercises];
                  newExercises[exerciseIndex] = {
                    ...newExercises[exerciseIndex],
                    restTime:
                      e.target.value === "" ? 0 : Number(e.target.value),
                  };
                  return {
                    ...prev,
                    exercises: newExercises,
                  };
                });
              }}
              className={styles.fieldInput}
              min="0"
            />
          </div>
          <div className={styles.setsList}>
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className={styles.setItem}>
                <div className={styles.setHeader}>
                  <div className={styles.setNumber}>
                    <DumbbellIcon className={styles.setIcon} />
                    <span>Подход {setIndex + 1}</span>
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
                      value={set.weight !== undefined ? set.weight : ""}
                      onChange={(e) =>
                        handleSetChange(
                          exerciseIndex,
                          setIndex,
                          "weight",
                          e.target.value === "" ? "" : Number(e.target.value),
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
                      value={
                        set.repeatCount !== undefined ? set.repeatCount : ""
                      }
                      onChange={(e) =>
                        handleSetChange(
                          exerciseIndex,
                          setIndex,
                          "repeatCount",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className={styles.setInput}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => addSet()}
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
