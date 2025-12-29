import { useActiveTrainingFetch } from "@/entities/training-active/use-active-training-fetch";
import { ActiveTrainingContent } from "./ui/ActiveTrainingContent";

const ActiveTraining = () => {
  const { data } = useActiveTrainingFetch();

  if (data === null) {
    return <>Идет загрузка тренировки</>;
  }

  return <ActiveTrainingContent data={data} />;
};

export const Component = ActiveTraining;
