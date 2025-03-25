'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';

interface MealTypeSelectorProps {
  mealType: string;
  onMealTypeChange: (mealType: string) => void;
}

export function MealTypeSelector({
  mealType,
  onMealTypeChange
}: MealTypeSelectorProps) {
  const t = useTranslations();
  
  return (
    <div className="space-y-2">
      <h3 className="text-md font-medium">{t('food.settings.meal_type.title')}</h3>
      <p className="text-sm text-muted-foreground">{t('food.settings.meal_type.description')}</p>
      <div className="flex flex-col space-y-2 mt-2">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="single-dish"
            name="meal-type"
            value="single"
            checked={mealType === 'single'}
            onChange={() => onMealTypeChange('single')}
            className="h-4 w-4"
          />
          <Label htmlFor="single-dish">
            {t('food.settings.meal_type.single_dish')}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="full-set"
            name="meal-type"
            value="full"
            checked={mealType === 'full'}
            onChange={() => onMealTypeChange('full')}
            className="h-4 w-4"
          />
          <Label htmlFor="full-set">
            {t('food.settings.meal_type.full_set')}
          </Label>
        </div>
      </div>
    </div>
  );
}