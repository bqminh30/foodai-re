/**
 * Food service for handling food-related operations
 */
import { createChatCompletion } from './openai';
import { FoodInfo, FoodRecommendation, Weather } from '@/types';
import { isFeatureEnabled } from '@/lib/features';
import { generateCacheKey, getCachedOrFetch, NAMESPACE } from '@/services/caching';

/**
 * Gets detailed information about a specific food
 * @param foodName - The name of the food to get details for
 * @param locale - The user's current locale
 * @returns Detailed information about the food
 */
export async function getFoodDetails(foodName: string, locale?: string): Promise<FoodInfo> {
  // Check if food details feature is enabled
  if (!isFeatureEnabled('foodDetails')) {
    throw new Error('Food details feature is disabled');
  }

  // Function to fetch food details
  const fetchFoodDetailsData = async (): Promise<FoodInfo> => {
    // Create a prompt for the OpenAI API
    const prompt = `
      As a culinary expert, please provide detailed information about the dish or food called "${foodName}".
      
      Please include:
      1. A brief description of the dish
      2. A list of main ingredients
      3. A brief overview of how it's prepared
      
      Format your response as a JSON object with these fields:
      - 'name': the name of the dish
      - 'description': a string with a description
      - 'ingredients': an array of strings listing the main ingredients
      - 'preparation': a string explaining how it's prepared
    `;

    // Set the system prompt based on the user's locale
    // Default to English for unsupported languages
    let responseLanguage = "English";
    
    // Map locale to language name for the prompt
    if (locale === 'vi') {
      responseLanguage = "Vietnamese";
    } else if (locale === 'fr') {
      responseLanguage = "French";
    }
    
    const systemPrompt = `You are a helpful assistant that provides detailed information about foods and dishes. Respond only in ${responseLanguage} with the requested JSON format.`;
    const responseContent = await createChatCompletion("gpt-4o-mini", systemPrompt, prompt, true, 'openai');

    return JSON.parse(responseContent) as FoodInfo;
  };

  // Check if caching is enabled
  if (isFeatureEnabled('enableCaching')) {
    // Generate a short, hashed cache key
    const cacheKey = generateCacheKey(NAMESPACE.FOOD_DETAILS, [foodName.toLowerCase().trim(), locale]);
    
    // Use our caching utility to get data from cache or fetch if not available
    // Cache food details for 24 hours (86400 seconds)
    return getCachedOrFetch<FoodInfo>(
      cacheKey,
      fetchFoodDetailsData,
      86400 // Cache for 24 hours (86400 seconds)
    );
  } else {
    // If caching is disabled, directly fetch the data
    return fetchFoodDetailsData();
  }
}

/**
 * Fetches food recommendations from the API for use in components
 * @param weather - The current weather data
 * @param excludedFoods - Foods to exclude from recommendations
 * @param locale - The user's locale
 * @param numberOfDiners - The number of people dining together
 * @param mealType - The type of meal (single dish or full set)
 * @param specialRequirements - Special dietary or preference requirements
 * @returns Promise with food recommendations
 */
export async function fetchRecommendations(weather: Weather, excludedFoods: string[] = [], locale?: string, numberOfDiners?: number, mealType?: string, specialRequirements?: string): Promise<FoodRecommendation> {
  if (!weather) return Promise.reject(new Error('No weather data provided'));
  
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weather,
        excludedFoods,
        locale,
        numberOfDiners,
        mealType,
        specialRequirements
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: unknown) {
    console.error('Failed to fetch recommendations:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while fetching recommendations');
  }
}

/**
 * Gets food recommendations based on weather and other factors
 * @param weather - The current weather conditions
 * @param excludedFoods - Foods to exclude from recommendations
 * @param locale - The user's current locale
 * @param numberOfDiners - The number of people dining
 * @param mealType - The type of meal (single dish or full set)
 * @param specialRequirements - Special dietary or preference requirements
 * @returns Food recommendations based on the weather and user preferences
 */
