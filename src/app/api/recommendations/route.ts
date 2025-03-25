import { NextRequest, NextResponse } from 'next/server';
import { getFoodRecommendations } from '@/services/food';
import { ApiErrorResponse, FoodRecommendation } from '@/types';
import { isFeatureEnabled } from '@/lib/features';
import { recommendationRequestSchema } from '@/lib/validations';
import { verifyRecaptchaToken } from '@/services/recaptcha';

export async function POST(request: NextRequest) {
  try {
    // Check if food recommendations feature is enabled
    if (!isFeatureEnabled('foodRecommendations')) {
      return NextResponse.json(
        { error: 'Food recommendations feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      );
    }

    const requestBody = await request.json();
    
    // Check reCAPTCHA feature status directly from environment variables
    const recaptchaEnabled = process.env.NEXT_PUBLIC_FEATURE_RECAPTCHA !== 'false';
    
    // Simply use the basic schema with optional recaptchaToken field
    const validationResult = recommendationRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        } as ApiErrorResponse,
        { status: 400 }
      );
    }
    
    const { 
      weather, 
      excludedFoods, 
      locale, 
      numberOfDiners, 
      mealType, 
      specialRequirements,
      recaptchaToken 
    } = validationResult.data;

    const useWeatherForRecommendations = isFeatureEnabled('useWeatherForRecommendations');
    
    if (useWeatherForRecommendations && (!weather || !weather.temperature || !weather.condition)) {
      return NextResponse.json(
        { error: 'Weather data is required for food recommendations' } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Only verify reCAPTCHA if feature is enabled AND we're not running in development
    if (recaptchaEnabled) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification required' } as ApiErrorResponse,
          { status: 400 }
        );
      }

      const verification = await verifyRecaptchaToken(
        recaptchaToken,
        'getRecommendations',
        0.5 // minimum score threshold
      );

      if (!verification.success) {
        console.error('reCAPTCHA verification failed:', verification.errorCodes);
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed', details: verification } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Optional: Log the score for analysis
      console.info(`reCAPTCHA score for recommendations: ${verification.score}`);
    }

    // Check if excluded foods are provided but the feature is disabled
    if (excludedFoods && excludedFoods.length > 0 && !isFeatureEnabled('foodExclusions')) {
      return NextResponse.json(
        { error: 'Food exclusions feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      );
    }
    
    // Check if number of diners is provided but the feature is disabled
    if (numberOfDiners && numberOfDiners > 1 && !isFeatureEnabled('numberOfDiners')) {
      return NextResponse.json(
        { error: 'Number of diners feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      );
    }
    
    // Check if meal type is provided but the feature is disabled
    if (validationResult.data.mealType && !isFeatureEnabled('mealTypeSelection')) {
      return NextResponse.json(
        { error: 'Meal type selection feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      );
    }
    
    // Check if special requirements are provided but the feature is disabled
    if (specialRequirements && specialRequirements.trim() && (!isFeatureEnabled('extendedSettings') || !isFeatureEnabled('specialRequirements'))) {
      return NextResponse.json(
        { error: 'Special requirements feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      );
    }

    const recommendations: FoodRecommendation = await getFoodRecommendations(
      weather || null, 
      excludedFoods, 
      locale, 
      numberOfDiners, 
      mealType, 
      specialRequirements
    );
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Recommendation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate food recommendations' },
      { status: 500 }
    );
  }
}