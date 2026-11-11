import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { activeTrainingStore } from "@/entities/training-active/active-training.store";
import { useActiveTrainingFetch } from "@/entities/training-active/use-active-training-fetch";
import { useMobxSelector } from "@/shared/lib/useMobxSelector";
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
  const {
    data,
    hasData,
    error,
    isLoading,
    isError,
    fetchStatus,
  } = useActiveTrainingFetch();
  const isEnding = useMobxSelector(() => activeTrainingStore.isEnding);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const navigate = useNavigate();

  const handleTrainingRepeated = async () => {
    setRefreshKey((prev) => prev + 1);
    await activeTrainingStore.fetch(true);
  };

  const retryFinish = async () => {
    setFinishError(false);
    setIsFinishing(true);
    try {
      const historyId = await activeTrainingStore.end();
      navigate(ROUTES.END.replace(":id", historyId));
    } catch (error) {
      console.error("Не удалось завершить тренировку", error);
      setIsFinishing(false);
      setFinishError(true);
    }
  };

  if (finishError) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle className={styles.loadingTitle}>
              Не удалось завершить тренировку
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            <CardDescription className={styles.cardDescription}>
              Завершение не выполнилось. Повторите попытку. Если ошибка
              повторяется, проверьте соединение.
            </CardDescription>
            <div className={styles.buttonContainer}>
              <Button
                className={styles.button}
                onClick={() => {
                  void retryFinish();
                }}
              >
                Повторить
              </Button>
            </div>
            <div className={styles.buttonContainer}>
              <Link to={ROUTES.TRAINING} className={styles.button}>
                <Button className={styles.button} variant="secondary">
                  К тренировкам
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinishing || isEnding) {
    return (
      <div className={styles.container}>
        <Card className="p-8">
          <CardContent className={styles.loaderContainer}>
            <Loader size="large" />
            <CardTitle className={styles.loadingTitle}>
              Идет завершение тренировки
            </CardTitle>
            <CardDescription className={styles.loadingDescription}>
              Пожалуйста, подождите...
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                Не удалось получить данные тренировки. Проверьте соединение и
                попробуйте снова.
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
    return (
      <div className={styles.container}>
        <Card className="p-8">
          <CardContent className={styles.loaderContainer}>
            <Loader size="large" />
            <CardTitle className={styles.loadingTitle}>
              Обновляем активную тренировку
            </CardTitle>
            <CardDescription className={styles.loadingDescription}>
              Пожалуйста, подождите...
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ActiveTrainingContent
      data={data}
      onFinishStart={() => setIsFinishing(true)}
      onFinishError={() => {
        setIsFinishing(false);
        setFinishError(true);
      }}
    />
  );
};

export const Component = ActiveTraining;
