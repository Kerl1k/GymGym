import { ApiSchemas } from "@/shared/api/schema";
import { DropdownMenuItem } from "@/shared/ui/kit/dropdown-menu";
import { useDeleteBoard } from "../model/use-delete-board";
// import { useUpdateFavorite } from "../model/use-update-favorite";
import { ExercisessListItem } from "../ui/boards-list-item";
// import { ExercisesFavoriteToggle } from "../ui/boards-favorite-toggle";

export function BoardItem({ training }: { training: ApiSchemas["Training"] }) {
  const deleteBoard = useDeleteBoard();
  // const updateFavorite = useUpdateFavorite();

  return (
    <ExercisessListItem
      training={training}
      // rightActions={
      //   <ExercisesFavoriteToggle
      //     isFavorite={updateFavorite.isOptimisticFavorite(training)}
      //     onToggle={() => updateFavorite.toggle(training)}
      //   />
      // }
      menuActions={
        <DropdownMenuItem
          variant="destructive"
          disabled={deleteBoard.getIsPending(training.id)}
          onClick={() => deleteBoard.deleteBoard(training.id)}
        >
          Удалить
        </DropdownMenuItem>
      }
    />
  );
}
