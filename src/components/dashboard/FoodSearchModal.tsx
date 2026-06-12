import React from 'react';
import type { MealType, FoodItemDoc } from '../../db/db';
import styles from './FoodSearchModal.module.css';

export interface CustomFoodFields {
  name: string;
  brand: string;
  cal: string;
  prot: string;
  carb: string;
  fat: string;
}

interface FoodSearchModalProps {
  isOpen: boolean;
  mealType: MealType;
  // Search state
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSearching: boolean;
  searchResults: FoodItemDoc[];
  // Selection state
  selectedFood: FoodItemDoc | null;
  onSelectFood: (food: FoodItemDoc | null) => void;
  // Logging state
  logAmount: string;
  onLogAmountChange: (v: string) => void;
  onLogMeal: (e: React.FormEvent) => void;
  // Custom food state
  isCreatingCustom: boolean;
  onToggleCustom: () => void;
  customFields: CustomFoodFields;
  onCustomFieldChange: (field: keyof CustomFoodFields, value: string) => void;
  onCreateCustom: (e: React.FormEvent) => void;
  // Modal controls
  onClose: () => void;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

export function FoodSearchModal({
  isOpen,
  mealType,
  searchQuery,
  onSearchChange,
  isSearching,
  searchResults,
  selectedFood,
  onSelectFood,
  logAmount,
  onLogAmountChange,
  onLogMeal,
  isCreatingCustom,
  onToggleCustom,
  customFields,
  onCustomFieldChange,
  onCreateCustom,
  onClose,
}: FoodSearchModalProps) {
  if (!isOpen) return null;

  const handleLogMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogMeal(e);
  };

  const handleCreateCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCustom(e);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Food search">
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span className={styles.mealLabel}>{MEAL_TYPE_LABELS[mealType]}</span>
            <span className={styles.headerSub}>Add Food</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {!selectedFood ? (
            <>
              {/* Search row */}
              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="Search food or enter barcode..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.toggleCustomBtn}
                  onClick={onToggleCustom}
                >
                  {isCreatingCustom ? 'Back' : 'New'}
                </button>
              </div>

              {/* Search results */}
              {!isCreatingCustom && searchQuery.trim().length >= 2 && (
                <div className={styles.resultsContainer}>
                  {isSearching && (
                    <div className={styles.statusText}>Searching...</div>
                  )}
                  {!isSearching && searchResults.length === 0 && (
                    <div className={styles.statusText}>No results found.</div>
                  )}
                  {!isSearching &&
                    searchResults.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        className={styles.resultRow}
                        onClick={() => onSelectFood(food)}
                      >
                        <div className={styles.resultInfo}>
                          <span className={styles.resultName}>{food.name}</span>
                          <span className={styles.resultMeta}>
                            {food.brand && (
                              <span className={styles.resultBrand}>{food.brand} · </span>
                            )}
                            <span
                              className={`${styles.sourceBadge} ${
                                food.source === 'OPEN_FOOD_FACTS'
                                  ? styles.badgeOff
                                  : styles.badgePersonal
                              }`}
                            >
                              {food.source === 'OPEN_FOOD_FACTS' ? 'OFF' : 'Personal'}
                            </span>
                          </span>
                          <span className={styles.resultNutriments}>
                            {food.calories_per_100g} kcal | P: {food.protein_per_100g}g | C:{' '}
                            {food.carbs_per_100g}g | F: {food.fat_per_100g}g
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Custom food form */}
              {isCreatingCustom && (
                <form className={styles.customForm} onSubmit={handleCreateCustomSubmit}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="cf-name">
                      Food Name
                    </label>
                    <input
                      id="cf-name"
                      className={styles.fieldInput}
                      type="text"
                      placeholder="e.g. Instant Oats"
                      value={customFields.name}
                      onChange={(e) => onCustomFieldChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="cf-brand">
                      Brand (optional)
                    </label>
                    <input
                      id="cf-brand"
                      className={styles.fieldInput}
                      type="text"
                      placeholder="e.g. Quaker"
                      value={customFields.brand}
                      onChange={(e) => onCustomFieldChange('brand', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGrid}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="cf-cal">
                        Kcal / 100g
                      </label>
                      <input
                        id="cf-cal"
                        className={styles.fieldInput}
                        type="number"
                        placeholder="350"
                        value={customFields.cal}
                        onChange={(e) => onCustomFieldChange('cal', e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="cf-prot">
                        Protein (g)
                      </label>
                      <input
                        id="cf-prot"
                        className={styles.fieldInput}
                        type="number"
                        step="0.1"
                        placeholder="12"
                        value={customFields.prot}
                        onChange={(e) => onCustomFieldChange('prot', e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="cf-carb">
                        Carbs (g)
                      </label>
                      <input
                        id="cf-carb"
                        className={styles.fieldInput}
                        type="number"
                        step="0.1"
                        placeholder="60"
                        value={customFields.carb}
                        onChange={(e) => onCustomFieldChange('carb', e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="cf-fat">
                        Fat (g)
                      </label>
                      <input
                        id="cf-fat"
                        className={styles.fieldInput}
                        type="number"
                        step="0.1"
                        placeholder="6"
                        value={customFields.fat}
                        onChange={(e) => onCustomFieldChange('fat', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className={styles.primaryBtn}>
                    Create &amp; Select
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Logging form */
            <form className={styles.logForm} onSubmit={handleLogMealSubmit}>
              <div className={styles.selectedFoodHeader}>
                <span className={styles.selectedFoodName}>{selectedFood.name}</span>
                {selectedFood.brand && (
                  <span className={styles.selectedFoodBrand}>{selectedFood.brand}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="log-amount">
                  Amount (grams)
                </label>
                <input
                  id="log-amount"
                  className={styles.fieldInput}
                  type="number"
                  min="1"
                  value={logAmount}
                  onChange={(e) => onLogAmountChange(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="log-meal-type">
                  Meal
                </label>
                <div className={styles.mealTypeDisplay} id="log-meal-type">
                  {MEAL_TYPE_LABELS[mealType]}
                </div>
              </div>

              <div className={styles.logActions}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => onSelectFood(null)}
                >
                  Back
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  Log Portion
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
