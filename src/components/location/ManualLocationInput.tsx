'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLocationFromString } from '@/services/location';
import { Location } from '@/types';

interface ManualLocationInputProps {
  isLoading: boolean;
  onLocationSelected: (location: Location) => void;
  onError: (error: string) => void;
}

export function ManualLocationInput({ isLoading, onLocationSelected, onError }: ManualLocationInputProps) {
  const t = useTranslations('location');
  const [locationInput, setLocationInput] = useState<string>('');

  const handleLocationSearch = async () => {
    if (!locationInput.trim()) {
      onError(t('empty_input'));
      return;
    }

    try {
      const locationData = await getLocationFromString(locationInput);
      onLocationSelected(locationData);
    } catch (err) {
      console.error('Failed to geocode location:', err);
      onError(t('geocode_error'));
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder={t('search_placeholder')}
        value={locationInput}
        onChange={(e) => setLocationInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
        disabled={isLoading}
      />
      <Button 
        onClick={handleLocationSearch} 
        disabled={isLoading}
      >
        {t('search')}
      </Button>
    </div>
  );
}