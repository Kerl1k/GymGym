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

import styles from "./ActiveTraining.module.scss";
import { ActiveTrainingContent } from "./ui/ActiveTrainingContent";

const ActiveTraining = () => {
  const { data, error, isLoading } = useActiveTrainingFetch();

  // Check if error is 404 (Not Found)
  if (error === "NotFound") {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.loadingTitle}>
              Тренировка не начата
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <CardDescription className={styles.cardDescription}>
              Активная тренировка не найдена. Пожалуйста, начните новую
              тренировку.
            </CardDescription>
            <div className={styles.buttonContainer}>
              <Link to={ROUTES.TRAINING} className={styles.button}>
                <Button className={styles.button}>Перейти к тренировкам</Button>
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
      <div className={styles.container}>
        <Card className="p-8">
          <CardContent className={styles.loaderContainer}>
            <Loader size="large" />
            <CardTitle className={styles.loadingTitle}>
              Идет загрузка тренировки
            </CardTitle>
            <CardDescription className={styles.loadingDescription}>
              Пожалуйста, подождите...
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ActiveTrainingContent data={data} />;
};

export const Component = ActiveTraining;
