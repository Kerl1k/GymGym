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

const TrainingPage = () => {
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
    <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
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
                placeholder="Поиск тренировок..."
              />
            }
            actions={
              <div className="flex gap-2">
                <StarIcon className="w-5 h-5 text-yellow-500" />
              </div>
            }
          />
        }
        header={
          <ExercisesListLayoutHeader
            title="Мои тренировки"
            description="Создавайте и управляйте своими тренировочными программами"
            actions={
              <Button onClick={open} className="hover-lift">
                <PlusIcon className="w-4 h-4 mr-2" />
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
        <Modal close={close} isOpen={isOpen} title="Создание тренировки">
          <TrainingCreate close={close} />
        </Modal>
      </ExercisesListLayout>
    </div>
  );
};

export const Component = TrainingPage;
