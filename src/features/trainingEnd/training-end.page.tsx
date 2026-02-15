import { useNavigate, useParams } from "react-router-dom";

import { useChangeTrainingHistory } from "@/entities/training-history/use-training-history-change";
import { useTrainingHistoryFetchId } from "@/entities/training-history/use-training-history-fetch-id";
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
  const { id } = useParams<{ id: string }>();
  const { data: history } = useTrainingHistoryFetchId(id || "");

  const { change } = useChangeTrainingHistory();

  const navigate = useNavigate();

  const onSave = (data: ApiSchemas["ActiveTraining"]) => {
    if (history) {
      const trainingHistoryUpdate =
        convertActiveTrainingToTrainingHistoryUpdate(data, history.id);
      change(trainingHistoryUpdate);
    }

    navigate(ROUTES.HOME);
  };

  const activeTrainingData = history
    ? convertTrainingHistoryToActiveTraining(history)
    : null;

  if (!activeTrainingData) {
    return <div>Тренировка не найдена</div>;
  }

  return <TrainingChanges data={activeTrainingData} onSave={onSave} />;
};

export const Component = TrainingEndPage;
