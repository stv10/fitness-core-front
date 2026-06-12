import styles from './HydrationTracker.module.css';

interface HydrationTrackerProps {
  waterMl: number;
  targetMl?: number;
  onAdjust: (deltaMl: number) => void;
}

export function HydrationTracker({
  waterMl,
  targetMl = 3000,
  onAdjust,
}: HydrationTrackerProps) {
  const fillPercent = Math.min(100, Math.max(0, (waterMl / targetMl) * 100));
  const canAdd = waterMl < targetMl;
  const canRemove = waterMl > 0;

  return (
    <div className={styles.container}>
      <div className={styles.display}>
        <span className={styles.current}>{(waterMl / 1000).toFixed(1)} L</span>
        <span className={styles.target}>/ {(targetMl / 1000).toFixed(1)} L</span>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={fillPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Hydration progress"
      >
        <div
          className={styles.progressFill}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      <div className={styles.controls}>
        <button
          className={styles.btn}
          onClick={() => onAdjust(-250)}
          disabled={!canRemove}
          aria-label="Remove 250ml"
        >
          −
        </button>
        <span className={styles.unit}>250 ml</span>
        <button
          className={styles.btn}
          onClick={() => onAdjust(250)}
          disabled={!canAdd}
          aria-label="Add 250ml"
        >
          +
        </button>
      </div>
    </div>
  );
}
