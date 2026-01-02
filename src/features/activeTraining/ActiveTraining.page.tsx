import { Link } from "react-router-dom";

import { useActiveTrainingFetch } from "@/entities/training-active/use-active-training-fetch";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/kit/card";
import { Loader } from "@/shared/ui/kit/loader";

import { ActiveTrainingContent } from "./ui/ActiveTrainingContent";

const ActiveTraining = () => {
  const { data, error, isLoading } = useActiveTrainingFetch();

  // Check if error is 404 (Not Found)
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

  // Loading state with nice loader
  if (!data || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader size="large" />
            <CardTitle>Идет загрузка тренировки</CardTitle>
            <CardDescription>Пожалуйста, подождите...</CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ActiveTrainingContent data={data} />;
};

export const Component = ActiveTraining;
