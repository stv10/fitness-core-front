import styles from './CalorieRing.module.css';

interface CalorieRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function CalorieRing({ percent, size = 220, strokeWidth = 16 }: CalorieRingProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const clamped = clamp(percent, 0, 100);
  const dashoffset = C * (1 - clamped / 100);
  const filterId = 'calorie-ring-glow';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Calorie progress: ${clamped.toFixed(0)}%`}
      className={styles.ring}
    >
      <title>Calorie progress: {clamped.toFixed(0)}%</title>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {/* Track circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dashoffset}
          filter={`url(#${filterId})`}
          className={styles.progress}
        />
      </g>
    </svg>
  );
}
