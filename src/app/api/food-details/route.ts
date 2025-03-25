import { NextRequest, NextResponse } from 'next/server';
import { ApiErrorResponse, FoodInfo } from '@/types';
import { getFoodDetails } from '@/services/food';
import { isFeatureEnabled } from '@/lib/features';
import { foodDetailsRequestSchema } from '@/lib/validations';
import { verifyRecaptchaToken } from '@/services/recaptcha';

async function handleFoodDetailsRequest(foodName: string | null, locale: string | null, recaptchaToken: string | null) {
  try {
    if (!isFeatureEnabled('foodDetails')) {
      return NextResponse.json(
        { error: 'Food details feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      );
    }

    if (!isFeatureEnabled('recaptcha') && process.env.NODE_ENV !== 'development') {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification required' } as ApiErrorResponse,
          { status: 400 }
        );
      }

      const verification = await verifyRecaptchaToken(
        recaptchaToken,
        'getFoodDetails',
        0.5 // minimum score threshold
      );

      if (!verification.success) {
        console.error('reCAPTCHA verification failed:', verification.errorCodes);
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed', details: verification } as ApiErrorResponse,
          { status: 400 }
        );
      }

    }

    if (!foodName) {
      return NextResponse.json(
        { error: 'Food name is required' } as ApiErrorResponse,
        { status: 400 }
      );
    }

    const userLocale = locale || "vi";

    const foodInfo: FoodInfo = await getFoodDetails(foodName, userLocale);
    return NextResponse.json(foodInfo);
  } catch (error) {
    console.error('Food details API error:', error);
    return NextResponse.json(
      { error: 'Failed to get food details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    const validationResult = foodDetailsRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.format() 
        } as ApiErrorResponse,
        { status: 400 }
      );
    }
    
    const { name: foodName, locale, recaptchaToken } = validationResult.data;
    
    return handleFoodDetailsRequest(foodName, locale || null, recaptchaToken || null);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' } as ApiErrorResponse,
      { status: 400 }
    );
  }
}