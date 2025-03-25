'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getUserLocation, getLocationFromCoordinates } from '@/services/location';
import { Location } from '@/types';
import { Loader2 } from 'lucide-react';

interface GeolocationButtonProps {
  isLoading: boolean;
  onLocationSelected: (location: Location) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onError: (error: string) => void;
}

export function GeolocationButton({ 
  isLoading, 
  onLocationSelected, 
  onLoadingChange,
  onError 
}: GeolocationButtonProps) {
  const t = useTranslations('location');

  const handleGetUserLocation = async() => {
    onLoadingChange(true);
    onError('');
    
    getUserLocation(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await getLocationFromCoordinates(latitude, longitude);
          onLocationSelected(locationData);
        } catch (err) {
          console.error('Failed to get location details:', err);
          onError(t('error'));
        } finally {
          onLoadingChange(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        onError(t('geolocation_error'));
        onLoadingChange(false);
      }
    );
  };

  return (
    <Button
      variant="outline"
      onClick={handleGetUserLocation}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('detecting')}
        </>
      ) : (
        t('use_current_location')
      )}
    </Button>
  );
}