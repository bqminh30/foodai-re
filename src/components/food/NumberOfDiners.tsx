'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';

interface NumberOfDinersProps {
  numberOfDiners: number;
  onNumberOfDinersChange: (numberOfDiners: number) => void;
}

export function NumberOfDiners({
  numberOfDiners,
  onNumberOfDinersChange
}: NumberOfDinersProps) {
  const t = useTranslations();
  
  return (
    <div className="space-y-2">
      <h3 className="text-md font-medium">{t('food.settings.diners.title')}</h3>
      <p className="text-sm text-muted-foreground">{t('food.settings.diners.description')}</p>
      <div className="flex items-center gap-2 mt-2">
        <Input
          id="numberOfDiners"
          type="number"
          min="1"
          max="20"
          value={numberOfDiners}
          onChange={(e) => onNumberOfDinersChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">
          {numberOfDiners > 1 ? t('food.people') : t('food.person')}
        </span>
      </div>
    </div>
  );
}