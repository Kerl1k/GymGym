import { Button } from "@/shared/ui/kit/button";
import { PlusIcon, StarIcon } from "lucide-react";
import { useOpen } from "@/shared/lib/useOpen";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";
import { TrainingCreate } from "./ui/training-create/training-create";
import {
  ExercisesListLayout,
  ExercisesListLayoutContent,
  ExercisesListLayoutHeader,
} from "./ui/training-list-layout";
import { TrainingItem } from "./compose/training-item";
import { useTrainingsFilters } from "../../entities/training/use-training-filters";
import { useTrainingList } from "../../entities/training/use-training-fetch";
import { useDebouncedValue } from "@/shared/lib/react";
import { ExercisesListLayoutFilters } from "./ui/training-filter";
import { TrainingSortSelect } from "../../entities/training/use-training-sort";
import { SearchInput } from "@/shared/ui/kit/search";

const ExercisesPage = () => {
  const { close, isOpen, open } = useOpen();

  const trainingsFilters = useTrainingsFilters();
  const trainingsQuery = useTrainingList({
    sort: trainingsFilters.sort,
    search: useDebouncedValue(trainingsFilters.search, 300),
  });

  const itemsSort = [
    { value: "createdAt", label: "По дате создания" },
    { value: "updatedAt", label: "По дате обновления" },
    { value: "lastOpenedAt", label: "По дате открытия" },
    { value: "name", label: "По имени" },
  ];

  return (
    <ExercisesListLayout
      filters={
        <ExercisesListLayoutFilters
          sort={
            <TrainingSortSelect
              value={trainingsFilters.sort}
              onValueChange={trainingsFilters.setSort}
              items={itemsSort}
            />
          }
          filters={
            <SearchInput
              value={trainingsFilters.search}
              onChange={trainingsFilters.setSearch}
              placeholder="Введите название тренирвоки"
            />
          }
          actions={
            <div className="flex gap-5">
              <StarIcon />
            </div>
          }
        />
      }
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
