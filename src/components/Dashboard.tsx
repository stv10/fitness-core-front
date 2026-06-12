import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import type {
  MealType,
  FoodItemDoc,
  MealEntryDoc,
  UserProfileDoc,
  DailyLogDoc
} from '../db/db'
import { searchFoodFromAPI, getFoodByBarcodeFromAPI } from '../services/openFoodFacts'
import styles from './Dashboard.module.css'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { CalorieHero } from './dashboard/CalorieHero'
import { MacroBars } from './dashboard/MacroBars'
import { MealCard } from './dashboard/MealCard'
import { HydrationTracker } from './dashboard/HydrationTracker'
import { AiInsight } from './dashboard/AiInsight'
import { BottomNav } from './dashboard/BottomNav'
import { FoodSearchModal } from './dashboard/FoodSearchModal'
import type { DashboardTab } from './dashboard/BottomNav'

export const Dashboard: React.FC = () => {
  const { user, logout, db } = useAuth()

  // --- Date configuration ---
  const [todayDate] = useState(() => new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD local format
  const logId = `${user?.id || 'anon'}_${todayDate}`

  // --- RxDB Reactive States ---
  const [profile, setProfile] = useState<UserProfileDoc | null>(null)
  const [dailyLog, setDailyLog] = useState<DailyLogDoc | null>(null)
  const [mealEntries, setMealEntries] = useState<MealEntryDoc[]>([])
  const [foodItems, setFoodItems] = useState<Record<string, FoodItemDoc>>({})

  // --- UI Control States ---
  const [isEditingGoals, setIsEditingGoals] = useState(false)
  const [goalCal, setGoalCal] = useState('2000')
  const [goalProt, setGoalProt] = useState('130')
  const [goalCarb, setGoalCarb] = useState('220')
  const [goalFat, setGoalFat] = useState('70')

  // --- Navigation & Modal States ---
  const [activeTab, setActiveTab] = useState<DashboardTab>('home')
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false)
  const [foodSearchMealType, setFoodSearchMealType] = useState<MealType>('BREAKFAST')

  // --- Food Search States ---
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItemDoc[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItemDoc | null>(null)
  const [logAmount, setLogAmount] = useState('100')
  const [logMealType, setLogMealType] = useState<MealType>('BREAKFAST')

  // --- Custom Food States ---
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customBrand, setCustomBrand] = useState('')
  const [customCal, setCustomCal] = useState('')
  const [customProt, setCustomProt] = useState('')
  const [customCarb, setCustomCarb] = useState('')
  const [customFat, setCustomFat] = useState('')

  // --- DB Auto-Initialization Effect ---
  useEffect(() => {
    if (!db || !user) return

    const initializeUserMetrics = async () => {
      // 1. Ensure profile exists
      const userProfile = await db.user_profiles.findOne({ selector: { user_id: user.id } }).exec()
      let activeProfile: UserProfileDoc

      if (!userProfile) {
        activeProfile = {
          user_id: user.id,
          age: 28,
          gender: 'MALE',
          height_cm: 175,
          weight_kg: 70,
          activity_level: 'MODERATE',
          goal_type: 'MAINTAIN',
          target_calories: 2000,
          target_protein: 130,
          target_carbs: 220,
          target_fat: 70,
          updatedAt: new Date().toISOString()
        }
        await db.user_profiles.insert(activeProfile)
      } else {
        activeProfile = userProfile.toJSON() as UserProfileDoc
      }

      // Sync form fields with active goals
      setGoalCal(String(activeProfile.target_calories))
      setGoalProt(String(activeProfile.target_protein))
      setGoalCarb(String(activeProfile.target_carbs))
      setGoalFat(String(activeProfile.target_fat))

      // 2. Ensure today's daily log exists, copying target goals
      const todayLog = await db.daily_logs.findOne({ selector: { id: logId } }).exec()
      if (!todayLog) {
        await db.daily_logs.insert({
          id: logId,
          user_id: user.id,
          date: todayDate,
          target_calories: activeProfile.target_calories,
          target_protein: activeProfile.target_protein,
          target_carbs: activeProfile.target_carbs,
          target_fat: activeProfile.target_fat,
          water_ml: 0,
          updatedAt: new Date().toISOString()
        })
      }
    }

    initializeUserMetrics().catch((err) => console.error('Error initializing user metrics:', err))
  }, [db, user, logId, todayDate])

  // --- DB Subscriptions Effects ---
  useEffect(() => {
    if (!db || !user) return
    const sub = db.user_profiles
      .findOne({ selector: { user_id: user.id } })
      .$
      .subscribe((doc) => {
        if (doc) setProfile(doc.toJSON() as UserProfileDoc)
      })
    return () => sub.unsubscribe()
  }, [db, user])

  useEffect(() => {
    if (!db || !user) return
    const sub = db.daily_logs
      .findOne({ selector: { id: logId } })
      .$
      .subscribe((doc) => {
        if (doc) setDailyLog(doc.toJSON() as DailyLogDoc)
      })
    return () => sub.unsubscribe()
  }, [db, user, logId])

  useEffect(() => {
    if (!db || !user) return
    const sub = db.meal_entries
      .find({ selector: { log_id: logId } })
      .$
      .subscribe((docs) => {
        setMealEntries(docs.map((d) => d.toJSON() as MealEntryDoc))
      })
    return () => sub.unsubscribe()
  }, [db, user, logId])

  useEffect(() => {
    if (!db) return
    const sub = db.food_items
      .find()
      .$
      .subscribe((docs) => {
        const map: Record<string, FoodItemDoc> = {}
        docs.forEach((d) => {
          const item = d.toJSON() as FoodItemDoc
          map[item.id] = item
        })
        setFoodItems(map)
      })
    return () => sub.unsubscribe()
  }, [db])

  // --- Debounced Open Food Facts search ---
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      try {
        // Search country-specific API (parameterized by env, default: Argentina 'ar')
        const apiResults = await searchFoodFromAPI(searchQuery)

        // Find local matches in cached food items
        const localMatches = Object.values(foodItems).filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
        )

        // Deduplicate: If item exists locally, filter out from API search results
        const apiFiltered = apiResults.filter(
          (apiItem) =>
            !apiItem.api_id || !localMatches.some((local) => local.api_id === apiItem.api_id)
        )

        setSearchResults([...localMatches, ...apiFiltered])
      } catch (err) {
        console.error('Failed to execute Open Food Facts search:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const delayDebounce = setTimeout(performSearch, 500)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery, foodItems])

  // --- Dynamic calculations of daily consumption totals ---
  const consumptionTotals = useMemo(() => {
    let cal = 0
    let prot = 0
    let carb = 0
    let fat = 0

    mealEntries.forEach((entry) => {
      const food = foodItems[entry.food_id]
      if (food) {
        const multiplier = entry.amount_g / 100
        cal += food.calories_per_100g * multiplier
        prot += food.protein_per_100g * multiplier
        carb += food.carbs_per_100g * multiplier
        fat += food.fat_per_100g * multiplier
      }
    })

    return {
      calories: Math.round(cal),
      protein: Math.round(prot * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fat: Math.round(fat * 10) / 10
    }
  }, [mealEntries, foodItems])

  // --- Background Cache Refresh (30-day TTL Check) ---
  const checkAndRefreshCache = async (food: FoodItemDoc) => {
    if (food.source !== 'OPEN_FOOD_FACTS' || !food.api_id || !food.fetched_at || !db) return

    const fetchedDate = new Date(food.fetched_at).getTime()
    const diffDays = (Date.now() - fetchedDate) / (1000 * 60 * 60 * 24)

    if (diffDays > 30) {
      console.log(`Cache expired (>${diffDays.toFixed(0)} days) for product "${food.name}". Fetching update...`)
      try {
        const freshProduct = await getFoodByBarcodeFromAPI(food.api_id)
        if (freshProduct) {
          const doc = await db.food_items.findOne({ selector: { id: food.id } }).exec()
          if (doc) {
            await doc.patch({
              name: freshProduct.name,
              brand: freshProduct.brand,
              calories_per_100g: freshProduct.calories_per_100g,
              protein_per_100g: freshProduct.protein_per_100g,
              carbs_per_100g: freshProduct.carbs_per_100g,
              fat_per_100g: freshProduct.fat_per_100g,
              fetched_at: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
        }
      } catch (err) {
        console.warn('Could not refresh Open Food Facts item in background:', err)
      }
    }
  }

  // --- Handlers ---
  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user) return

    const c = parseInt(goalCal) || 2000
    const p = parseInt(goalProt) || 130
    const cb = parseInt(goalCarb) || 220
    const f = parseInt(goalFat) || 70
    const nowStr = new Date().toISOString()

    try {
      // 1. Save in the User Profile
      const profDoc = await db.user_profiles.findOne({ selector: { user_id: user.id } }).exec()
      if (profDoc) {
        await profDoc.patch({
          target_calories: c,
          target_protein: p,
          target_carbs: cb,
          target_fat: f,
          updatedAt: nowStr
        })
      }

      // 2. Make/Update the copy in today's daily log
      const logDoc = await db.daily_logs.findOne({ selector: { id: logId } }).exec()
      if (logDoc) {
        await logDoc.patch({
          target_calories: c,
          target_protein: p,
          target_carbs: cb,
          target_fat: f,
          updatedAt: nowStr
        })
      }

      setIsEditingGoals(false)
    } catch (err) {
      console.error('Failed to update nutrition goals:', err)
    }
  }

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !selectedFood) return

    const weight = parseFloat(logAmount)
    if (isNaN(weight) || weight <= 0) return

    try {
      // Ensure the food is registered in local cache
      const cached = await db.food_items.findOne({ selector: { id: selectedFood.id } }).exec()
      if (!cached) {
        await db.food_items.insert(selectedFood)
      } else {
        // Background cache updates if expired
        await checkAndRefreshCache(selectedFood)
      }

      // Insert meal entry
      const entryId = crypto.randomUUID ? crypto.randomUUID() : `meal_${Date.now()}_${Math.random().toString(36).substring(5)}`
      await db.meal_entries.insert({
        id: entryId,
        log_id: logId,
        food_id: selectedFood.id,
        amount_g: weight,
        meal_type: logMealType,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Reset logger state
      setSelectedFood(null)
      setSearchQuery('')
      setLogAmount('100')
    } catch (err) {
      console.error('Failed to log meal portion:', err)
    }
  }

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const cal = parseFloat(customCal) || 0
    const prot = parseFloat(customProt) || 0
    const carb = parseFloat(customCarb) || 0
    const fat = parseFloat(customFat) || 0

    const customId = crypto.randomUUID ? crypto.randomUUID() : `custom_${Date.now()}_${Math.random().toString(36).substring(5)}`

    const newCustomFood: FoodItemDoc = {
      id: customId,
      name: customName,
      brand: customBrand || 'Personal',
      calories_per_100g: cal,
      protein_per_100g: prot,
      carbs_per_100g: carb,
      fat_per_100g: fat,
      source: 'USER_CREATED',
      updatedAt: new Date().toISOString()
    }

    try {
      await db.food_items.insert(newCustomFood)
      setSelectedFood(newCustomFood)
      setIsCreatingCustom(false)

      // Clear inputs
      setCustomName('')
      setCustomBrand('')
      setCustomCal('')
      setCustomProt('')
      setCustomCarb('')
      setCustomFat('')
    } catch (err) {
      console.error('Failed to create custom food:', err)
    }
  }

  const handleDeleteMealEntry = async (id: string) => {
    if (!db) return
    try {
      const doc = await db.meal_entries.findOne({ selector: { id } }).exec()
      if (doc) {
        await doc.remove()
      }
    } catch (err) {
      console.error('Failed to delete meal entry:', err)
    }
  }

  // --- Water intake (derived from dailyLog) ---
  const waterMl = dailyLog?.water_ml ?? 0

  const handleAdjustWater = async (deltaMl: number) => {
    if (!db || !dailyLog) return
    const next = Math.min(3000, Math.max(0, waterMl + deltaMl))
    try {
      const doc = await db.daily_logs.findOne({ selector: { id: logId } }).exec()
      if (doc) {
        await doc.patch({ water_ml: next, updatedAt: new Date().toISOString() })
      }
    } catch (err) {
      console.error('Failed to update water intake:', err)
    }
  }

  // --- Open food search modal ---
  const openFoodSearch = (mealType: MealType) => {
    setFoodSearchMealType(mealType)
    setLogMealType(mealType)
    setIsFoodSearchOpen(true)
  }

  // --- Week days strip ---
  const weekDays = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Sun
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)) // start of this week (Mon)
    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    return labels.map((label, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toLocaleDateString('en-CA') // YYYY-MM-DD
      return {
        label,
        date: dateStr,
        dayNum: String(d.getDate()),
        isToday: dateStr === todayDate
      }
    })
  }, [todayDate])

  // --- User display ---
  const userInitials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : ''
  const userName = user ? `${user.firstName} ${user.lastName}` : ''

  // --- Targets ---
  const targetCal = dailyLog?.target_calories || profile?.target_calories || 2000
  const targetProt = dailyLog?.target_protein || profile?.target_protein || 130
  const targetCarb = dailyLog?.target_carbs || profile?.target_carbs || 220
  const targetFat = dailyLog?.target_fat || profile?.target_fat || 70

  // --- AI insight message ---
  const aiInsightMessage =
    consumptionTotals.calories === 0
      ? 'Start logging your meals to get personalized insights.'
      : `You have consumed ${consumptionTotals.calories} kcal of your ${targetCal} kcal goal. Keep protein at ${consumptionTotals.protein}g / ${targetProt}g to support muscle recovery.`

  // --- Macros data ---
  const macrosData = [
    { label: 'Protein' as const, current: consumptionTotals.protein, target: targetProt, percent: Math.min(100, (consumptionTotals.protein / targetProt) * 100) },
    { label: 'Carbs' as const, current: consumptionTotals.carbs, target: targetCarb, percent: Math.min(100, (consumptionTotals.carbs / targetCarb) * 100) },
    { label: 'Fats' as const, current: consumptionTotals.fat, target: targetFat, percent: Math.min(100, (consumptionTotals.fat / targetFat) * 100) },
  ]

  // --- Custom food fields object ---
  const customFields = {
    name: customName,
    brand: customBrand,
    cal: customCal,
    prot: customProt,
    carb: customCarb,
    fat: customFat
  }

  const handleCustomFieldChange = (field: keyof typeof customFields, value: string) => {
    const setters = {
      name: setCustomName,
      brand: setCustomBrand,
      cal: setCustomCal,
      prot: setCustomProt,
      carb: setCustomCarb,
      fat: setCustomFat
    }
    setters[field](value)
  }

  // --- Meal card data helpers ---
  const mealCardEntries = (mealType: MealType) =>
    mealEntries
      .filter((e) => e.meal_type === mealType)
      .map((e) => {
        const food = foodItems[e.food_id]
        return {
          id: e.id,
          name: food?.name ?? 'Unknown food',
          brand: food?.brand,
          amountG: e.amount_g,
          kcal: food ? Math.round(food.calories_per_100g * (e.amount_g / 100)) : 0
        }
      })

  const mealTotalKcal = (mealType: MealType) =>
    mealCardEntries(mealType).reduce((sum, e) => sum + e.kcal, 0)

  if (!user) return null

  return (
    <div className={styles.wrapper}>
      <DashboardHeader
        userInitials={userInitials}
        userName={userName}
        streakDays={15}
        weekDays={weekDays}
        todayDate={todayDate}
        onLogout={logout}
      />

      <main className={styles.main}>
        <CalorieHero consumed={consumptionTotals.calories} target={targetCal} />

        <MacroBars macros={macrosData} />

        {/* Goals editor — inline section, no dedicated component */}
        <section className={styles.goalsSection}>
          {!isEditingGoals ? (
            <div className={styles.goalsDisplay}>
              <span className={styles.goalsLabel}>Daily Goals</span>
              <span className={styles.goalsSummary}>
                {targetCal} kcal · P {targetProt}g · C {targetCarb}g · F {targetFat}g
              </span>
              <button
                type="button"
                className={styles.editGoalsBtn}
                onClick={() => setIsEditingGoals(true)}
              >
                Edit Goals
              </button>
            </div>
          ) : (
            <form className={styles.goalsForm} onSubmit={handleSaveGoals}>
              <div className={styles.goalsGrid}>
                <div className={styles.goalsInputGroup}>
                  <label htmlFor="goal-cal">Calories (kcal)</label>
                  <input
                    id="goal-cal"
                    type="number"
                    value={goalCal}
                    onChange={(e) => setGoalCal(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.goalsInputGroup}>
                  <label htmlFor="goal-prot">Protein (g)</label>
                  <input
                    id="goal-prot"
                    type="number"
                    value={goalProt}
                    onChange={(e) => setGoalProt(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.goalsInputGroup}>
                  <label htmlFor="goal-carb">Carbs (g)</label>
                  <input
                    id="goal-carb"
                    type="number"
                    value={goalCarb}
                    onChange={(e) => setGoalCarb(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.goalsInputGroup}>
                  <label htmlFor="goal-fat">Fat (g)</label>
                  <input
                    id="goal-fat"
                    type="number"
                    value={goalFat}
                    onChange={(e) => setGoalFat(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.goalsActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEditingGoals(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save
                </button>
              </div>
            </form>
          )}
        </section>

        <section className={styles.mealGrid}>
          {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((type) => (
            <MealCard
              key={type}
              mealType={type}
              title={type === 'SNACK' ? 'Snacks' : type.charAt(0) + type.slice(1).toLowerCase()}
              entries={mealCardEntries(type)}
              totalKcal={mealTotalKcal(type)}
              onAddFood={openFoodSearch}
              onDeleteEntry={handleDeleteMealEntry}
            />
          ))}
        </section>

        <HydrationTracker waterMl={waterMl} onAdjust={handleAdjustWater} />

        <AiInsight message={aiInsightMessage} />
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPress={() => openFoodSearch('BREAKFAST')}
      />

      <FoodSearchModal
        isOpen={isFoodSearchOpen}
        mealType={foodSearchMealType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={isSearching}
        searchResults={searchResults}
        selectedFood={selectedFood}
        onSelectFood={setSelectedFood}
        logAmount={logAmount}
        onLogAmountChange={setLogAmount}
        onLogMeal={handleLogMeal}
        isCreatingCustom={isCreatingCustom}
        onToggleCustom={() => setIsCreatingCustom(!isCreatingCustom)}
        customFields={customFields}
        onCustomFieldChange={handleCustomFieldChange}
        onCreateCustom={handleCreateCustomFood}
        onClose={() => {
          setIsFoodSearchOpen(false)
          setSelectedFood(null)
          setSearchQuery('')
        }}
      />
    </div>
  )
}
