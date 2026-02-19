import { Link, useNavigate } from "react-router-dom";

import { useUpdateActiveTraining } from "@/entities/training-active/use-active-training-change";
import { useActiveTrainingFetch } from "@/entities/training-active/use-active-training-fetch";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";
import { Button } from "@/shared/ui/kit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";

import { TrainingChanges } from "../trainingChanges/training-start.page";

const TrainingStartPage = () => {
  const { data, error, isLoading } = useActiveTrainingFetch();

  const { change } = useUpdateActiveTraining();

  const navigate = useNavigate();

  const onSave = (data: ApiSchemas["ActiveTraining"]) => {
    change(data);

    navigate(ROUTES.ACTIVE_TRAINING);
  };

  if (error === "NotFound") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Тренировка не начата</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-center">
              Активная тренировка не найдена. Пожалуйста, начните новую
              тренировку.
            </CardDescription>
            <div className="flex justify-center">
              <Link to={ROUTES.TRAINING} className="w-full">
                <Button className="w-full">Перейти к тренировкам</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {isLoading ? "Лоадинг" : "Какая-то ошибка, я сам хз"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <TrainingChanges data={data} onSave={onSave} />;
};

export const Component = TrainingStartPage;
