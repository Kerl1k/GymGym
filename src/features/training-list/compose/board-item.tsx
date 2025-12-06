import { ApiSchemas } from "@/shared/api/schema";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { useDeleteBoard } from "../model/use-delete-board";
import { useUpdateFavorite } from "../model/use-update-favorite";
import { ExercisessListItem } from "../ui/boards-list-item";
import { ExercisesFavoriteToggle } from "../ui/boards-favorite-toggle";

export function BoardItem({
  exercises,
}: {
  exercises: ApiSchemas["Exercise"];
}) {
  const deleteBoard = useDeleteBoard();
  const updateFavorite = useUpdateFavorite();

  return (
    <ExercisessListItem
      key={exercises.id}
      exercises={exercises}
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
