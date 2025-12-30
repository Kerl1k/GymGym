import { ApiSchemas } from "@/shared/schema";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { ExercisesListItem } from "./exercoses-list-item/exercoses-list-item";
import { PenIcon, TrashIcon } from "lucide-react";
import { useOpen } from "@/shared/lib/useOpen";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { ExercisesCreate } from "./exercisesCreate";
import { useExercisesDelete } from "@/entities/exercises/use-exercises-delete";
import { ModalDelete } from "@/shared/ui/kit/modalDelete";

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
        // rightActions={
        //   <ExercisesFavoriteToggle
        //     isFavorite={updateFavorite.isOptimisticFavorite(exercises)}
        //     onToggle={() => updateFavorite.toggle(exercises)}
        //   />
        // }
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
      <Modal close={close} isOpen={isOpen} title="Редактирование упражнения">
        <ExercisesCreate exercises={exercises} close={close} />
      </Modal>
      <ModalDelete
        close={closeDelete}
        isOpen={isOpenDelete}
        onConfirm={() => deleteExercises(exercises.id)}
      />
    </>
  );
}
