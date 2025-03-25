'use client';

import { useTranslations } from 'next-intl';
import { Location } from '@/types';

interface CurrentLocationDisplayProps {
  currentLocation: Location | null;
}

export function CurrentLocationDisplay({ currentLocation }: CurrentLocationDisplayProps) {
  const t = useTranslations('location');

  if (!currentLocation) return null;

  return (
    <div className="bg-muted p-3 rounded-md">
      <p className="font-medium">{t('current_location')}:</p>
      <p>{currentLocation.city || ''}{currentLocation.city && currentLocation.region ? ', ' : ''}{currentLocation.region || ''}</p>
      <p className="text-xs text-muted-foreground">
        {t('coordinates')}: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
      </p>
    </div>
  );
}