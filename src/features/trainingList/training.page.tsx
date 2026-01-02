import { PlusIcon, StarIcon } from "lucide-react";

import { useOpen } from "@/shared/lib/useOpen";
import { Button } from "@/shared/ui/kit/button";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";

import { useTrainingList } from "../../entities/training/use-training-fetch";

import { TrainingCreate } from "./ui/training-create/training-create";
import { TrainingFilter } from "./ui/training-filter";
import { TrainingItem } from "./ui/training-item";
import {
  ExercisesListLayout,
  ExercisesListLayoutContent,
  ExercisesListLayoutHeader,
} from "./ui/training-list-layout";

const TrainingPage = () => {
  const { close, isOpen, open } = useOpen();

  const trainingsQuery = useTrainingList({});

  return (
    <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
      <ExercisesListLayout
        filters={
          <TrainingFilter
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
