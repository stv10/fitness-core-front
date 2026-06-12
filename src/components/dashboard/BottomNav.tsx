import styles from './BottomNav.module.css';

export type DashboardTab = 'home' | 'meals' | 'add' | 'ai' | 'settings';

interface BottomNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onAddPress: () => void;
}

const NAV_ITEMS: { tab: DashboardTab; label: string; icon: string }[] = [
  { tab: 'home', label: 'Home', icon: '⌂' },
  { tab: 'meals', label: 'Meals', icon: '🍴' },
  { tab: 'add', label: 'Add', icon: '+' },
  { tab: 'ai', label: 'AI', icon: '✦' },
  { tab: 'settings', label: 'Settings', icon: '⚙' },
];

export function BottomNav({ activeTab, onTabChange, onAddPress }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Bottom navigation">
      {NAV_ITEMS.map(({ tab, label, icon }) => {
        const isAdd = tab === 'add';
        const isActive = activeTab === tab;

        if (isAdd) {
          return (
            <button
              key={tab}
              type="button"
              className={styles.fab}
              onClick={onAddPress}
              aria-label="Add entry"
            >
              <span className={styles.fabIcon}>{icon}</span>
            </button>
          );
        }

        return (
          <button
            key={tab}
            type="button"
            role="button"
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.itemLabel}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
