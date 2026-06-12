import type { MealType } from '../../db/db';
import styles from './MealCard.module.css';

export interface MealCardEntry {
  id: string;
  name: string;
  brand?: string;
  amountG: number;
  kcal: number;
}

interface MealCardProps {
  mealType: MealType;
  title: string;
  entries: MealCardEntry[];
  totalKcal: number;
  onAddFood: (mealType: MealType) => void;
  onDeleteEntry: (id: string) => void;
}

export function MealCard({
  mealType,
  title,
  entries,
  totalKcal,
  onAddFood,
  onDeleteEntry,
}: MealCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.totalKcal}>{totalKcal} kcal</span>
      </div>

      <div className={styles.body}>
        {entries.length === 0 ? (
          <p className={styles.emptyState}>No items logged</p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>
                    {entry.name}
                    {entry.brand && (
                      <span className={styles.itemBrand}> · {entry.brand}</span>
                    )}
                  </span>
                  <span className={styles.itemMeta}>
                    {entry.amountG} g · {entry.kcal} kcal
                  </span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label={`Remove ${entry.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.addFoodBtn}
          onClick={() => onAddFood(mealType)}
        >
          ADD FOOD
        </button>
      </div>
    </div>
  );
}
