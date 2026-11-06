import { PenIcon, TrashIcon } from "lucide-react";

import { useExercisesDelete } from "@/entities/exercises/use-exercises-delete";
import { useOpen } from "@/shared/lib/useOpen";
import { ApiSchemas } from "@/shared/schema";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { ModalDelete } from "@/shared/ui/kit/modalDelete";

import { ExercisesListItem } from "./exercises-list-item/exercises-list-item";
import { ExercisesCreate } from "./exercisesCreate";

export function ExerciseItem({
  exercises,
}: {
  exercises: ApiSchemas["ExerciseType"];
}) {
  const { open, close, isOpen } = useOpen();
  const {
    open: openDelete,
    close: closeDelete,
    isOpen: isOpenDelete,
  } = useOpen();

  const { deleteExercises } = useExercisesDelete();

  return (
    <>
      <ExercisesListItem
        key={exercises.id}
        exercise={exercises}
        menuActions={
          <>
            <DropdownMenuItem onClick={() => open()} className="gap-2">
              <PenIcon className="h-4 w-4" />
              Изменить
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openDelete}
              variant="destructive"
              className="gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </>
        }
      />
      {isOpen ? (
        <ExercisesCreate exercises={exercises} close={close} />
      ) : null}
      <ModalDelete
        close={closeDelete}
        isOpen={isOpenDelete}
        onConfirm={() => deleteExercises(exercises.id)}
      />
    </>
  );
}
