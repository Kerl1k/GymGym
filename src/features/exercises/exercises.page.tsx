import { Button } from "@/shared/ui/kit/button";
import { PlusIcon } from "lucide-react";
import { useOpen } from "@/shared/lib/useOpen";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { ExercisesCreate } from "./ui/exercisesCreate";
import {
  ExercisesListLayout,
  ExercisesListLayoutContent,
  ExercisesListLayoutHeader,
} from "./ui/exercises-list-layout";
import { SideBar } from "../../shared/ui/kit/sidebar";
import { BoardItem } from "./compose/board-item";
import { useBoardsFilters } from "./model/use-boards-filters";
import { useExercisesList } from "./model/use-boards-list";
import { useDebouncedValue } from "@/shared/lib/react";

const ExercisesPage = () => {
  const { close, isOpen, open } = useOpen();

  const boardsFilters = useBoardsFilters();
  const exercisesQuery = useExercisesList({
    sort: boardsFilters.sort,
    search: useDebouncedValue(boardsFilters.search, 300),
  });

  return (
    <ExercisesListLayout
      sidebar={<SideBar />}
      header={
        <ExercisesListLayoutHeader
          title="упражнения"
          description="Здесь вы можете просматривать и управлять своими упражнениями"
          actions={
            <Button onClick={open}>
              <PlusIcon />
              Создать упражнение
            </Button>
          }
        />
      }
    >
      <ExercisesListLayoutContent
        isEmpty={exercisesQuery.exercises.length === 0}
        isPending={exercisesQuery.isPending}
        isPendingNext={exercisesQuery.isFetchingNextPage}
        cursorRef={exercisesQuery.cursorRef}
        hasCursor={exercisesQuery.hasNextPage}
        renderList={() =>
          exercisesQuery.exercises.map((exercises) => (
            <BoardItem key={exercises.id} exercises={exercises} />
          ))
        }
      />
      <Modal close={close} isOpen={isOpen} title="Создание упражнения">
        <ExercisesCreate close={close} />
      </Modal>
    </ExercisesListLayout>
  );
};

export const Component = ExercisesPage;
