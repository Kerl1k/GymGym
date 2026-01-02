import { PlusIcon } from "lucide-react";

import { useExercisesFetchList } from "@/entities/exercises/use-exercises-fetch-list";
import { useOpen } from "@/shared/lib/useOpen";
import { Button } from "@/shared/ui/kit/button";
import { Modal } from "@/shared/ui/kit/modalWindow/modal";

import {
  ExercisesListLayout,
  ExercisesListLayoutContent,
  ExercisesListLayoutHeader,
} from "./ui/exercises-list-layout";
import { ExercisesCreate } from "./ui/exercisesCreate";
import { ExerciseItem } from "./ui/Item";


const ExercisesPage = () => {
  const { close, isOpen, open } = useOpen();

  const exercisesQuery = useExercisesFetchList({});

  return (
    <div className="container mx-auto p-4 sm:p-6 animate-fade-in">
      <ExercisesListLayout
        header={
          <ExercisesListLayoutHeader
            title="Упражнения"
            description="Здесь вы можете просматривать и управлять своими упражнениями"
            actions={
              <Button onClick={open} className="hover-lift">
                <PlusIcon className="w-4 h-4 mr-2" />
                Создать упражнение
              </Button>
            }
          />
        }
      >
        <ExercisesListLayoutContent
          isEmpty={exercisesQuery.exercises.length === 0}
          isPending={exercisesQuery.isPending}
          renderList={() =>
            exercisesQuery.exercises.map((exercises) => (
              <ExerciseItem key={exercises.id} exercises={exercises} />
            ))
          }
        />
        <Modal close={close} isOpen={isOpen} title="Создание упражнения">
          <ExercisesCreate close={close} />
        </Modal>
      </ExercisesListLayout>
    </div>
  );
};

export const Component = ExercisesPage;
