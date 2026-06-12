import styles from './AiInsight.module.css';

interface AiInsightProps {
  message: string;
}

export function AiInsight({ message }: AiInsightProps) {
  return (
    <div className={styles.card}>
      <div className={styles.tint} />
      <div className={styles.content}>
        <span className={styles.providerLabel}>Fitness Core AI</span>
        <p className={styles.message}>
          <span className={styles.sparkle} aria-hidden="true">✦</span>
          {message}
        </p>
      </div>
    </div>
  );
}
