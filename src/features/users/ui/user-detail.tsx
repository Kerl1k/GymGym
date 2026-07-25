import { ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";

import { useUserFetch } from "@/entities/user/use-user-fetch";
import { useUserHistory } from "@/entities/user/use-user-history";
import { ROUTES } from "@/shared/model/routes";
import { Loader } from "@/shared/ui/kit/loader";
import { UserProfileView } from "@/shared/ui/user-profile";

import styles from "./users.module.scss";

type UserDetailProps = {
  userId: string;
};

export function UserDetail({ userId }: UserDetailProps) {
  const { user, isPending: isUserPending } = useUserFetch(userId);
  const { history, isPending: isHistoryPending } = useUserHistory(userId);

  const isPending = isUserPending || isHistoryPending;

  if (isPending) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Loader />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <User size={48} />
          <p>Пользователь не найден</p>
          <Link to={ROUTES.USERS} className={styles.backButton}>
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <UserProfileView
      email={user.email}
      history={history}
      headerActions={
        <Link to={ROUTES.USERS} className={styles.backButton}>
          <ArrowLeft size={16} />
          К списку
        </Link>
      }
    />
  );
}
