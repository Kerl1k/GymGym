import type { ReactNode } from "react";

import { User } from "lucide-react";

import styles from "./user-profile.module.scss";

type ProfileHeaderProps = {
  email: string;
  actions?: ReactNode;
};

export function ProfileHeader({ email, actions }: ProfileHeaderProps) {
  return (
    <div className={styles.profileHeader}>
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>
          <User size={40} />
        </div>
        <div className={styles.userInfo}>
          <h1 className={styles.userName}>{email || "—"}</h1>
        </div>
      </div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </div>
  );
}
