import { NextRequest, NextResponse } from 'next/server';
import { getWeatherData } from '@/services/weather';
import { ApiErrorResponse, Weather } from '@/types';
import { weatherQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const queryParams = {
    lat: searchParams.get('lat'),
    lon: searchParams.get('lon'),
    locale: searchParams.get('locale')
  };
  
  const validationResult = weatherQuerySchema.safeParse(queryParams);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid query parameters', 
        details: validationResult.error.format() 
      } as ApiErrorResponse,
      { status: 400 }
    );
  }
  
  try {
    const latitude = parseFloat(validationResult.data.lat);
    const longitude = parseFloat(validationResult.data.lon);
    const locale = validationResult.data.locale || 'en';
    
    const weatherData: Weather = await getWeatherData(latitude, longitude, locale);
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' } as ApiErrorResponse,
      { status: 500 }
    );
  }
}