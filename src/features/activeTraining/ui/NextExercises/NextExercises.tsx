import { FC, useCallback, useMemo, useRef } from "react";

import { ArrowDownIcon, ArrowUpIcon, GripVertical, PlusIcon } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import {
  sumSetsWeightLike,
  unitsFromCatalogStrings,
} from "@/shared/lib/active-training-units";
import { cn } from "@/shared/lib/css";
import { useOpen } from "@/shared/lib/useOpen";
import { ApiSchemas } from "@/shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { ExerciseSelectModal } from "@/shared/ui/kit/exercise-select-modal";

type NextExercisesProps = {
  indexCurrentExercise: number;
  setTraining: React.Dispatch<
    React.SetStateAction<ApiSchemas["ActiveTraining"]>
  >;
  training: ApiSchemas["ActiveTraining"];
};

const ItemTypes = {
  EXERCISE: "exercise",
};

interface DraggableExerciseProps {
  exercise: ApiSchemas["ActiveTraining"]["exercises"][number];
  index: number;
  moveExercise: (dragIndex: number, hoverIndex: number) => void;
  currentIndex: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const DraggableExercise: FC<DraggableExerciseProps> = ({
  exercise,
  index,
  moveExercise,
  currentIndex,
  canMoveDown,
  canMoveUp,
  onMoveDown,
  onMoveUp,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.EXERCISE,
    item: { index },
    collect: (monitor: { isDragging: () => boolean }) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.EXERCISE,
    hover(
      item: { index: number },
      monitor: { getClientOffset: () => { x: number; y: number } | null },
    ) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      const clientOffset = monitor.getClientOffset();

      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveExercise(dragIndex, hoverIndex);

      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4 shadow-sm transition-all duration-200",
        isDragging
          ? "scale-[0.98] opacity-60 border-primary/40"
          : "opacity-100 border-border",
        isDragging ? "" : "hover:border-primary/40 hover:bg-accent/40",
      )}
      style={{ cursor: "grab" }}
    >
      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center text-sm sm:text-base font-medium text-muted-foreground">
        {currentIndex + index + 2}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {exercise.name}
        </div>
        <div className="text-sm sm:text-base text-muted-foreground">
          {exercise.sets.length} подходов ×{" "}
          {sumSetsWeightLike(exercise.sets)} кг
        </div>
      </div>
      <div className="hidden sm:flex flex-shrink-0 text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex sm:hidden items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background",
            canMoveUp
              ? "text-foreground active:scale-95"
              : "cursor-not-allowed text-muted-foreground/60",
          )}
          aria-label="Переместить упражнение выше"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background",
            canMoveDown
              ? "text-foreground active:scale-95"
              : "cursor-not-allowed text-muted-foreground/60",
          )}
          aria-label="Переместить упражнение ниже"
        >
          <ArrowDownIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const NextExercises: FC<NextExercisesProps> = ({
  training,
  setTraining,
  indexCurrentExercise,
}) => {
  const {
    close: closeExerciseModal,
    isOpen: isExerciseModalOpen,
    open: openExerciseModal,
  } = useOpen();

  const { exercises, isPending: isExercisesLoading } = useExercisesFetchList(
    {},
  );

  const isTouchDevice = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const moveExercise = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (dragIndex === hoverIndex) return;
      setTraining((prev) => {
        const exercises = [...prev.exercises];
        const [removed] = exercises.splice(
          dragIndex + indexCurrentExercise + 1,
          1,
        );
        exercises.splice(hoverIndex + indexCurrentExercise + 1, 0, removed);
        return {
          ...prev,
          exercises,
        };
      });
    },
    [indexCurrentExercise, setTraining],
  );

  const addExercise = (exerciseId: string) => {
    const selectedExercise = exercises.find((ex) => ex.id === exerciseId);
    if (!selectedExercise) return;

    setTraining((prev) => {
      const newExercise = {
        id: selectedExercise.id,
        name: selectedExercise.name,
        description: selectedExercise.description || "",
        restTime: 90,
        sets: [
          {
            units: unitsFromCatalogStrings(selectedExercise.units),
            done: false,
          },
        ],
        muscleGroups: selectedExercise.muscleGroups || [],
        useCustomSets: true,
      };

      return {
        ...prev,
        exercises: [...prev.exercises, newExercise],
      };
    });
  };

  const nextExercises = training.exercises.slice(indexCurrentExercise + 1);

  return (
    <DndProvider
      backend={isTouchDevice ? TouchBackend : HTML5Backend}
      options={isTouchDevice ? { enableMouseEvents: true } : undefined}
    >
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Следующие упражнения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 sm:space-y-3 overflow-hidden">
          {nextExercises.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Пока нет следующих упражнений. Добавьте новое ниже.
            </div>
          )}
          {nextExercises.map((exercise, index) => (
              <DraggableExercise
                key={`${exercise.id}-${index}`}
                index={index}
                exercise={exercise}
                moveExercise={moveExercise}
                currentIndex={indexCurrentExercise}
                canMoveUp={index > 0}
                canMoveDown={index < nextExercises.length - 1}
                onMoveUp={() => moveExercise(index, index - 1)}
                onMoveDown={() => moveExercise(index, index + 1)}
              />
            ))}

          <div
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card p-3 sm:p-4 transition-colors hover:border-primary/60 hover:bg-primary/5"
            onClick={openExerciseModal}
          >
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex items-center justify-center text-sm sm:text-base font-medium text-primary">
              <PlusIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-primary truncate">
                Добавить упражнение
              </div>
            </div>
          </div>
        </CardContent>
        <ExerciseSelectModal
          exercises={exercises}
          onSelect={addExercise}
          isOpen={isExerciseModalOpen}
          close={closeExerciseModal}
          isLoading={isExercisesLoading}
        />
      </Card>
    </DndProvider>
  );
};
