/**
 * Location service for handling browser-based location operations
 */
import { Location } from '@/types';

/**
 * Gets the user's current location using the browser's geolocation API
 * @param onSuccess - Callback function when location is successfully retrieved
 * @param onError - Callback function when an error occurs
 * @param options - Geolocation options
 */
export async function getUserLocation(
  onSuccess: (location: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void,
  options: PositionOptions = { enableHighAccuracy: true, timeout: 100000, maximumAge: 0 }
): Promise<number> {
  if (!navigator.geolocation) {
    onError({
      code: 1,
      message: 'Geolocation not supported',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    } as GeolocationPositionError);
    return 0;
  }

  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  return 0;
}

/**
 * Gets location details from coordinates using the geocode API
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns The location data
 */
export async function getLocationFromCoordinates(latitude: number, longitude: number): Promise<Location> {
  const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Gets location details from a location string using the geocode API
 * @param locationString - The location string to search for
 * @returns The location data
 */
export async function getLocationFromString(locationString: string): Promise<Location> {
  if (!locationString.trim()) {
    throw new Error('Empty location input');
  }

  const response = await fetch(`/api/geocode?q=${encodeURIComponent(locationString)}`);
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Gets location based on IP address
 * @returns The location data based on IP
 */
export async function getIpBasedLocation(): Promise<Location> {
  const response = await fetch('/api/ip-geolocation');
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return await response.json();
}