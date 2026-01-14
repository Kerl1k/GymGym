import { useNavigate } from "react-router-dom";

import { useFetchActiveHistrory } from "@/entities/training-history/use-active-training-history-fetch";
import { useChangeTrainingHistory } from "@/entities/training-history/use-training-history-change";
import { ROUTES } from "@/shared/model/routes";
import { ApiSchemas } from "@/shared/schema";

import { TrainingChanges } from "../trainingChanges/training-start.page";

const convertTrainingHistoryToActiveTraining = (
  history: ApiSchemas["TrainingHistory"],
): ApiSchemas["ActiveTraining"] => {
  return {
    dateStart: history.dateStart,
    name: history.name,
    description: history.description,
    exercises: history.exercises.map((exercise) => ({
      id: "",
      name: exercise.name,
      description: exercise.description,
      restTime: exercise.restTime,
      sets: exercise.sets,
      muscleGroups: exercise.muscleGroups,
      useCustomSets: exercise.useCustomSets,
    })),
  };
};

const convertActiveTrainingToTrainingHistoryUpdate = (
  activeTraining: ApiSchemas["ActiveTraining"],
  historyId: string,
): ApiSchemas["TrainingHistoryUpdate"] => {
  return {
    id: historyId,
    dateStart: activeTraining.dateStart,
    name: activeTraining.name,
    description: activeTraining.description,
    exercises: activeTraining.exercises.map((exercise) => ({
      name: exercise.name,
      description: exercise.description,
      restTime: exercise.restTime,
      sets: exercise.sets,
      muscleGroups: exercise.muscleGroups,
      useCustomSets: exercise.useCustomSets,
    })),
  };
};

const TrainingEndPage = () => {
  const { history } = useFetchActiveHistrory({ limit: 1 });

  const { change } = useChangeTrainingHistory();

  const navigate = useNavigate();

  const onSave = (data: ApiSchemas["ActiveTraining"]) => {
    if (history[0]) {
      const trainingHistoryUpdate =
        convertActiveTrainingToTrainingHistoryUpdate(data, history[0].id);
      change(trainingHistoryUpdate);
    }

    navigate(ROUTES.HOME);
  };

  const activeTrainingData = history[0]
    ? convertTrainingHistoryToActiveTraining(history[0])
    : null;

  if (!activeTrainingData) {
    return <div>Тренировка не найдена</div>;
  }

  return <TrainingChanges data={activeTrainingData} onSave={onSave} />;
};

export const Component = TrainingEndPage;
