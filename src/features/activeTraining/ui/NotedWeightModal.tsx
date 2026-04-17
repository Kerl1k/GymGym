import { FC, useState, useEffect, useRef } from "react";

import { Plus, Minus, Dumbbell, Repeat, Save } from "lucide-react";

import {
  createEmptySetFromExerciseTemplate,
  ensureUnitsMinLength,
  getUnitValue,
  REPS_UNIT_INDEX,
  setUnitValueAt,
  WEIGHT_UNIT_INDEX,
} from "@/shared/lib/active-training-units";
import { getMuscleGroupColor } from "@/shared/lib/utils";
import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import { Card } from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";

type NotedWeightModalProps = {
  isOpen: boolean;
  currentExercise: ApiSchemas["ActiveTraining"]["exercises"][0];
  close: () => void;
  onAfterClose?: () => void;
  initialData?:
    | ApiSchemas["ActiveTraining"]["exercises"][0]["sets"]
    | ApiSchemas["ActiveTraining"]["exercises"][0]["sets"][number];
  completeSet: (set: ApiSchemas["Set"]) => void;
};

const weightPresets = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];
const repPresets = [5, 8, 10, 12, 15, 20];
const secPresets = [10, 15, 20, 30, 45, 60, 90, 120, 180];
const minPresets = [1, 2, 3, 4, 5, 8, 10, 12, 15, 20];
const distanceMPresets = [10, 20, 50, 100, 200, 500, 1000];
const distanceCmPresets = [10, 20, 30, 50, 80, 100, 120];
const rpePresets = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const percent1rmPresets = [50, 60, 70, 75, 80, 85, 90, 95, 100];

function getPresetsForUnit(unitName: string | undefined, unitIndex: number) {
  const raw = (unitName ?? "").trim().toLowerCase();
  // normalize: collapse spaces, remove trailing dots
  const name = raw.replace(/\s+/g, " ").replace(/\.+$/g, "");
  const compact = name.replace(/\s/g, "");

  // Backwards compatible defaults for the first two units.
  if (!name) {
    if (unitIndex === WEIGHT_UNIT_INDEX) return weightPresets;
    if (unitIndex === REPS_UNIT_INDEX) return repPresets;
    return [];
  }

  if (["кг", "kg", "lb", "lbs"].includes(name)) return weightPresets;
  if (name.startsWith("кг")) return weightPresets;

  if (
    ["раз", "повт", "повтор", "повторения", "reps", "rep"].includes(name) ||
    name.startsWith("повт") ||
    name.startsWith("повтор")
  )
    return repPresets;

  if (
    ["подход", "подходы", "set", "sets"].includes(name) ||
    name.startsWith("подход")
  )
    return [1, 2, 3, 4, 5, 6];

  if (
    ["сек", "s", "sec", "second", "seconds"].includes(name) ||
    name.startsWith("сек")
  )
    return secPresets;

  if (
    ["мин", "min", "minute", "minutes"].includes(name) ||
    name.startsWith("мин")
  )
    return minPresets;

  // Distance
  if (name === "м") return distanceMPresets;
  if (name === "см") return distanceCmPresets;

  // Effort
  if (name === "rpe") return rpePresets;

  // % 1RM / 1ПМ
  if (
    name === "%" ||
    compact === "%от1пм" ||
    compact === "%от1rm" ||
    name.includes("1пм") ||
    name.includes("1rm") ||
    name.startsWith("%")
  )
    return percent1rmPresets;

  // Fallback: only show presets for legacy positions.
  if (unitIndex === WEIGHT_UNIT_INDEX) return weightPresets;
  if (unitIndex === REPS_UNIT_INDEX) return repPresets;
  return [];
}

function stripLeadingZerosFromNumericInput(value: string): string {
  if (value === "") return "";
  if (/^0[.,]\d*$/.test(value)) return value;
  return value.replace(/^0+(?=\d)/, "");
}

