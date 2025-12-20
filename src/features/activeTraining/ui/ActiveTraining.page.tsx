import { useTrainingFetch } from "@/entities/training-active/use-training-active";
import { ActiveTrainingContent } from "./ActiveTrainingContent";

const ActiveTraining = () => {
  const { data } = useTrainingFetch();

  if (data === null) {
    return <>Идет загрузка тренировки</>;
  }

  return <ActiveTrainingContent data={data} />;
};

export const Component = ActiveTraining;
