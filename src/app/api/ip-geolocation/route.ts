import { NextResponse } from 'next/server';
import { getLocationFromIp } from '@/services/geocode';
import { ApiErrorResponse } from '@/types';
import { isFeatureEnabled } from '@/lib/features';

export async function GET() {
  try {
    if(!isFeatureEnabled('ipGeolocation')){
      return NextResponse.json(
        { error: 'IP geolocation feature is disabled' } as ApiErrorResponse,
        { status: 403 }
      ); 
    }
    const locationData = await getLocationFromIp();
    return NextResponse.json(locationData);
  } catch (error) {
    console.error('IP Geolocation error:', error);
    return NextResponse.json(
      { error: 'Failed to get location from IP address' } as ApiErrorResponse,
      { status: 500 }
    );
  }
}