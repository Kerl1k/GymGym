import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { useState } from "react";
import {
  BoardsListLayout,
  BoardsListLayoutHeader,
} from "../boards-list/ui/boards-list-layout";
import { BoardsSidebar } from "../boards-list/ui/boards-sidebar";
import { Button } from "@/shared/ui/kit/button";
import { useCreateBoard } from "../boards-list/model/use-create-board";
import { PlusIcon } from "lucide-react";

const ExercisesPage = () => {
  const createBoard = useCreateBoard();

  return (
    <BoardsListLayout
      sidebar={<BoardsSidebar />}
      header={
        <BoardsListLayoutHeader
          title="упражнения"
          description="Здесь вы можете просматривать и управлять своими досками"
          actions={
            <Button
              disabled={createBoard.isPending}
              onClick={createBoard.createBoard}
            >
              <PlusIcon />
              Создать доску
            </Button>
          }
        />
      }
    >
      {"QWE"}
    </BoardsListLayout>
  );
};

export const Component = ExercisesPage;
