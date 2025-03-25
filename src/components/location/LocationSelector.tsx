'use client';

import { useState, useEffect } from 'react';
import { Location } from '@/types';
import { useFeatureFlags } from '@/components/EnvProvider';
import { getIpBasedLocation } from '@/services/location';
import { CurrentLocationDisplay } from './CurrentLocationDisplay';
import { ManualLocationInput } from './ManualLocationInput';
import { GeolocationButton } from './GeolocationButton';

interface LocationSelectorProps {
  onLocationSelected: (location: Location) => void;
}

export function LocationSelector({ onLocationSelected }: LocationSelectorProps) {
  const features = useFeatureFlags();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const handleLocationSelected = (location: Location) => {
    setCurrentLocation(location);
    onLocationSelected(location);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  useEffect(() => {
    if (features.ipGeolocation) {
      const getIpLocation = async () => {
        try {
          setIsLoading(true);
          const locationData = await getIpBasedLocation();
          setCurrentLocation(locationData);
          onLocationSelected(locationData);
        } catch (err) {
          console.error('Failed to get IP location:', err);
        } finally {
          setIsLoading(false);
        }
      };
      
      getIpLocation();
    }
    
    return () => {};
  }, [features.ipGeolocation, onLocationSelected]);

  return (
    <div className="space-y-4">
      {/* Current location display */}
      <CurrentLocationDisplay currentLocation={currentLocation} />

      {/* Error message */}
      {error && (
        <div className="text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Manual location input */}
      {features.manualLocation && (
        <ManualLocationInput 
          isLoading={isLoading} 
          onLocationSelected={handleLocationSelected} 
          onError={handleError} 
        />
      )}

      {/* Geolocation button */}
      <GeolocationButton 
        isLoading={isLoading} 
        onLocationSelected={handleLocationSelected} 
        onLoadingChange={handleLoadingChange} 
        onError={handleError} 
      />
    </div>
  );
}