import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { rqClient } from "@/entities/instance";
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
import { TrainingHistoryList } from "./components/TrainingHistoryList";
import { ActiveTrainingContent } from "./ui/ActiveTrainingContent";

const ActiveTraining = () => {
  const queryClient = useQueryClient();
  const {
    data,
    hasData,
    error,
    isLoading,
    isError,
    fetchStatus,
    isRestoring,
  } = useActiveTrainingFetch();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTrainingRepeated = async () => {
    setRefreshKey((prev) => prev + 1);
    await queryClient.invalidateQueries(
      rqClient.queryOptions("get", "/api/active-training"),
    );
  };

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
            <TrainingHistoryList
              key={refreshKey}
              onTrainingRepeated={handleTrainingRepeated}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRestoring) {
    return (
      <div className={styles.container}>
        <Card className="p-8">
          <CardContent className={styles.loaderContainer}>
            <Loader size="large" />
            <CardTitle className={styles.loadingTitle}>
              Восстановление локальных данных…
            </CardTitle>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasData) {
    if (isLoading || fetchStatus === "fetching") {
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

    if (isError || error) {
      return (
        <div className={styles.container}>
          <Card className={styles.card}>
            <CardHeader>
              <CardTitle className={styles.loadingTitle}>
                Не удалось загрузить активную тренировку
              </CardTitle>
            </CardHeader>
            <CardContent className={styles.cardContent}>
              <CardDescription className={styles.cardDescription}>
                Нет сохранённых данных в этом браузере. Подключитесь к сети или
                откройте эту страницу онлайн хотя бы один раз, чтобы данные
                сохранились локально.
              </CardDescription>
              <div className={styles.buttonContainer}>
                <Link to={ROUTES.TRAINING} className={styles.button}>
                  <Button className={styles.button}>К тренировкам</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (!data) {
    return null;
  }

  return <ActiveTrainingContent data={data} />;
};

export const Component = ActiveTraining;
