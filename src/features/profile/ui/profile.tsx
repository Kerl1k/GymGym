import { useFetchProfile } from "@/entities/auth/use-profile-fetch";
import { useFetchActiveHistory } from "@/entities/training-history/use-active-training-history-fetch";
import { useActiveTrainingDelete } from "@/entities/training-history/use-training-history-delete";
import { UserProfileView } from "@/shared/ui/user-profile";

export const Profile = () => {
  const { profile } = useFetchProfile();
  const { history: trainingHistory } = useFetchActiveHistory({
    sort: "dateStart",
  });
  const { history: allTrainingHistory } = useFetchActiveHistory({
    sort: "dateStart",
    limit: 500,
  });

  const { deleteExercises, getIsPending: isDeletePendingById } =
    useActiveTrainingDelete();

  return (
    <UserProfileView
      email={profile?.email ?? "—"}
      history={allTrainingHistory}
      recentHistory={trainingHistory}
      showViewAllHistory
      onDeleteTraining={deleteExercises}
      isDeletePending={isDeletePendingById}
    />
  );
};
