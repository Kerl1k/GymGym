import { FC, useCallback } from "react";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";

import { ApiSchemas } from "@/shared/schema";

type ExerciseType = ApiSchemas["ActiveTraining"]["exercises"][number];

type ExercisesSidebarProps = {
  exercises: ExerciseType[];
  indexCurrentExercise: number;
  activeExerciseIndex: number;
  selectedExerciseIndex: number | null;
  setSelectedExerciseIndex: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  setTraining: React.Dispatch<React.SetStateAction<ApiSchemas["ActiveTraining"]>>;
  openExerciseModal: () => void;
};

type ExerciseRowProps = {
  exercise: ExerciseType;
  index: number;
  isSelected: boolean;
  isCompleted: boolean;
  doneCount: number;
  onSelect: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const rowIconButtonBase =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background transition-colors";
const rowIconButtonEnabled = "text-foreground hover:bg-accent/40 active:scale-95";
const rowIconButtonDisabled = "cursor-not-allowed text-muted-foreground/60";

const ExerciseRow: FC<ExerciseRowProps> = ({
  exercise,
  index,
  isSelected,
  isCompleted,
  doneCount,
  onSelect,
  canMoveDown,
  canMoveUp,
  onMoveDown,
  onMoveUp,
}) => {
  return (
    <div
      className={`group w-full rounded-xl border p-3 text-left transition-all sm:p-4 ${
        isSelected
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">
            {index + 1}. {exercise.name}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            {isCompleted && (
              <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
            )}
            {doneCount} / {exercise.sets.length} подходов
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              disabled={!canMoveUp}
              className={`${rowIconButtonBase} ${
                canMoveUp ? rowIconButtonEnabled : rowIconButtonDisabled
              }`}
              aria-label="Переместить упражнение выше"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={!canMoveDown}
              className={`${rowIconButtonBase} ${
                canMoveDown ? rowIconButtonEnabled : rowIconButtonDisabled
              }`}
              aria-label="Переместить упражнение ниже"
            >
              <ArrowDownIcon className="h-4 w-4" />
            </button>
          </div>

          <span
            className={`${rowIconButtonBase} text-muted-foreground`}
            aria-hidden="true"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};

export const ExercisesSidebar: FC<ExercisesSidebarProps> = ({
  exercises,
  indexCurrentExercise,
  activeExerciseIndex,
  selectedExerciseIndex,
  setSelectedExerciseIndex,
  setTraining,
  openExerciseModal,
}) => {
  const moveExercise = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (dragIndex === hoverIndex) return;

      setTraining((prev) => {
        const nextExercises = [...prev.exercises];
        const [removed] = nextExercises.splice(dragIndex, 1);
        nextExercises.splice(hoverIndex, 0, removed);
        return { ...prev, exercises: nextExercises };
      });

      setSelectedExerciseIndex((prev) => {
        if (prev === null) return prev;
        if (prev === dragIndex) return hoverIndex;

        const min = Math.min(dragIndex, hoverIndex);
        const max = Math.max(dragIndex, hoverIndex);
        if (prev < min || prev > max) return prev;

        if (dragIndex < hoverIndex) {
          return prev - 1;
        }
        return prev + 1;
      });
    },
    [setSelectedExerciseIndex, setTraining],
  );

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {selectedExerciseIndex !== null &&
        selectedExerciseIndex !== indexCurrentExercise && (
          <button
            type="button"
            onClick={() => setSelectedExerciseIndex(null)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/40"
          >
            Вернуться к текущему упражнению
          </button>
        )}

      {exercises.map((exercise, index) => {
        const isSelected = activeExerciseIndex === index;
        const isCompleted =
          exercise.sets.length > 0 && exercise.sets.every((set) => set.done);
        const doneCount = exercise.sets.filter((s) => s.done).length;

        return (
          <ExerciseRow
            key={`${exercise.id}-${index}`}
            exercise={exercise}
            index={index}
            isSelected={isSelected}
            isCompleted={isCompleted}
            doneCount={doneCount}
            onSelect={() => setSelectedExerciseIndex(index)}
            canMoveUp={index > 0}
            canMoveDown={index < exercises.length - 1}
            onMoveUp={() => moveExercise(index, index - 1)}
            onMoveDown={() => moveExercise(index, index + 1)}
          />
        );
      })}

      <button
        type="button"
        onClick={openExerciseModal}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5 sm:p-4"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary">
          <PlusIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-primary">
            Добавить упражнение
          </span>
        </span>
      </button>
    </div>
  );
};

