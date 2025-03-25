/**
 * Shared type definitions for the entire application
 */

/**
 * Represents a geographic location with coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Represents hourly forecast data
 */
export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  conditionText: string;
}

/**
 * Represents weather data for a specific location
 */
export interface Weather {
  temperature: number;
  condition: string;
  conditionText: string;
  location: string;
  humidity?: number;
  uvIndex?: number;
  hourlyForecast?: HourlyForecast[];
}

/**
 * Represents food recommendations based on weather conditions
 */
export interface FoodRecommendation {
  foods: string[];
  reasoning: string;
}

/**
 * Represents detailed information about a specific food
 */
export interface FoodInfo {
  name: string;
  description: string;
  ingredients: string[];
  preparation: string;
}

/**
 * Meal type options for food recommendations
 */
export enum MealType {
  SINGLE_DISH = 'single',
  FULL_SET = 'full'
}

/**
 * Request body for food recommendations API
 */
export interface RecommendationRequestBody {
  weather?: Weather;
  excludedFoods?: string[];
  locale?: string;
  captchaToken?: string;
  numberOfDiners?: number;
  mealType?: MealType;
}

/**
 * Request body for food details API
 */
export interface FoodDetailsRequestBody {
  name: string;
  locale?: string;
  captchaToken?: string;
}



/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  status?: number;
}

/**
 * Food comparison item interface
 */
export interface FoodComparisonItem {
  foodName: string;
  pros: string[];
  cons: string[];
}

/**
 * Food comparison result interface
 */
export interface FoodComparisonResult {
  recommendedFood: string;
  reasoning: string;
  comparisons: FoodComparisonItem[];
}

/**
 * Request body for food comparison API
 */
export interface FoodComparisonRequestBody {
  foodList: string[];
  weather?: Weather;
  locale?: string;
  captchaToken?: string;
  specialRequirements?: string;
}