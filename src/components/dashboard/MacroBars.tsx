import styles from './MacroBars.module.css';

type MacroLabel = 'Protein' | 'Carbs' | 'Fats';

export interface MacroDatum {
  label: MacroLabel;
  current: number;
  target: number;
  percent: number; // 0..100, clamped
}

interface MacroBarsProps {
  macros: MacroDatum[];
}

const MACRO_COLORS: Record<MacroLabel, string> = {
  Protein: 'var(--accent-primary)',
  Carbs: 'var(--accent-tertiary)',
  Fats: 'var(--accent-secondary)',
};

const MACRO_TRACK_COLORS: Record<MacroLabel, string> = {
  Protein: 'rgba(176, 213, 0, 0.10)',
  Carbs: 'rgba(151, 203, 255, 0.10)',
  Fats: 'rgba(255, 180, 171, 0.10)',
};

export function MacroBars({ macros }: MacroBarsProps) {
  return (
    <div className={styles.container}>
      {macros.map((macro) => {
        const clamped = Math.min(Math.max(macro.percent, 0), 100);
        return (
          <div key={macro.label} className={styles.row}>
            <div className={styles.header}>
              <span className={styles.labelText}>{macro.label}</span>
              <span className={styles.values}>
                {macro.current}g / {macro.target}g
              </span>
            </div>
            <div
              className={styles.track}
              style={{ backgroundColor: MACRO_TRACK_COLORS[macro.label] }}
            >
              <div
                className={styles.fill}
                style={{
                  width: `${clamped}%`,
                  backgroundColor: MACRO_COLORS[macro.label],
                }}
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${macro.label}: ${clamped.toFixed(0)}%`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
