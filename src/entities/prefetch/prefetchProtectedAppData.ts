import { authStore } from "@/entities/auth/auth.store";
import { exercisesStore } from "@/entities/exercises/exercises.store";
import { trainingStore } from "@/entities/training/training.store";
import { activeTrainingStore } from "@/entities/training-active/active-training.store";
import { trainingHistoryStore } from "@/entities/training-history/training-history.store";


/** Как в `useTrainingList` без аргументов */
function trainingListDefaultInit() {
  const orderBy = undefined;
  const filterBy = undefined;
  return {
    params: {
      query: {
        page: 1,
        limit: 20,
        filter: JSON.stringify(filterBy),
        orderBy: JSON.stringify(orderBy),
      },
    },
  };
}

/** Как в `useFetchActiveHistory({})` */
function trainingHistoryDefaultInit() {
  const limit = 10;
  const page = undefined;
  const orderBy = undefined;
  return {
    params: {
      query: {
        limit,
        page,
        orderBy: JSON.stringify(orderBy),
        where: undefined,
      },
    },
  };
}

export async function prefetchProtectedAppData(): Promise<void> {
  const trainingQuery = trainingListDefaultInit().params.query;
  const historyQuery = trainingHistoryDefaultInit().params.query;

  await Promise.allSettled([
    authStore.fetchProfile(),
    activeTrainingStore.fetch(),
    trainingStore.fetchList(trainingQuery),
    exercisesStore.fetchList(20),
    trainingHistoryStore.fetchList(historyQuery),
  ]);
}
