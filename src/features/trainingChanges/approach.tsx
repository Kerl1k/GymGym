import { FC, useState } from "react";

import { PlusIcon, TrashIcon, ClockIcon, DumbbellIcon } from "lucide-react";

import {
  cloneUnitsTemplate,
  setUnitValueAt,
} from "@/shared/lib/active-training-units";
import { cn } from "@/shared/lib/css";
import { ApiSchemas } from "@/shared/schema";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";

import styles from "./training-start.module.scss";

type ActiveExercise = ApiSchemas["ActiveTraining"]["exercises"][number];
type TrainingSet = ApiSchemas["Set"];

type Props = {
  exercise: ActiveExercise;
  activeTraining: ApiSchemas["ActiveTraining"] | null;
  setActiveTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"] | null>
  >;
  exerciseIndex: number;
};

const SETS_PREVIEW = 4;

function parseUnitInput(raw: string): number {
  if (raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** В инпуте не показываем 0 — удобнее вводить число с пустого поля */
function zeroAsEmpty(n: number | undefined): string | number {
  if (n === undefined || n === 0) return "";
  return n;
}

const Approach: FC<Props> = ({
  exercise,
  activeTraining,
  setActiveTraining,
  exerciseIndex,
}) => {
  const [isSetsExpanded, setIsSetsExpanded] = useState(false);

  const visibleSets: TrainingSet[] =
    exercise.sets.length > SETS_PREVIEW && !isSetsExpanded
      ? exercise.sets.slice(0, SETS_PREVIEW)
      : exercise.sets;

  const updateUnitValue = (
    setIndex: number,
    unitIndex: number,
    raw: string,
  ) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const ex = newExercises[exerciseIndex];
      const newSets = [...ex.sets];
      const set = newSets[setIndex];
      newSets[setIndex] = setUnitValueAt(
        set,
        unitIndex,
        parseUnitInput(raw),
      );
      newExercises[exerciseIndex] = { ...ex, sets: newSets };

      return { ...prev, exercises: newExercises };
    });
  };

  const addSet = () => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const ex = newExercises[exerciseIndex];
      const last = ex.sets[ex.sets.length - 1];
      const newSet: TrainingSet = {
        done: false,
        units: last
          ? cloneUnitsTemplate(last)
          : [
              { name: "Вес", value: 0 },
              { name: "Повторения", value: 0 },
            ],
      };

      newExercises[exerciseIndex] = {
        ...ex,
        sets: [...ex.sets, newSet],
      };

      return { ...prev, exercises: newExercises };
    });
  };

  const removeSet = (setIndex: number) => {
    if (!activeTraining) return;

    setActiveTraining((prev) => {
      if (!prev) return prev;

      const newExercises = [...prev.exercises];
      const ex = newExercises[exerciseIndex];

      if (ex.sets.length <= 1) return prev;

      newExercises[exerciseIndex] = {
        ...ex,
        sets: ex.sets.filter((_, i) => i !== setIndex),
      };

      return { ...prev, exercises: newExercises };
    });
  };

  return (
    <div className={styles.setsSection}>
      <div className={styles.customSets}>
        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>
            <ClockIcon className={styles.fieldIcon} />
            Отдых (сек)
          </Label>
          <Input
            type="number"
            value={zeroAsEmpty(exercise.restTime)}
            onChange={(e) => {
              if (!activeTraining) return;
              setActiveTraining((prev) => {
                if (!prev) return prev;
                const newExercises = [...prev.exercises];
                newExercises[exerciseIndex] = {
                  ...newExercises[exerciseIndex],
                  restTime: e.target.value === "" ? 0 : Number(e.target.value),
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
          {visibleSets.map((set, setIndex) => {
            return (
              <div key={setIndex} className={styles.setItem}>
                <div className={styles.setHeader}>
                  <div className={styles.setNumber}>
                    <DumbbellIcon className={styles.setIcon} />
                    <span>Подход {setIndex + 1}</span>
                    {set.done ? (
                      <Badge
                        size="sm"
                        variant="outline"
                        className={cn(
                          "ml-2 border-emerald-200 bg-emerald-50 text-emerald-900",
                          "dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
                        )}
                      >
                        done
                      </Badge>
                    ) : null}
                  </div>
                  <div className={styles.setActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSet(setIndex)}
                      disabled={exercise.sets.length <= 1}
                      className={styles.removeButton}
                    >
                      <TrashIcon className={styles.removeIcon} />
                    </Button>
                  </div>
                </div>

                <div className={styles.setFields}>
                  {set.units.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Нет единиц измерения для этого подхода
                    </p>
                  ) : (
                    set.units.map((unit, unitIndex) => (
                      <div key={unitIndex} className={styles.setField}>
                        <Input
                          type="number"
                          value={zeroAsEmpty(unit.value)}
                          onChange={(e) =>
                            updateUnitValue(
                              setIndex,
                              unitIndex,
                              e.target.value,
                            )
                          }
                          className={cn(
                            styles.setInput,
                            "h-8 w-[4.25rem] shrink-0 px-2 text-sm tabular-nums md:text-sm",
                          )}
                        />
                        <Label className={styles.setFieldLabel}>
                          {unit.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {exercise.sets.length > SETS_PREVIEW ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setIsSetsExpanded((v) => !v)}
          >
            {isSetsExpanded
              ? "Свернуть подходы"
              : `Показать ещё (${exercise.sets.length - SETS_PREVIEW})`}
          </Button>
        ) : null}

        <Button
          onClick={() => addSet()}
          variant="outline"
          className={styles.addSetButton}
        >
          <PlusIcon className={styles.addIcon} />
          Добавить подход
        </Button>
      </div>
    </div>
  );
};

export default Approach;
