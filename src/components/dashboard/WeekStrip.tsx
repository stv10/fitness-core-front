import styles from './WeekStrip.module.css';

export interface WeekDay {
  label: string;    // "MON", "TUE", etc.
  date: string;     // YYYY-MM-DD
  dayNum: string;   // "12", "13", etc.
  isToday: boolean;
}

interface WeekStripProps {
  days: WeekDay[];
}

export function WeekStrip({ days }: WeekStripProps) {
  return (
    <div className={styles.strip}>
      {days.map((day) => (
        <div
          key={day.date}
          className={`${styles.chip} ${day.isToday ? styles.today : styles.other}`}
          aria-current={day.isToday ? 'date' : undefined}
          aria-label={`${day.label} ${day.dayNum}${day.isToday ? ', today' : ''}`}
        >
          <span className={styles.dayLabel}>{day.label}</span>
          <span className={styles.dayNum}>{day.dayNum}</span>
        </div>
      ))}
    </div>
  );
}
