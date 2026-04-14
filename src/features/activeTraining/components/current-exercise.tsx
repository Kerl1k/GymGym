import { useState, useRef, useEffect } from "react";

import { ClockIcon, EditIcon, CheckIcon, XIcon } from "lucide-react";

import { setUnitValueAt } from "@/shared/lib/active-training-units";
import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";

type CurrentExerciseProps = {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][number];
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  onCompleteSet: () => void;
};

function parseUnitInput(raw: string): number {
  if (raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function CurrentExercise({
  exercise,
  setTraining,
  onCompleteSet,
}: CurrentExerciseProps) {
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentSets = exercise.sets.filter((set) => set.done).length;
  const activeSetIndex = Math.min(
    currentSets,
    Math.max(exercise.sets.length - 1, 0),
  );

  const activeSet = exercise.sets[activeSetIndex];

  const [tempUnits, setTempUnits] = useState<string[]>([]);

  useEffect(() => {
    const set = exercise.sets[activeSetIndex];
    if (!set) {
      setTempUnits([]);
      return;
    }
    setTempUnits(set.units.map((u) => (u.value === 0 ? "" : String(u.value))));
    setEditingUnitIndex(null);
  }, [activeSetIndex, exercise.sets]);

  const updateUnitAt = (unitIndex: number) => {
    const raw = tempUnits[unitIndex] ?? "";
    setTraining((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id === exercise.id) {
          return {
            ...ex,
            sets: ex.sets.map((set, index) => {
              if (index === activeSetIndex) {
                return setUnitValueAt(set, unitIndex, parseUnitInput(raw));
              }
              return set;
            }),
          };
        }
        return ex;
      }),
    }));
    setEditingUnitIndex(null);
  };

  const cancelEdit = (unitIndex: number) => {
    const set = exercise.sets[activeSetIndex];
    const u = set?.units[unitIndex];
    setTempUnits((prev) => {
      const next = [...prev];
      next[unitIndex] = u && u.value !== 0 ? String(u.value) : "";
      return next;
    });
    setEditingUnitIndex(null);
  };

  if (!exercise.sets) return null;

  const units = activeSet?.units ?? [];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl md:text-3xl">
          {exercise.name}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-6 space-y-3">
          {units.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Нет параметров для этого подхода
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {units.map((unit, unitIndex) => (
                <div
                  key={`${unit.name}-${unitIndex}`}
                  className="bg-card rounded-xl border border-border p-3 sm:p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground line-clamp-2 min-w-0 flex-1 text-sm font-medium sm:text-base">
                      {unit.name}
                    </span>

                    {editingUnitIndex === unitIndex ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateUnitAt(unitIndex)}
                          className="p-1"
                        >
                          <CheckIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelEdit(unitIndex)}
                          className="p-1"
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingUnitIndex(unitIndex);
                          setTimeout(
                            () => inputRefs.current[unitIndex]?.focus(),
                            0,
                          );
                        }}
                        className="shrink-0 p-1"
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {editingUnitIndex === unitIndex ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={(el) => {
                          inputRefs.current[unitIndex] = el;
                        }}
                        type="number"
                        value={tempUnits[unitIndex] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTempUnits((prev) => {
                            const next = [...prev];
                            next[unitIndex] = v;
                            return next;
                          });
                        }}
                        className="border-input bg-background w-16 min-w-0 rounded border px-2 py-1 text-xl font-bold tabular-nums sm:w-30 sm:px-3 sm:text-2xl"
                        min="0"
                        step="any"
                      />
                    </div>
                  ) : (
                    <div className="text-foreground text-2xl font-bold tabular-nums sm:text-3xl">
                      {unit.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm font-medium sm:text-base">Отдых</span>
            </div>
            <div className="text-foreground text-2xl font-bold sm:text-3xl">
              {exercise.restTime}
              <span className="text-muted-foreground text-lg sm:text-xl">
                {" "}
                сек
              </span>
            </div>
            <div className="text-muted-foreground mt-1 text-xs sm:text-sm">
              между подходами
            </div>
          </div>
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
