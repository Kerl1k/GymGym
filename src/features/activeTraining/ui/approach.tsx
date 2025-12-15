import { ApiSchemas } from "@/shared/schema";
import styles from "./training-start.module.scss";
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
  activeTraining: ApiSchemas["ActiveExercise"] | null;
  setActiveTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveExercise"] | null>
  >;
};

interface TrainingSet {
  setId: string;
  activeTrainingId: string;
  setNumber: number;
  weight: number;
  reps: number;
  restTime: number;
  completed?: boolean;
  completedAt?: string;
  notes: string;
}
const Approach: FC<Props> = ({ activeTraining, setActiveTraining }) => {
  const handleSetChange = (
    setIndex: number,
    field: keyof TrainingSet,
    value: number | string,
  ) => {
    if (!activeTraining) return;

    setActiveTraining(() => {
      const newactiveTrainings = activeTraining;
      newactiveTrainings.sets[setIndex] = {
        ...newactiveTrainings.sets[setIndex],
        [field]: value,
      };

      return {
        ...newactiveTrainings,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const addSet = () => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      let newactiveTrainings = activeTraining;
      const newSetNumber = activeTraining.sets.length + 1;

      newactiveTrainings = {
        ...activeTraining,
        sets: [
          ...activeTraining.sets,
          {
            setId: crypto.randomUUID(),
            exerciseId: activeTraining.exerciseId,
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
        activeTrainings: newactiveTrainings,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removeSet = (setIndex: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      let newactiveTrainings = activeTraining;

      if (activeTraining.sets.length <= 1) return prev;

      newactiveTrainings = {
        ...activeTraining,
        sets: activeTraining.sets
          .filter((_, i) => i !== setIndex)
          .map((set, index) => ({
            ...set,
            setNumber: index + 1,
          })),
      };

      return {
        ...newactiveTrainings,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateAllSets = (
    field: "weight" | "reps" | "restTime",
    value: number,
  ) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newactiveTrainings = activeTraining;
      newactiveTrainings.sets = newactiveTrainings.sets.map((set) => ({
        ...set,
        [field]: value,
      }));

      return {
        ...newactiveTrainings,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  if (!activeTraining) return null;

  return (
    <div className={styles.setsSection}>
      {!activeTraining.useCustomSets ? (
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
                value={activeTraining.sets[0]?.weight || 0}
                onChange={(e) =>
                  updateAllSets("weight", Number(e.target.value))
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
                value={activeTraining.sets[0]?.reps || 10}
                onChange={(e) => updateAllSets("reps", Number(e.target.value))}
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
                value={activeTraining.sets.length}
                onChange={(e) => {
                  const newCount = Number(e.target.value);
                  const currentCount = activeTraining.sets.length;

                  if (newCount > currentCount) {
                    for (let i = currentCount; i < newCount; i++) {
                      addSet();
                    }
                  } else if (newCount < currentCount) {
                    for (let i = currentCount - 1; i >= newCount; i--) {
                      removeSet(i);
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
                value={activeTraining.sets[0]?.restTime || 60}
                onChange={(e) =>
                  updateAllSets("restTime", Number(e.target.value))
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
            {activeTraining.sets.map((set, setIndex) => (
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
                      onClick={() => removeSet(setIndex)}
                      disabled={activeTraining.sets.length <= 1}
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
