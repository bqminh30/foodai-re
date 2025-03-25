/**
 * Feature flags utility for controlling application features
 */

/**
 * Feature flag configuration interface
 */
export interface FeatureFlags {
  // Location features
  ipGeolocation: boolean;
  manualLocation: boolean;
  mapDisplay: boolean;
  
  // Food features
  foodRecommendations: boolean;
  foodDetails: boolean;
  foodExclusions: boolean;
  extendedSettings: boolean;
  mealTypeSelection: boolean;
  specialRequirements: boolean;
  numberOfDiners: boolean;

  foodComparisonList: boolean;
  
  // Weather features
  useWeatherForRecommendations: boolean;
  useLocationForRecommendations: boolean;
  
  // Security features
  recaptcha: boolean;
  
  // System features
  enableCaching: boolean;
}

/**
 * Gets the current feature flag configuration
 * @returns The current feature flag configuration
 */
export function getFeatureFlags(): FeatureFlags {
  // Handle server-side differently - important for caching
  if (typeof window === 'undefined') {
    // On server-side, directly read environment variables
    return {
      // Location features
      ipGeolocation: process.env.NEXT_PUBLIC_FEATURE_IP_GEOLOCATION !== 'false',
      manualLocation: process.env.NEXT_PUBLIC_FEATURE_MANUAL_LOCATION !== 'false',
      mapDisplay: process.env.NEXT_PUBLIC_FEATURE_MAP_DISPLAY !== 'false',
      
      // Food features
      foodRecommendations: process.env.NEXT_PUBLIC_FEATURE_FOOD_RECOMMENDATIONS !== 'false',
      foodDetails: process.env.NEXT_PUBLIC_FEATURE_FOOD_DETAILS !== 'false',
      foodExclusions: process.env.NEXT_PUBLIC_FEATURE_FOOD_EXCLUSIONS !== 'false',
      extendedSettings: process.env.NEXT_PUBLIC_FEATURE_EXTENDED_SETTINGS !== 'false',
      mealTypeSelection: process.env.NEXT_PUBLIC_FEATURE_MEAL_TYPE_SELECTION !== 'false',
      specialRequirements: process.env.NEXT_PUBLIC_FEATURE_SPECIAL_REQUIREMENTS !== 'false',
      numberOfDiners: process.env.NEXT_PUBLIC_FEATURE_NUMBER_OF_DINERS !== 'false',
  
      foodComparisonList: process.env.NEXT_PUBLIC_FEATURE_FOOD_COMPARISON_LIST !== 'false',
      
      // Weather features
      useWeatherForRecommendations: process.env.NEXT_PUBLIC_FEATURE_USE_WEATHER !== 'false',
      useLocationForRecommendations: process.env.NEXT_PUBLIC_FEATURE_USE_LOCATION !== 'false',
      
      // Security features
      recaptcha: process.env.NEXT_PUBLIC_FEATURE_RECAPTCHA !== 'false',
      
      // System features
      enableCaching: process.env.NEXT_PUBLIC_FEATURE_ENABLE_CACHING !== 'false',
    };
  }
  
  // Client-side implementation
  return {
    // Location features
    ipGeolocation: process.env.NEXT_PUBLIC_FEATURE_IP_GEOLOCATION !== 'false',
    manualLocation: process.env.NEXT_PUBLIC_FEATURE_MANUAL_LOCATION !== 'false',
    mapDisplay: process.env.NEXT_PUBLIC_FEATURE_MAP_DISPLAY !== 'false',
    
    // Food features
    foodRecommendations: process.env.NEXT_PUBLIC_FEATURE_FOOD_RECOMMENDATIONS !== 'false',
    foodDetails: process.env.NEXT_PUBLIC_FEATURE_FOOD_DETAILS !== 'false',
    foodExclusions: process.env.NEXT_PUBLIC_FEATURE_FOOD_EXCLUSIONS !== 'false',
    extendedSettings: process.env.NEXT_PUBLIC_FEATURE_EXTENDED_SETTINGS !== 'false',
    mealTypeSelection: process.env.NEXT_PUBLIC_FEATURE_MEAL_TYPE_SELECTION !== 'false',
    specialRequirements: process.env.NEXT_PUBLIC_FEATURE_SPECIAL_REQUIREMENTS !== 'false',
    numberOfDiners: process.env.NEXT_PUBLIC_FEATURE_NUMBER_OF_DINERS !== 'false',

    foodComparisonList: process.env.NEXT_PUBLIC_FEATURE_FOOD_COMPARISON_LIST !== 'false',
    
    // Weather features
    useWeatherForRecommendations: process.env.NEXT_PUBLIC_FEATURE_USE_WEATHER !== 'false',
    useLocationForRecommendations: process.env.NEXT_PUBLIC_FEATURE_USE_LOCATION !== 'false',
    
    // Security features
    recaptcha: process.env.NEXT_PUBLIC_FEATURE_RECAPTCHA !== 'false',
    
    // System features
    enableCaching: process.env.NEXT_PUBLIC_FEATURE_ENABLE_CACHING !== 'false',
  };
}

/**
 * Checks if a specific feature is enabled
 * @param feature - The feature to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled<K extends keyof FeatureFlags>(feature: K): boolean {
  return getFeatureFlags()[feature];
}
/**
 * Debug helper: Get the raw environment variable value
 */
export function getRawEnvValue(name: string): string | undefined {
  return process.env[name];
}
