import { createRxDatabase, addRxPlugin } from 'rxdb';
import type { RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

// Add RxDB plugins
addRxPlugin(RxDBQueryBuilderPlugin);

// --- TypeScript Types ---
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type GoalType = 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_MUSCLE';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type FoodSource = 'USER_CREATED' | 'OPEN_FOOD_FACTS';

export interface UserDoc {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface UserProfileDoc {
  user_id: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal_type: GoalType;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  updatedAt: string;
}

export interface DailyLogDoc {
  id: string; // format: `${userId}_${YYYY-MM-DD}`
  user_id: string;
  date: string; // format: YYYY-MM-DD
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  water_ml: number;
  updatedAt: string;
}

export interface FoodItemDoc {
  id: string; // UUID or barcode
  api_id?: string; // barcode for Open Food Facts
  name: string;
  brand?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  source: FoodSource;
  fetched_at?: string; // ISO string
  updatedAt: string;
}

export interface MealEntryDoc {
  id: string;
  log_id: string;
  food_id: string;
  amount_g: number;
  meal_type: MealType;
  timestamp: string; // ISO string
  updatedAt: string;
}

// --- JSON Schemas ---
const userSchema = {
  title: 'user schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    username: { type: 'string' },
    email: { type: 'string' },
    created_at: { type: 'string' }
  },
  required: ['id', 'email']
};

const userProfileSchema = {
  title: 'user profile schema',
  version: 0,
  primaryKey: 'user_id',
  type: 'object',
  properties: {
    user_id: { type: 'string', maxLength: 100 },
    age: { type: 'number' },
    gender: { type: 'string' },
    height_cm: { type: 'number' },
    weight_kg: { type: 'number' },
    activity_level: { type: 'string' },
    goal_type: { type: 'string' },
    target_calories: { type: 'number' },
    target_protein: { type: 'number' },
    target_carbs: { type: 'number' },
    target_fat: { type: 'number' },
    updatedAt: { type: 'string' }
  },
  required: ['user_id', 'target_calories', 'target_protein', 'target_carbs', 'target_fat', 'updatedAt']
};

const dailyLogSchema = {
  title: 'daily log schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 150 },
    user_id: { type: 'string', maxLength: 100 },
    date: { type: 'string' },
    target_calories: { type: 'number' },
    target_protein: { type: 'number' },
    target_carbs: { type: 'number' },
    target_fat: { type: 'number' },
    water_ml: { type: 'number' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'user_id', 'date', 'target_calories', 'target_protein', 'target_carbs', 'target_fat', 'water_ml', 'updatedAt'],
  indexes: ['user_id']
};

const foodItemSchema = {
  title: 'food item schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    api_id: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
    brand: { type: 'string' },
    calories_per_100g: { type: 'number' },
    protein_per_100g: { type: 'number' },
    carbs_per_100g: { type: 'number' },
    fat_per_100g: { type: 'number' },
    source: { type: 'string' },
    fetched_at: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'source', 'updatedAt'],
  indexes: ['api_id']
};

const mealEntrySchema = {
  title: 'meal entry schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    log_id: { type: 'string', maxLength: 150 },
    food_id: { type: 'string', maxLength: 100 },
    amount_g: { type: 'number' },
    meal_type: { type: 'string' },
    timestamp: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'log_id', 'food_id', 'amount_g', 'meal_type', 'timestamp', 'updatedAt'],
  indexes: ['log_id']
};

// --- Database Instance Manager ---
export type FitnessDatabaseCollections = {
  users: RxCollection<UserDoc>;
  user_profiles: RxCollection<UserProfileDoc>;
  daily_logs: RxCollection<DailyLogDoc>;
  food_items: RxCollection<FoodItemDoc>;
  meal_entries: RxCollection<MealEntryDoc>;
};

export type FitnessDatabase = RxDatabase<FitnessDatabaseCollections>;

let activeDb: FitnessDatabase | null = null;
let devModeLoaded = false;

export async function getDatabase(userId: string): Promise<FitnessDatabase> {
  if (activeDb) {
    return activeDb;
  }

  // Dynamically import dev-mode plugin in development environment to aid debugging
  if (import.meta.env.DEV && !devModeLoaded) {
    try {
      const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
      addRxPlugin(RxDBDevModePlugin);
      devModeLoaded = true;
    } catch (e) {
      console.warn('Could not load RxDB dev-mode plugin', e);
    }
  }

  // Create isolated IndexedDB storage for each user
  const dbName = `fitness_db_${userId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  
  activeDb = await createRxDatabase<FitnessDatabaseCollections>({
    name: dbName,
    storage: getRxStorageDexie()
  });

  // Register collections and schemas
  await activeDb.addCollections({
    users: { schema: userSchema },
    user_profiles: { schema: userProfileSchema },
    daily_logs: {
      schema: dailyLogSchema,
      migrationStrategies: {
        1: (oldDoc) => { oldDoc.water_ml = 0; return oldDoc; }
      }
    },
    food_items: { schema: foodItemSchema },
    meal_entries: { schema: mealEntrySchema }
  });

  return activeDb;
}

export async function closeDatabase(): Promise<void> {
  if (activeDb) {
    await activeDb.close();
    activeDb = null;
  }
}
