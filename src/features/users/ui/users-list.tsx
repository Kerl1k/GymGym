import { Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useUsersList } from "@/entities/user/use-users-list";
import { ROUTES } from "@/shared/model/routes";
import { Loader } from "@/shared/ui/kit/loader";

import styles from "./users.module.scss";

export function UsersList() {
  const { users, isPending } = useUsersList();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Users size={24} />
          Пользователи
        </h1>
      </div>

      {isPending && (
        <div className={styles.loading}>
          <Loader />
        </div>
      )}

      {!isPending && users.length === 0 && (
        <div className={styles.emptyState}>
          <Users size={48} />
          <p>Пользователи не найдены</p>
        </div>
      )}

      {!isPending && users.length > 0 && (
        <ul className={styles.list}>
          {users.map((user) => (
            <li key={user.id}>
              <Link
                to={ROUTES.USER.replace(":id", user.id)}
                className={styles.listItem}
              >
                <span className={styles.email}>{user.email}</span>
                <span className={styles.chevron}>→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
