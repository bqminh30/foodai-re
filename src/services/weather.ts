/**
 * Weather service for handling weather-related operations
 */
import { Weather } from '@/types';
import { isFeatureEnabled } from '@/lib/features';
import { generateCacheKey, getCachedOrFetch, NAMESPACE } from '@/services/caching';

/**
 * Fetches weather data from the API for use in components
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @param locale - The user's locale
 * @returns Promise with weather data
 */
export async function fetchWeatherData(latitude?: number, longitude?: number, locale?: string): Promise<Weather> {
  if (!latitude || !longitude) return Promise.reject(new Error('Invalid coordinates'));
  
  try {
    const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}&locale=${locale || 'en'}`);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch weather:', err);
    throw err;
  }
}

/**
 * Maps a weather code to an appropriate emoji icon
 * @param weatherCode - The weather code (WMO Weather interpretation codes)
 * @returns The emoji icon representing the weather condition
 */

/**
 * Gets weather data for a specific location
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @param locale - The user's locale (optional, defaults to 'en')
 * @returns Weather data for the location
 */
export async function getWeatherData(latitude: number, longitude: number, locale: string = 'en'): Promise<Weather> {
  // Function to fetch weather data
  const fetchWeatherData = async (): Promise<Weather> => {
    // Fetch weather data from Open-Meteo API
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,relative_humidity_2m,uv_index&hourly=temperature_2m,weather_code&forecast_hours=6&timezone=auto`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data from API');
    }

    const weatherData = await weatherResponse.json();
    
    // Get location name using reverse geocoding
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'Food Recommendation App'  // Required by Nominatim's terms of use
        }
      }
    );

    if (!geoResponse.ok) {
      throw new Error('Failed to fetch location data');
    }

    const geoData = await geoResponse.json();
    const locationName = geoData.display_name.split(',').slice(0, 2).join(',');

    // Map weather code to condition
    const condition = getWeatherCondition(weatherData.current.weather_code);
    
    // Get the text description for the weather condition based on locale
    const conditionText = await getWeatherConditionText(weatherData.current.weather_code, locale);

    // Process hourly forecast data
    const hourlyForecast = [];
    if (weatherData.hourly) {
      // Get only the first 6 hours of forecast data
      for (let i = 0; i < 6; i++) {
        hourlyForecast.push({
          time: weatherData.hourly.time[i],
          temperature: weatherData.hourly.temperature_2m[i],
          weatherCode: weatherData.hourly.weather_code[i],
          conditionText: await getWeatherConditionText(weatherData.hourly.weather_code[i], locale)
        });
      }
    }

    return {
      temperature: weatherData.current.temperature_2m,
      condition,
      conditionText,
      location: locationName,
      humidity: weatherData.current.relative_humidity_2m,
      uvIndex: weatherData.current.uv_index,
      hourlyForecast
    };
  };

  // Check if caching is enabled
  if (isFeatureEnabled('enableCaching')) {
    // Round coordinates to 2 decimal places for better cache hits
    const roundedLat = latitude.toFixed(2);
    const roundedLon = longitude.toFixed(2);
    
    // Generate a short, optimized cache key using MD5 hash
    const cacheKey = generateCacheKey(NAMESPACE.WEATHER, [roundedLat, roundedLon, locale]);
    
    // Cache weather data for 10 minutes (600 seconds)
    return getCachedOrFetch<Weather>(
      cacheKey,
      fetchWeatherData,
      600 // Cache for 10 minutes (600 seconds)
    );
  } else {
    // If caching is disabled, directly fetch the data
    return fetchWeatherData();
  }
}

/**
 * Helper function to map weather codes to conditions
 * @param code - The weather code
 * @returns The weather condition code as a string that can be used as a translation key
 */
export function getWeatherCondition(code: number): string {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  // Check if the code exists in our translation keys
  const validCodes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
  
  // If the code is valid, return it as a string to be used as a translation key
  // Otherwise return 'unknown' as a fallback
  return validCodes.includes(code) ? code.toString() : 'unknown';
}

/**
 * Helper function to map weather codes to text descriptions
 * @param code - The weather code
 * @param locale - The user's locale (optional, defaults to 'en')
 * @returns The weather condition as a human-readable text in the specified language
 */
export async function getWeatherConditionText(code: number, locale: string = 'en'): Promise<string> {
  // Get the condition code as a string (e.g., "0", "1", "95", etc.)
  const conditionCode = getWeatherCondition(code);
  
  let conditionText = conditionCode; 
  
  try {

    const messages = await import(`../../messages/${locale}.json`)
      .then(module => module.default)
      .catch(() => null);
    
    const conditions = messages?.weather?.conditions as Record<string, string> | undefined;
    conditionText = conditions?.[conditionCode] || 
                   conditions?.unknown || 
                   conditionCode;
  } catch (error) {
    console.error('Error loading translation for locale:', locale, error);
    try {
      // Fallback to English
      const englishMessages = await import('../../messages/en.json')
        .then(module => module.default)
        .catch(() => null);
      
      const conditions = englishMessages?.weather?.conditions as Record<string, string> | undefined;
      conditionText = conditions?.[conditionCode] || 
                     conditions?.unknown || 
                     conditionCode;
    } catch (fallbackError) {
      console.error('Failed to load weather condition translations', fallbackError);
    }
  }
  
  return conditionText;
}

/**
 * Maps a weather code to an appropriate emoji icon
 * @param weatherCode - The weather code (WMO Weather interpretation codes)
 * @returns The emoji icon representing the weather condition
 */
export function getWeatherIcon(weatherCode: number | string) {
  // Convert string to number if it's a string (for backward compatibility)
  const code = typeof weatherCode === 'string' ? parseInt(weatherCode) : weatherCode;
  
  // Map WMO Weather interpretation codes to emoji icons
  // https://open-meteo.com/en/docs
  switch (code) {
    // Clear conditions (0, 1)
    case 0:
    case 1:
      return '☀️';
    // Partly cloudy (2)
    case 2:
      return '🌤️';
    // Overcast (3)
    case 3:
      return '⛅';
    // Fog conditions (45, 48)
    case 45:
    case 48:
      return '🌫️';
    // Drizzle conditions (51, 53, 55)
    case 51:
    case 53:
    case 55:
      return '🌧️';
    // Freezing drizzle (56, 57)
    case 56:
    case 57:
      return '🌨️';
    // Rain conditions (61, 63, 65)
    case 61:
    case 63:
    case 65:
      return '🌧️';
    // Freezing rain (66, 67)
    case 66:
    case 67:
      return '🌨️';
    // Snow conditions (71, 73, 75, 77)
    case 71:
    case 73:
    case 75:
    case 77:
      return '❄️';
    // Rain showers (80, 81, 82)
    case 80:
    case 81:
    case 82:
      return '🌦️';
    // Snow showers (85, 86)
    case 85:
    case 86:
      return '❄️';
    // Thunderstorm (95, 96, 99)
    case 95:
    case 96:
    case 99:
      return '⛈️';
    // Default case
    default:
      return '🌡️';
  }
}
