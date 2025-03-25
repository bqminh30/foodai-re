import { NextResponse } from 'next/server';
import { geocodeLocation, reverseGeocode } from '@/services/geocode';
import { ApiErrorResponse } from '@/types';
import { geocodeQuerySchema, weatherQuerySchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (lat && lon) {
    const queryParams = {
      lat,
      lon
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
      const geocodeData = await reverseGeocode(latitude, longitude);
      return NextResponse.json(geocodeData);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return NextResponse.json(
        { error: 'Failed to reverse geocode coordinates' } as ApiErrorResponse,
        { status: 500 }
      );
    }
  }
  
  const queryParams = {
    q: searchParams.get('q')
  };
  
  const validationResult = geocodeQuerySchema.safeParse(queryParams);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid query parameters', 
        details: validationResult.error.format() 
      } as ApiErrorResponse,
      { status: 400 }
    );
  }
  
  const location = validationResult.data.q;
  
  try {
    const geocodeData = await geocodeLocation(location);
    return NextResponse.json(geocodeData);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode location' } as ApiErrorResponse,
      { status: 500 }
    );
  }
}