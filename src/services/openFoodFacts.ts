import type { FoodItemDoc } from '../db/db';

// Retrieve default country code from environment variables or fallback to Argentina ('ar')
const DEFAULT_COUNTRY = import.meta.env.VITE_OFF_COUNTRY_CODE || 'ar';
const USER_AGENT = 'FitnessCoreApp/1.0 (contact@fitnesscore.org)';

/**
 * Maps an Open Food Facts product JSON to our internal FoodItemDoc schema.
 */
export function mapOFFProductToFoodItem(product: any): FoodItemDoc {
  const nutriments = product.nutriments || {};
  
  // Extract calories (energy-kcal), prioritizing kcal over kilojoules
  let calories = nutriments['energy-kcal_100g'];
  if (calories === undefined || calories === null) {
    calories = nutriments['energy-kcal_value'] || 0;
  }

  return {
    id: product.code || `off_${Date.now()}_${Math.random().toString(36).substring(5)}`,
    api_id: product.code || '',
    name: product.product_name || product.product_name_es || 'Alimento Desconocido',
    brand: product.brands || '',
    calories_per_100g: Number(calories || 0),
    protein_per_100g: Number(nutriments.proteins_100g || nutriments.proteins_value || 0),
    carbs_per_100g: Number(nutriments.carbohydrates_100g || nutriments.carbohydrates_value || 0),
    fat_per_100g: Number(nutriments.fat_100g || nutriments.fat_value || 0),
    source: 'OPEN_FOOD_FACTS',
    fetched_at: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Search products by text query in the parameterized country-specific Open Food Facts database.
 */
export async function searchFoodFromAPI(
  query: string,
  countryCode: string = DEFAULT_COUNTRY
): Promise<FoodItemDoc[]> {
  if (!query || query.trim() === '') return [];

  const url = `https://${countryCode.toLowerCase()}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=24`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.products)) {
      return data.products
        .filter((p: any) => p.product_name || p.product_name_es)
        .map((p: any) => mapOFFProductToFoodItem(p));
    }
    return [];
  } catch (error) {
    console.error(`Error searching Open Food Facts API for country '${countryCode}':`, error);
    return [];
  }
}

/**
 * Lookup a product by barcode in the parameterized country-specific Open Food Facts database.
 */
export async function getFoodByBarcodeFromAPI(
  barcode: string,
  countryCode: string = DEFAULT_COUNTRY
): Promise<FoodItemDoc | null> {
  if (!barcode || barcode.trim() === '') return null;

  const url = `https://${countryCode.toLowerCase()}.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data && (data.status === 1 || data.status_verbose === 'product found') && data.product) {
      return mapOFFProductToFoodItem(data.product);
    }
    return null;
  } catch (error) {
    console.error(`Error looking up barcode ${barcode} in Open Food Facts API for country '${countryCode}':`, error);
    return null;
  }
}
