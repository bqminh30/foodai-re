/**
 * Geocode service for handling location-related operations
 */
import { Location } from '@/types';
import { generateCacheKey, getCache, setCache, NAMESPACE } from '@/services/caching';
import { isFeatureEnabled } from '@/lib/features';

/**
 * Interface for geocoding response
 */
export interface GeocodeResponse extends Location {
  displayName: string;
}

/**
 * Geocodes a location string to coordinates
 * @param locationString - The location string to geocode
 * @returns The geocoded location
 */
export async function geocodeLocation(locationString: string): Promise<GeocodeResponse> {
  // Function to fetch geocoding data
  const fetchGeocodingData = async (): Promise<GeocodeResponse> => {
    // Use Nominatim for geocoding (OpenStreetMap's geocoding service)
    const encodedLocation = encodeURIComponent(locationString);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'Food Recommendation App'  // Required by Nominatim's terms of use
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service error');
    }
    
    const data = await response.json();
    
    // Check if we got any results
    if (!data || data.length === 0 || !data[0].lat || !data[0].lon) {
      throw new Error('Location not found');
    }
    
    // Return the first result
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      city: data[0].address?.city || data[0].address?.town || data[0].address?.village || '',
      region: data[0].address?.state || data[0].address?.county || '',
      country: data[0].address?.country || '',
      displayName: data[0].display_name
    };
  };
  
  // Check if caching is enabled
  if (isFeatureEnabled('enableCaching')) {
    // Create a cache key based on the location string
    const cacheKey = generateCacheKey(NAMESPACE.GEOLOCATION, [locationString.toLowerCase().trim()]);
    
    // Check if we have cached data
    const cachedData = await getCache<GeocodeResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch data and cache it
    const result = await fetchGeocodingData();
    
    // Cache the result for 1 hour (3600 seconds)
    await setCache(cacheKey, result, 3600);
    
    return result;
  } else {
    // If caching is disabled, directly fetch the data
    return fetchGeocodingData();
  }
}

/**
 * Gets reverse geocoding information from coordinates
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns The geocoded location information
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResponse> {
  // Function to fetch reverse geocoding data
  const fetchReverseGeocodingData = async (): Promise<GeocodeResponse> => {
    // Use Nominatim for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      {
        headers: {
          'User-Agent': 'Food Recommendation App'  // Required by Nominatim's terms of use
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding service error');
    }
    
    const data = await response.json();
    
    if (!data || !data.lat || !data.lon) {
      throw new Error('Location information not found');
    }
    
    // Extract and format the result
    return {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      city: data.address?.city || data.address?.town || data.address?.village || '',
      region: data.address?.state || data.address?.county || '',
      country: data.address?.country || '',
      displayName: data.display_name
    };
  };
  
  // Check if caching is enabled
  if (isFeatureEnabled('enableCaching')) {
    // Round coordinates to 3 decimal places for better cache hits
    const roundedLat = latitude.toFixed(3);
    const roundedLon = longitude.toFixed(3);
    
    // Create a cache key based on the coordinates
    const cacheKey = generateCacheKey(NAMESPACE.GEOLOCATION, [`rev:${roundedLat},${roundedLon}`]);
    
    // Check if we have cached data
    const cachedData = await getCache<GeocodeResponse>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch data and cache it
    const result = await fetchReverseGeocodingData();
    
    // Cache the result for 1 hour (3600 seconds)
    await setCache(cacheKey, result, 3600);
    
    return result;
  } else {
    // If caching is disabled, directly fetch the data
    return fetchReverseGeocodingData();
  }
}

/**
 * Gets the user's location based on their IP address
 * @returns The user's location
 */
export async function getLocationFromIp(): Promise<Location> {
  // Function to fetch IP-based location data
  const fetchIpLocationData = async (): Promise<Location> => {
    // Using ipapi.co to get location from IP
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'User-Agent': 'Food Recommendation App'
      }
    });
    
    if (!response.ok) {
      throw new Error('IP Geolocation service error');
    }
    
    const data = await response.json();
    
    if (!data || !data.latitude || !data.longitude) {
      throw new Error('Could not determine location from IP');
    }
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      region: data.region,
      country: data.country_name
    };
  };
  
  // Check if caching is enabled
  if (isFeatureEnabled('enableCaching')) {
    // Create a cache key for IP-based geolocation
    const cacheKey = generateCacheKey(NAMESPACE.GEOLOCATION, ['ip_geolocation']);
    
    // Check if we have cached data
    const cachedData = await getCache<Location>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch data and cache it
    const result = await fetchIpLocationData();
    
    // Cache the result for 1 hour (3600 seconds)
    await setCache(cacheKey, result, 3600);
    
    return result;
  } else {
    // If caching is disabled, directly fetch the data
    return fetchIpLocationData();
  }
}