export const NotedWeightModal: FC<NotedWeightModalProps> = ({
  close,
  onAfterClose,
  isOpen,
  currentExercise,
  initialData,
  completeSet,
}) => {
  const [sets, setSets] = useState<
    ApiSchemas["ActiveTraining"]["exercises"][0]["sets"]
  >([createEmptySetFromExerciseTemplate(currentExercise.sets[0])]);
  const [draftInputs, setDraftInputs] = useState<string[][]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  function normalizeDecimalInput(raw: string): string {
    // Allow empty (to clear), digits, and a single decimal separator (, or .)
    if (raw === "") return "";

    // Replace commas with dots for consistency, but keep user typing fluid.
    const replaced = raw.replace(/,/g, ".");

    // Remove invalid characters (everything except digits and dot).
    const cleaned = replaced.replace(/[^\d.]/g, "");

    // Keep only the first dot.
    const firstDot = cleaned.indexOf(".");
    if (firstDot === -1) return stripLeadingZerosFromNumericInput(cleaned);

    const before = cleaned.slice(0, firstDot + 1);
    const after = cleaned.slice(firstDot + 1).replace(/\./g, "");
    return stripLeadingZerosFromNumericInput(before + after);
  }

  function parseDecimalInputToNumber(raw: string): number {
    if (raw === "") return 0;
    const normalized = raw.replace(/,/g, ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  const handleSetChange = (index: number, unitIndex: number, raw: string) => {
    const normalized = normalizeDecimalInput(raw);

    setDraftInputs((prev) => {
      const next = prev.map((row) => [...row]);
      next[index] ??= [];
      next[index][unitIndex] = normalized;
      return next;
    });

    setSets((prev) => {
      const nextSets = [...prev];
      const numValue = parseDecimalInputToNumber(normalized);
      nextSets[index] = setUnitValueAt(nextSets[index], unitIndex, numValue);
      return nextSets;
    });
  };

  const handleIncrement = (index: number, unitIndex: number) => {
    const newSets = [...sets];
    const s = ensureUnitsMinLength(newSets[index], unitIndex + 1);
    const cur = getUnitValue(s, unitIndex);
    newSets[index] = setUnitValueAt(newSets[index], unitIndex, cur + 1);
    setSets(newSets);

    setDraftInputs((prev) => {
      const next = prev.map((row) => [...row]);
      next[index] ??= [];
      next[index][unitIndex] = String(cur + 1);
      return next;
    });
  };

  const handleDecrement = (index: number, unitIndex: number) => {
    const newSets = [...sets];
    const s = ensureUnitsMinLength(newSets[index], unitIndex + 1);
    const cur = getUnitValue(s, unitIndex);
    if (cur > 0) {
      newSets[index] = setUnitValueAt(newSets[index], unitIndex, cur - 1);
      setSets(newSets);

      setDraftInputs((prev) => {
        const next = prev.map((row) => [...row]);
        next[index] ??= [];
        next[index][unitIndex] = String(cur - 1);
        return next;
      });
    }
  };

  const handleSave = async () => {
    const first = ensureUnitsMinLength(sets[0], 2);
    completeSet({ ...first, done: true });
    close();
    onAfterClose?.();
  };

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setSets(
        initialData.length > 0
          ? initialData.map((s) => ensureUnitsMinLength(s, 2))
          : [createEmptySetFromExerciseTemplate(currentExercise.sets[0])],
      );
    } else {
      setSets([createEmptySetFromExerciseTemplate(currentExercise.sets[0])]);
    }

    // Build draft inputs from numeric values, but keep "0" as "0" (user can clear it to empty).
    const baseSets =
      initialData && Array.isArray(initialData) && initialData.length > 0
        ? initialData.map((s) => ensureUnitsMinLength(s, 2))
        : [createEmptySetFromExerciseTemplate(currentExercise.sets[0])];

    setDraftInputs(
      baseSets.map((s) => {
        const ensured = ensureUnitsMinLength(s, 2);
        return ensured.units.map((_, unitIndex) =>
          String(getUnitValue(ensured, unitIndex)),
        );
      }),
    );

    if (contentRef.current && isOpen) {
      contentRef.current.scrollTop = 0;
    }
  }, [initialData, isOpen, currentExercise.restTime, currentExercise.sets]);

  return (
    <Modal
      close={close}
      isOpen={isOpen}
      title="Запись весов и повторений"
      className="max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 [&_[data-slot=dialog-header]]:px-4 [&_[data-slot=dialog-header]]:pt-6 [&_[data-slot=dialog-header]]:pb-2 sm:[&_[data-slot=dialog-header]]:px-6 sm:[&_[data-slot=dialog-header]]:pt-7 sm:[&_[data-slot=dialog-header]]:pb-3"
    >
      <div
        ref={contentRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-4"
      >
        <Card className="p-3 sm:p-4 bg-muted">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">
                {currentExercise.name}
              </h3>
              {currentExercise.muscleGroups && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentExercise.muscleGroups.map((group, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-full ${getMuscleGroupColor(group)}`}
                    >
                      {group}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Список сетов */}
        <div className="space-y-3 sm:space-y-4">
          {sets.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="font-medium text-sm sm:text-base">Сеты</h4>
            </div>
          )}

          {sets.map((set, index) => (
            <Card key={index} className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {ensureUnitsMinLength(set, 2).units.map((unit, unitIndex) => {
                  const labelIcon =
                    unitIndex === WEIGHT_UNIT_INDEX ? (
                      <Dumbbell className="w-4 h-4" />
                    ) : unitIndex === REPS_UNIT_INDEX ? (
                      <Repeat className="w-4 h-4" />
                    ) : null;

                  const presets = getPresetsForUnit(unit?.name, unitIndex);
                  const currentValue = getUnitValue(set, unitIndex);
                  const draftValue =
                    draftInputs[index]?.[unitIndex] ?? String(currentValue);
                  const unitSuffix = unit?.name ? ` ${unit.name}` : "";

                  return (
                    <div key={unitIndex} className="space-y-2">
                      <Label
                        htmlFor={`unit-${index}-${unitIndex}`}
                        className="flex items-center gap-2 text-sm sm:text-base"
                      >
                        {labelIcon}
                        {unit?.name ?? `Параметр ${unitIndex + 1}`}
                      </Label>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecrement(index, unitIndex)}
                          className="w-8 sm:w-10 h-8 sm:h-10"
                        >
                          <Minus className="w-3 sm:w-4 h-3 sm:h-4" />
                        </Button>

                        <Input
                          id={`unit-${index}-${unitIndex}`}
                          type="text"
                          inputMode="decimal"
                          value={draftValue}
                          onChange={(e) =>
                            handleSetChange(index, unitIndex, e.target.value)
                          }
                          onFocus={(e) => {
                            if (e.target.value === "0") e.target.select();
                          }}
                          placeholder="0"
                          className="text-center text-sm sm:text-base"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleIncrement(index, unitIndex)}
                          className="w-8 sm:w-10 h-8 sm:h-10"
                        >
                          <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
                        </Button>
                      </div>

                      {presets.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {presets.slice(0, 8).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() =>
                                handleSetChange(index, unitIndex, p.toString())
                              }
                              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                                currentValue === p
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted hover:bg-muted/80 border-border"
                              }`}
                            >
                              {p}
                              {unitSuffix}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t bg-card px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            className="text-sm sm:text-base w-full sm:w-auto"
          >
            Отмена
          </Button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
