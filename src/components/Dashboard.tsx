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

interface Workout {
  id: number
  type: string
  duration: number
  time: string
}

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

  // --- Workouts Simulation States (kept from original) ---
  const [workouts, setWorkouts] = useState<Workout[]>([
    { id: 1, type: 'Cardio Run', duration: 30, time: '08:30 AM' },
    { id: 2, type: 'Entrenamiento de Fuerza', duration: 45, time: '12:15 PM' }
  ])
  const [workoutType, setWorkoutType] = useState('Cardio')
  const [workoutDuration, setWorkoutDuration] = useState('30')

  // --- DB Auto-Initialization Effect ---
  useEffect(() => {
    if (!db || !user) return

    const initializeUserMetrics = async () => {
      // 1. Ensure profile exists
      let userProfile = await db.user_profiles.findOne({ selector: { user_id: user.id } }).exec()
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

  // --- Workout simulation logger (kept from original) ---
  const addWorkout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!workoutType || !workoutDuration) return

    const newWorkout: Workout = {
      id: Date.now(),
      type: workoutType,
      duration: parseInt(workoutDuration),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setWorkouts([newWorkout, ...workouts])
    setWorkoutType('Cardio')
    setWorkoutDuration('30')
  }

  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + w.duration, 0)

  if (!user) return null

  // Date formatted display
  const joinedDate = user.id ? 'Hoy' : 'Recientemente'

  // Targets from today's daily log (fallbacks to profile or defaults)
  const targetCal = dailyLog?.target_calories || profile?.target_calories || 2000
  const targetProt = dailyLog?.target_protein || profile?.target_protein || 130
  const targetCarb = dailyLog?.target_carbs || profile?.target_carbs || 220
  const targetFat = dailyLog?.target_fat || profile?.target_fat || 70

  // Calculate percentages
  const caloriesPercent = Math.min(100, (consumptionTotals.calories / targetCal) * 100)
  const proteinPercent = Math.min(100, (consumptionTotals.protein / targetProt) * 100)
  const carbsPercent = Math.min(100, (consumptionTotals.carbs / targetCarb) * 100)
  const fatPercent = Math.min(100, (consumptionTotals.fat / targetFat) * 100)

  // Group meal entries for display
  const mealsGrouped = {
    BREAKFAST: mealEntries.filter((e) => e.meal_type === 'BREAKFAST'),
    LUNCH: mealEntries.filter((e) => e.meal_type === 'LUNCH'),
    DINNER: mealEntries.filter((e) => e.meal_type === 'DINNER'),
    SNACK: mealEntries.filter((e) => e.meal_type === 'SNACK')
  }

  const mealTypeLabels: Record<keyof typeof mealsGrouped, string> = {
    BREAKFAST: 'Desayuno',
    LUNCH: 'Almuerzo',
    DINNER: 'Cena',
    SNACK: 'Snacks / Colaciones'
  }

  return (
    <div className="dashboard-wrapper">
      {/* Navigation Header */}
      <header className="dashboard-header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Fitness Core</span>
        </div>
        <div className="user-nav">
          <div className="user-profile-badge">
            <span className="user-avatar">{user.firstName[0]}{user.lastName[0]}</span>
            <span className="user-name-text">{user.firstName} {user.lastName}</span>
            <span className={`role-tag ${user.role.toLowerCase()}`}>{user.role}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="dashboard-content">
        <section className="welcome-banner">
          <h1>¡Hola, {user.firstName}! 👋</h1>
          <p>Tu sesión está activa. Tus metas nutricionales y logs diarios se procesan de forma local e instantánea (Local-First).</p>
        </section>

        {/* Bento Grid layout */}
        <div className="bento-grid">
          
          {/* Card 1: Perfil de Usuario */}
          <div className="bento-card card-profile">
            <div className="card-header">
              <span className="card-emoji">👤</span>
              <h3>Perfil del Atleta</h3>
            </div>
            <div className="card-body">
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">NOMBRE</span>
                  <span className="detail-val">{user.firstName} {user.lastName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">EMAIL</span>
                  <span className="detail-val">{user.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">REGISTRO</span>
                  <span className="detail-val">{joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Objetivos de Nutrición (Configurable Goals) */}
          <div className="bento-card card-goals">
            <div className="card-header">
              <span className="card-emoji">🎯</span>
              <h3>Objetivos Diarios</h3>
            </div>
            <div className="card-body">
              {!isEditingGoals ? (
                <div className="profile-details">
                  <div className="detail-item">
                    <span className="detail-label">CALORÍAS OBJETIVO</span>
                    <span className="detail-val">{targetCal} kcal</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">MACRONUTRIENTES</span>
                    <span className="detail-val" style={{ fontSize: '0.85rem' }}>
                      Proteínas: <strong>{targetProt}g</strong> | Carbohidratos: <strong>{targetCarb}g</strong> | Grasas: <strong>{targetFat}g</strong>
                    </span>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setIsEditingGoals(true)}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Editar Metas
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveGoals} className="goals-form">
                  <div className="goals-form-grid">
                    <div className="goals-input-group">
                      <label>Calorías (kcal)</label>
                      <input
                        type="number"
                        value={goalCal}
                        onChange={(e) => setGoalCal(e.target.value)}
                        required
                      />
                    </div>
                    <div className="goals-input-group">
                      <label>Proteínas (g)</label>
                      <input
                        type="number"
                        value={goalProt}
                        onChange={(e) => setGoalProt(e.target.value)}
                        required
                      />
                    </div>
                    <div className="goals-input-group">
                      <label>Carbohidratos (g)</label>
                      <input
                        type="number"
                        value={goalCarb}
                        onChange={(e) => setGoalCarb(e.target.value)}
                        required
                      />
                    </div>
                    <div className="goals-input-group">
                      <label>Grasas (g)</label>
                      <input
                        type="number"
                        value={goalFat}
                        onChange={(e) => setGoalFat(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="goals-form-actions">
                    <button type="button" className="btn-small btn-small-secondary" onClick={() => setIsEditingGoals(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-small btn-small-primary">
                      Guardar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Card 3: Energía y Macros (Real-Time Live calculation) */}
          <div className="bento-card card-calories">
            <div className="card-header">
              <span className="card-emoji">🔥</span>
              <h3>Energía y Macros</h3>
            </div>
            <div className="card-body">
              <div className="metric-display">
                <span className="metric-num text-secondary">{consumptionTotals.calories}</span>
                <span className="metric-unit">/ {targetCal} kcal</span>
              </div>
              
              <div className="progress-bar-container">
                <div className="progress-bar bg-secondary" style={{ width: `${caloriesPercent}%` }}></div>
              </div>
              <span className="detail-label" style={{ marginBottom: '1rem', display: 'block' }}>
                CONSUMIDO: {caloriesPercent.toFixed(1)}% DE TU META
              </span>

              {/* Progress bars for macronutrients */}
              <div className="macro-progress-list">
                {/* Protein */}
                <div className="macro-progress-item">
                  <div className="macro-progress-header">
                    <span className="macro-name">Proteínas</span>
                    <span className="macro-val">{consumptionTotals.protein}g / {targetProt}g</span>
                  </div>
                  <div className="macro-bar-outer">
                    <div className="macro-bar-inner macro-bar-protein" style={{ width: `${proteinPercent}%` }}></div>
                  </div>
                </div>

                {/* Carbohydrates */}
                <div className="macro-progress-item">
                  <div className="macro-progress-header">
                    <span className="macro-name">Carbohidratos</span>
                    <span className="macro-val">{consumptionTotals.carbs}g / {targetCarb}g</span>
                  </div>
                  <div className="macro-bar-outer">
                    <div className="macro-bar-inner macro-bar-carbs" style={{ width: `${carbsPercent}%` }}></div>
                  </div>
                </div>

                {/* Fats */}
                <div className="macro-progress-item">
                  <div className="macro-progress-header">
                    <span className="macro-name">Grasas</span>
                    <span className="macro-val">{consumptionTotals.fat}g / {targetFat}g</span>
                  </div>
                  <div className="macro-bar-outer">
                    <div className="macro-bar-inner macro-bar-fat" style={{ width: `${fatPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Food Diary Tracker (Double column span) */}
          <div className="bento-card col-span-2 card-food-diary">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="card-emoji">🍎</span>
                <h3>Diario de Alimentación</h3>
              </div>
              <div className="off-attribution">
                <span>Datos:</span>
                <span className="off-logo">Open Food Facts</span>
                <a href="https://openfoodfacts.org" target="_blank" rel="noopener noreferrer">(web)</a>
              </div>
            </div>
            <div className="card-body logger-body">
              {/* Left Side: Logged meals grouped by meal type */}
              <div className="logger-list-container" style={{ flex: 1.2 }}>
                <div className="meal-diary-list">
                  {mealEntries.length === 0 ? (
                    <div className="no-workouts" style={{ padding: '3rem 1.5rem' }}>
                      No has registrado alimentos para el día de hoy.
                    </div>
                  ) : (
                    (Object.keys(mealsGrouped) as Array<keyof typeof mealsGrouped>).map((type) => {
                      const entries = mealsGrouped[type]
                      if (entries.length === 0) return null

                      return (
                        <div key={type} className="meal-diary-group">
                          <h4 className="meal-group-title">{mealTypeLabels[type]}</h4>
                          {entries.map((entry) => {
                            const food = foodItems[entry.food_id]
                            const kcal = food
                              ? Math.round(food.calories_per_100g * (entry.amount_g / 100))
                              : 0

                            return (
                              <div key={entry.id} className="meal-diary-item">
                                <div className="meal-item-details">
                                  <span className="meal-item-name">{food?.name || 'Cargando...'}</span>
                                  <span className="meal-item-sub">
                                    {food?.brand ? `${food.brand} • ` : ''}{entry.amount_g}g 
                                    {food ? ` (P:${food.protein_per_100g}g C:${food.carbs_per_100g}g G:${food.fat_per_100g}g por 100g)` : ''}
                                  </span>
                                </div>
                                <div className="meal-item-actions">
                                  <span className="meal-item-calories">{kcal} kcal</span>
                                  <button
                                    className="btn-delete-item"
                                    onClick={() => handleDeleteMealEntry(entry.id)}
                                    title="Eliminar porción"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Side: Search & Log Food forms */}
              <div className="dashboard-workout-form" style={{ flex: 1, borderLeft: '1px solid rgba(255, 255, 255, 0.05)', paddingLeft: '1.5rem' }}>
                {!selectedFood ? (
                  <div className="food-logger-wrapper">
                    <div className="food-search-box">
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          placeholder="Buscar alimento o ingresar código..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setIsCreatingCustom(false)
                          }}
                        />
                        <button
                          type="button"
                          className="btn-add-workout"
                          style={{ fontSize: '0.85rem', padding: '0 0.75rem' }}
                          onClick={() => {
                            setIsCreatingCustom(!isCreatingCustom)
                            setSearchQuery('')
                          }}
                        >
                          {isCreatingCustom ? 'Volver' : 'Nuevo'}
                        </button>
                      </div>

                      {/* Search results dropdown */}
                      {searchQuery.trim().length >= 2 && (
                        <div className="search-results-container">
                          {isSearching && <div className="search-loading-text">Buscando en Open Food Facts y caché...</div>}
                          {!isSearching && searchResults.length === 0 && (
                            <div className="search-loading-text">No se encontraron resultados.</div>
                          )}
                          {searchResults.map((food) => (
                            <div
                              key={food.id}
                              className="search-result-row"
                              onClick={() => setSelectedFood(food)}
                            >
                              <div className="search-result-info">
                                <span className="search-result-title">{food.name}</span>
                                <span className="search-result-brand">
                                  {food.brand ? `${food.brand} • ` : ''}
                                  <span className={`source-badge ${food.source === 'OPEN_FOOD_FACTS' ? 'off' : 'personal'}`}>
                                    {food.source === 'OPEN_FOOD_FACTS' ? 'OFF' : 'Personal'}
                                  </span>
                                </span>
                                <span className="search-result-nutriments">
                                  {food.calories_per_100g} kcal | P: {food.protein_per_100g}g | C: {food.carbs_per_100g}g | G: {food.fat_per_100g}g
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form to create manual personal food item */}
                    {isCreatingCustom && (
                      <form onSubmit={handleCreateCustomFood} className="goals-form" style={{ marginTop: '0', background: 'none', border: 'none', padding: '0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="goals-input-group">
                            <label>Nombre del Alimento</label>
                            <input
                              type="text"
                              placeholder="Ej: Avena Instantánea"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="goals-input-group">
                            <label>Marca (opcional)</label>
                            <input
                              type="text"
                              placeholder="Ej: Quaker"
                              value={customBrand}
                              onChange={(e) => setCustomBrand(e.target.value)}
                            />
                          </div>
                          <div className="goals-form-grid">
                            <div className="goals-input-group">
                              <label>Kcal por 100g</label>
                              <input
                                type="number"
                                placeholder="350"
                                value={customCal}
                                onChange={(e) => setCustomCal(e.target.value)}
                                required
                              />
                            </div>
                            <div className="goals-input-group">
                              <label>Prot (g) por 100g</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="12"
                                value={customProt}
                                onChange={(e) => setCustomProt(e.target.value)}
                                required
                              />
                            </div>
                            <div className="goals-input-group">
                              <label>Carb (g) por 100g</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="60"
                                value={customCarb}
                                onChange={(e) => setCustomCarb(e.target.value)}
                                required
                              />
                            </div>
                            <div className="goals-input-group">
                              <label>Grasas (g) por 100g</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="6"
                                value={customFat}
                                onChange={(e) => setCustomFat(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="btn-add-workout"
                            style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}
                          >
                            Crear y Seleccionar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Form to log portion weight */
                  <form onSubmit={handleLogMeal} className="logging-panel">
                    <div className="logging-title">Registrar Consumo</div>
                    <div style={{ fontSize: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
                      <strong>{selectedFood.name}</strong>
                      {selectedFood.brand && <span style={{ color: 'var(--text-secondary)' }}> ({selectedFood.brand})</span>}
                    </div>
                    
                    <div className="goals-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="logging-form-group">
                        <label>Cantidad consumida (en gramos)</label>
                        <input
                          type="number"
                          value={logAmount}
                          onChange={(e) => setLogAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="logging-form-group">
                        <label>Comida del día</label>
                        <select
                          value={logMealType}
                          onChange={(e) => setLogMealType(e.target.value as MealType)}
                        >
                          <option value="BREAKFAST">Desayuno</option>
                          <option value="LUNCH">Almuerzo</option>
                          <option value="DINNER">Cena</option>
                          <option value="SNACK">Snack</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-small btn-small-secondary"
                        style={{ flex: 1, padding: '0.6rem' }}
                        onClick={() => setSelectedFood(null)}
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        className="btn-small btn-small-primary"
                        style={{ flex: 2, padding: '0.6rem' }}
                      >
                        Registrar Porción
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Interactive Workout Simulator (Kept in 1 column) */}
          <div className="bento-card card-workouts">
            <div className="card-header">
              <span className="card-emoji">🏋️</span>
              <h3>Actividad Física</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="logger-list-container">
                <ul className="dashboard-workout-list" style={{ maxHeight: '110px' }}>
                  {workouts.length === 0 ? (
                    <li className="no-workouts">No hay actividades registradas hoy.</li>
                  ) : (
                    workouts.map((w) => (
                      <li key={w.id} className="dashboard-workout-item" style={{ padding: '0.4rem 0.6rem' }}>
                        <div className="workout-info">
                          <span className="workout-bullet">•</span>
                          <strong>{w.type}</strong>
                          <span className="workout-duration" style={{ fontSize: '0.65rem', padding: '0.05rem 0.25rem' }}>{w.duration} min</span>
                        </div>
                        <span className="workout-time" style={{ fontSize: '0.65rem' }}>{w.time}</span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="workout-summary" style={{ paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                  <span>Total Ejercicio:</span>
                  <span className="text-primary-lime">{totalWorkoutMinutes} minutos</span>
                </div>
              </div>

              <form onSubmit={addWorkout} className="dashboard-workout-form" style={{ borderLeft: 'none', paddingLeft: '0', marginTop: 'auto' }}>
                <div className="form-select-group" style={{ gap: '0.5rem' }}>
                  <select 
                    value={workoutType} 
                    onChange={(e) => setWorkoutType(e.target.value)}
                    style={{ padding: '0.4rem' }}
                  >
                    <option value="Cardio">Cardio</option>
                    <option value="Entrenamiento de Fuerza">Fuerza</option>
                    <option value="Yoga / Estiramiento">Yoga</option>
                    <option value="Ciclismo">Ciclismo</option>
                    <option value="Natación">Natación</option>
                  </select>
                  <select 
                    value={workoutDuration} 
                    onChange={(e) => setWorkoutDuration(e.target.value)}
                    style={{ padding: '0.4rem' }}
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
                <button type="submit" className="btn-add-workout" style={{ padding: '0.4rem' }}>+</button>
              </form>
            </div>
          </div>

          {/* Card 6: AI Recommendations (kept from original) */}
          <div className="bento-card card-ai">
            <div className="card-header">
              <span className="card-emoji">✨</span>
              <h3>Recomendaciones IA</h3>
            </div>
            <div className="card-body">
              <div className="ai-message-bubble" style={{ padding: '0.85rem' }}>
                <div className="ai-header">
                  <span className="sparkle-icon">✦</span>
                  <strong>Fitness Core AI</strong>
                </div>
                <p style={{ fontSize: '0.8rem' }}>
                  {consumptionTotals.calories === 0 
                    ? "Registrá tu primera comida del día para que la Inteligencia Artificial pueda sugerirte snacks óptimos basados en tu actividad física y objetivos de macronutrientes."
                    : `Has consumido ${consumptionTotals.calories} kcal de tu objetivo de ${targetCal} kcal. Asegurá consumir suficientes proteínas (${consumptionTotals.protein}/${targetProt}g) para apoyar la recuperación muscular.`
                  }
                </p>
              </div>
              <button className="btn-ai-action" style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}>
                <span>Generar Rutina de Mañana</span>
              </button>
            </div>
          </div>

          {/* Card 7: Hydration Stats (kept from original) */}
          <div className="bento-card card-hydration">
            <div className="card-header">
              <span className="card-emoji">💧</span>
              <h3>Hidratación</h3>
            </div>
            <div className="card-body">
              <div className="metric-display">
                <span className="metric-num text-tertiary">1.2</span>
                <span className="metric-unit">/ 3.0 Litros</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar bg-tertiary" style={{ width: '40%' }}></div>
              </div>
              <p className="card-tip">¡Buen ritmo! Necesitás tomar 1.8L más hoy para cumplir tu meta.</p>
            </div>
          </div>

        </div>
      </main>

      <footer className="dashboard-footer">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span>© 2026 Fitness Core Project. Local-First Database & Caching con RxDB.</span>
          <div className="off-attribution">
            <span>Datos de alimentos provistos bajo licencia ODbL por </span>
            <a href="https://openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="off-logo">
              Open Food Facts
            </a>
            <span> y sus colaboradores.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
