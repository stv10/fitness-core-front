import { WeekStrip } from './WeekStrip';
import type { WeekDay } from './WeekStrip';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  userInitials: string;
  userName: string;
  streakDays: number;
  weekDays: WeekDay[];
  todayDate: string;
  onLogout: () => void;
}

export function DashboardHeader({
  userInitials,
  userName,
  streakDays,
  weekDays,
  todayDate,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <span className={styles.brand}>⚡ Fitness Core</span>

        <div className={styles.rightCluster}>
          <span className={styles.streak}>⚡ {streakDays} DAY STREAK</span>

          <div className={styles.userBadge}>
            <div className={styles.avatar} aria-hidden="true">
              {userInitials}
            </div>
            <span className={styles.userName}>{userName}</span>
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
            aria-label="Log out"
          >
            Log out
          </button>
        </div>
      </div>

      <div className={styles.weekRow}>
        <span className={styles.todayLabel}>{todayDate}</span>
        <WeekStrip days={weekDays} />
      </div>
    </header>
  );
}
