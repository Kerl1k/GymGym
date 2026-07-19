import { Activity, ArrowLeft, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";

import { useUserFetch } from "@/entities/user/use-user-fetch";
import { useUserHistory } from "@/entities/user/use-user-history";
import { ROUTES } from "@/shared/model/routes";
import { Loader } from "@/shared/ui/kit/loader";

import styles from "./users.module.scss";

type UserDetailProps = {
  userId: string;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserDetail({ userId }: UserDetailProps) {
  const { user, isPending: isUserPending } = useUserFetch(userId);
  const { history, isPending: isHistoryPending } = useUserHistory(userId);

  const isPending = isUserPending || isHistoryPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <User size={24} />
          {user?.email ?? "Пользователь"}
        </h1>
        <Link to={ROUTES.USERS} className={styles.backButton}>
          <ArrowLeft size={16} />
          К списку
        </Link>
      </div>

      {isPending && (
        <div className={styles.loading}>
          <Loader />
        </div>
      )}

      {!isPending && !user && (
        <div className={styles.emptyState}>
          <User size={48} />
          <p>Пользователь не найден</p>
          <Link to={ROUTES.USERS} className={styles.backButton}>
            Вернуться к списку
          </Link>
        </div>
      )}

      {!isPending && user && (
        <>
          <div className={styles.userInfo}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>

          <h2 className={styles.sectionTitle}>
            <Calendar size={20} />
            История тренировок
          </h2>

          {history.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={48} />
              <p>У пользователя пока нет завершённых тренировок</p>
            </div>
          ) : (
            <ul className={styles.historyList}>
              {history.map((training) => (
                <li key={training.id}>
                  <Link
                    to={ROUTES.END.replace(":id", training.id)}
                    className={styles.historyItem}
                  >
                    <div className={styles.historyHeader}>
                      <span className={styles.historyName}>{training.name}</span>
                      <span className={styles.historyDate}>
                        {formatDate(training.dateStart)}
                      </span>
                    </div>
                    {training.description && (
                      <p className={styles.historyDescription}>
                        {training.description}
                      </p>
                    )}
                    <span className={styles.historyMeta}>
                      {training.exercises.length} упражнений
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
