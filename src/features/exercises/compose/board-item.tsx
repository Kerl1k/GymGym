import { ApiSchemas } from "@/shared/schema";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { useDeleteBoard } from "../model/use-delete-board";
import { useUpdateFavorite } from "../model/use-update-favorite";
import { ExercisesListItem } from "../ui/exercoses-list-item/exercoses-list-item";
import { ExercisesFavoriteToggle } from "../../../shared/ui/kit/favorite-toggle";

export function BoardItem({
  exercises,
}: {
  exercises: ApiSchemas["Exercise"];
}) {
  const deleteBoard = useDeleteBoard();
  const updateFavorite = useUpdateFavorite();

  return (
    <ExercisesListItem
      key={exercises.id}
      exercise={exercises}
      rightActions={
        <ExercisesFavoriteToggle
          isFavorite={updateFavorite.isOptimisticFavorite(exercises)}
          onToggle={() => updateFavorite.toggle(exercises)}
        />
      }
      menuActions={
        <DropdownMenuItem
          variant="destructive"
          disabled={deleteBoard.getIsPending(exercises.id)}
          onClick={() => deleteBoard.deleteBoard(exercises.id)}
        >
          Удалить
        </DropdownMenuItem>
      }
    />
  );
}
