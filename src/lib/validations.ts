/**
 * Validation schemas for API requests using Zod
 */
import { z } from 'zod';

/**
 * Weather validation schema
 */
const hourlyForecastSchema = z.object({
  time: z.string(),
  temperature: z.number(),
  weatherCode: z.number(),
  conditionText: z.string()
});

export const weatherSchema = z.object({
  temperature: z.number(),
  condition: z.string(),
  conditionText: z.string(),
  location: z.string(),
  humidity: z.number().optional(),
  uvIndex: z.number().optional(),
  hourlyForecast: z.array(hourlyForecastSchema).optional()
});

/**
 * Food recommendation request validation schema
 */
export const recommendationRequestSchema = z.object({
  weather: weatherSchema.optional(),
  excludedFoods: z.array(z.string()).optional(),
  locale: z.string().optional(),
  recaptchaToken: z.string().optional(),
  numberOfDiners: z.number().int().positive().optional(),
  mealType: z.enum(['single', 'full']).optional(),
  specialRequirements: z.string().optional()
});

/**
 * Food details request validation schema
 */
export const foodDetailsRequestSchema = z.object({
  name: z.string().min(1, { message: 'Food name is required' }),
  locale: z.string().optional(),
  recaptchaToken: z.string().optional()
});

/**
 * Weather API query parameters validation schema
 */
export const weatherQuerySchema = z.object({
  lat: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Latitude must be a valid number'
  }),
  lon: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: 'Longitude must be a valid number'
  }),
  locale: z.string().optional()
});

/**
 * Geocode API query parameters validation schema
 */
export const geocodeQuerySchema = z.object({
  q: z.string().min(1, { message: 'Location query is required' })
});

/**
 * Food comparison request validation schema
 */
export const foodComparisonRequestSchema = z.object({
  foodList: z.array(z.string()).min(2, { message: 'At least two foods must be provided for comparison' }),
  weather: weatherSchema.optional(),
  locale: z.string().optional(),
  recaptchaToken: z.string().optional(),
  specialRequirements: z.string().optional()
});

/**
 * Type definitions derived from Zod schemas
 */
export type WeatherSchema = z.infer<typeof weatherSchema>;
export type RecommendationRequestSchema = z.infer<typeof recommendationRequestSchema>;
export type FoodDetailsRequestSchema = z.infer<typeof foodDetailsRequestSchema>;
export type WeatherQuerySchema = z.infer<typeof weatherQuerySchema>;
export type GeocodeQuerySchema = z.infer<typeof geocodeQuerySchema>;
export type FoodComparisonRequestSchema = z.infer<typeof foodComparisonRequestSchema>;