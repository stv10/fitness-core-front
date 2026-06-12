import { CalorieRing } from './CalorieRing';
import styles from './CalorieHero.module.css';

interface CalorieHeroProps {
  consumed: number;
  target: number;
}

export function CalorieHero({ consumed, target }: CalorieHeroProps) {
  const percent = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;

  return (
    <div className={styles.hero}>
      <div className={styles.ringWrapper}>
        <CalorieRing percent={percent} />
        <div className={styles.overlay}>
          <span className={styles.consumed}>{consumed.toLocaleString()}</span>
          <span className={styles.target}>/ {target.toLocaleString()} kcal</span>
          <span className={styles.label}>CONSUMED</span>
        </div>
      </div>
    </div>
  );
}