export async function getFoodRecommendations(weather: Weather | null, excludedFoods?: string[], locale?: string, numberOfDiners?: number, mealType?: string, specialRequirements?: string): Promise<FoodRecommendation> {
  if (!isFeatureEnabled('foodRecommendations')) {
    throw new Error('Food recommendations feature is disabled');
  }

  const useWeatherForRecommendations = isFeatureEnabled('useWeatherForRecommendations');
  
  // Check if weather is required but not provided
  if (useWeatherForRecommendations && !weather) {
    throw new Error('Weather data is required when useWeatherForRecommendations is enabled');
  }

  // Function to fetch food recommendations
  const fetchRecommendationsData = async (): Promise<FoodRecommendation> => {
    let prompt = `
      As a culinary expert, please recommend 6 delicious foods or dishes`;
    
    // Determine which factors to include based on feature flags
    const useWeather = isFeatureEnabled('useWeatherForRecommendations');
    const useLocation = isFeatureEnabled('useLocationForRecommendations');
    
    // Add weather and location context if those features are enabled and weather data is available
    if ((useWeather || useLocation) && weather) {
      prompt += ` that would be perfect for the following conditions:\n`;
      
      if (useLocation && weather.location) {
        prompt += `\n    Location: ${weather.location}`;
        // Add emphasis on location-appropriate dishes
        prompt += `\n    IMPORTANT: Please recommend dishes that are popular, traditional, or commonly eaten in ${weather.location}. The recommendations should reflect the local cuisine and food culture of this location.`;
      }
      
      if (useWeather) {
        prompt += `\n    Temperature: ${weather.temperature}°C\n    Weather Condition: ${weather.conditionText}`;
      }
    } else {
      prompt += ` that are generally popular and delicious.`;
    }
      
    // Add excluded foods if that feature is enabled and foods are provided
    if (isFeatureEnabled('foodExclusions') && excludedFoods && excludedFoods.length > 0) {
      prompt += `
      IMPORTANT: The user has specified the following foods or ingredients to exclude. DO NOT recommend these foods or any dishes containing these ingredients:
      ${excludedFoods.join(', ')}
      `;
    }
    
    // Add group dining context if that feature is enabled and number of diners is provided
    if (isFeatureEnabled('numberOfDiners') && numberOfDiners && numberOfDiners > 1) {
      prompt += `
      The user is planning a meal for ${numberOfDiners} people dining together. Please recommend foods that:
      1. Are suitable for sharing in a group setting
      2. Can be served family-style or as a shared platter
      3. Are crowd-pleasers that appeal to diverse tastes
      4. Are appropriate portion sizes for ${numberOfDiners} people
      `;
    }
    
    // Add meal type context if that feature is enabled and meal type is provided
    if (isFeatureEnabled('mealTypeSelection') && mealType) {
      if (mealType === 'full') {
        prompt += `
        The user has requested a FULL SET MEAL recommendation. Please provide a complete meal set that includes:
        1. Main dishes (protein-focused dishes)
        2. Side dishes (vegetables, starches, etc.)
        3. Desserts or beverages to complete the meal
        4. Ensure the combination creates a balanced and cohesive dining experience
        `;
      } else {
        prompt += `
        The user has requested SINGLE DISH recommendations. Please provide individual dishes that:
        1. Are complete meals on their own
        2. Don't require additional side dishes to be satisfying
        3. Are well-balanced in terms of nutrition and flavor
        `;
      }
    }
    
    // Add special requirements if that feature is enabled and requirements are provided
    if (isFeatureEnabled('extendedSettings') && isFeatureEnabled('specialRequirements') && specialRequirements && specialRequirements.trim()) {
      prompt += `
      IMPORTANT: The user has provided the following special requirements or preferences. Please consider these when making your recommendations:
      ${specialRequirements.trim()}
      `;
    }
    
    prompt += `
      Please provide:
      1. A mouthwatering list of 6 recommended foods or dishes that would be especially enjoyable ${useWeather ? 'in these conditions' : ''}${useLocation && weather?.location ? ` and authentic to ${weather.location}` : ''}
      2. A brief explanation of why these culinary choices are ideal ${useWeather ? 'for this weather (considering comfort, seasonal ingredients, local traditions, etc.)' : 'based on your expertise'}${useLocation && weather?.location ? ` and why they represent the cuisine of ${weather.location}` : ''}
      
      IMPORTANT: Format your response as a JSON object with EXACTLY these two fields:
      - 'foods': an array of strings with ONLY the food names (e.g. ["Pasta", "Pizza", "Soup"]). Each item must be a simple food name without descriptions or additional details.
      - 'reasoning': a string explaining why these foods are recommended
      
      Example of correct format:
      {"foods": ["Hot Chocolate", "Beef Stew", "Roasted Chicken", "Pumpkin Soup", "Apple Pie", "Mulled Wine"], "reasoning": "These warming foods are perfect for cold weather because..."}    
    `;

    // Set the system prompt based on the user's locale
    // Default to English for unsupported languages
    let responseLanguage = "English";
    
    // Map locale to language name for the prompt
    if (locale === 'vi') {
      responseLanguage = "Vietnamese";
    } else if (locale === 'fr') {
      responseLanguage = "French";
    }
    
    const systemPrompt = `You are a helpful assistant that provides food recommendations based on weather and user preferences. 
    Respond only in ${responseLanguage} with the requested JSON format.
    IMPORTANT: When a location is provided, your recommended foods should be authentic and appropriate to that location's cuisine and culinary traditions. Do not recommend dishes from other regions unless they are commonly eaten in the specified location.`;
    
    // Get the response from OpenAI API and parse it as JSON
    const responseContent = await createChatCompletion("gpt-4o-mini", systemPrompt, prompt, true, 'openai');
    
    try {
      return JSON.parse(responseContent) as FoodRecommendation;
    } catch (error: unknown) {
      console.error('Error parsing food recommendations response:', error);
      throw new Error('Failed to parse food recommendations response');
    }
  };

  // Check if caching is enabled
  if (isFeatureEnabled('enableCaching')) {
    // Collect all parameters that affect recommendations for cache key
    const cacheParams = [];
    
    // Determine which factors to include based on feature flags
    const useWeather = isFeatureEnabled('useWeatherForRecommendations');
    const useLocation = isFeatureEnabled('useLocationForRecommendations');
    
    // Add location if that feature is enabled and weather is available
    if (useLocation && weather && weather.location) {
      cacheParams.push(weather.location);
    }
    
    // Add weather data if that feature is enabled and weather is available
    if (useWeather && weather) {
      cacheParams.push(weather.temperature.toFixed(1), weather.condition);
    }
    
    // Add excluded foods if that feature is enabled
    if (isFeatureEnabled('foodExclusions') && excludedFoods && excludedFoods.length > 0) {
      cacheParams.push(...excludedFoods.sort());
    }
    
    // Add locale
    if (locale) {
      cacheParams.push(locale);
    }
    
    // Add number of diners if that feature is enabled
    if (isFeatureEnabled('numberOfDiners') && numberOfDiners && numberOfDiners > 1) {
      cacheParams.push(`diners:${numberOfDiners}`);
    }
    
    // Add meal type if that feature is enabled
    if (isFeatureEnabled('mealTypeSelection') && mealType) {
      cacheParams.push(`mealType:${mealType}`);
    }
    
    // Add special requirements if that feature is enabled
    if (isFeatureEnabled('extendedSettings') && isFeatureEnabled('specialRequirements') && specialRequirements && specialRequirements.trim()) {
      // Only use first 50 chars of special requirements to keep cache key reasonable
      cacheParams.push(`req:${specialRequirements.trim().substring(0, 50)}`);
    }
    
    // Generate a short, hashed cache key
    const cacheKey = generateCacheKey(NAMESPACE.FOOD_RECOMMENDATIONS, cacheParams);
    
    // Use our caching utility to get data from cache or fetch if not available
    // Cache food recommendations for 6 hours (21600 seconds)
    return getCachedOrFetch<FoodRecommendation>(
      cacheKey,
      fetchRecommendationsData,
      21600 // Cache for 6 hours (21600 seconds)
    );
  } else {
    // If caching is disabled, directly fetch the data
    return fetchRecommendationsData();
  }
}
