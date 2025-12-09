import { Button } from "@/shared/ui/kit/button";
import { PlusIcon } from "lucide-react";
import { useOpen } from "@/shared/lib/useOpen";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { TrainingCreate } from "./ui/training-create/training-create";
import {
  ExercisesListLayout,
  ExercisesListLayoutContent,
  ExercisesListLayoutHeader,
} from "./ui/exercises-list-layout";
import { SideBar } from "../../shared/ui/kit/sidebar";
import { TrainingItem } from "./compose/training-item";
import { useBoardsFilters } from "./model/use-boards-filters";
import { useTrainingList } from "./model/use-boards-list";
import { useDebouncedValue } from "@/shared/lib/react";

const ExercisesPage = () => {
  const { close, isOpen, open } = useOpen();

  const boardsFilters = useBoardsFilters();
  const trainingsQuery = useTrainingList({
    sort: boardsFilters.sort,
    search: useDebouncedValue(boardsFilters.search, 300),
  });
  console.log(trainingsQuery);
  return (
    <ExercisesListLayout
      sidebar={<SideBar />}
      header={
        <ExercisesListLayoutHeader
          title="Тренировки"
          description="Здесь можно создавать и выбирать тренировки"
          actions={
            <Button onClick={open}>
              <PlusIcon />
              Создать тренировку
            </Button>
          }
        />
      }
    >
      <ExercisesListLayoutContent
        isEmpty={trainingsQuery.trainings.length === 0}
        isPending={trainingsQuery.isPending}
        isPendingNext={trainingsQuery.isFetchingNextPage}
        cursorRef={trainingsQuery.cursorRef}
        hasCursor={trainingsQuery.hasNextPage}
        renderList={() =>
          trainingsQuery.trainings.map((training) => (
            <TrainingItem key={training.id} training={training} />
          ))
        }
      />
      <Modal close={close} isOpen={isOpen} title="Создание упражнения">
        <TrainingCreate close={close} />
      </Modal>
    </ExercisesListLayout>
  );
};

export const Component = ExercisesPage;
