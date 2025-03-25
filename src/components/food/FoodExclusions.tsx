'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FoodExclusionsProps {
  excludedFoods: string[];
  onExclusionChange: (excludedFoods: string[]) => void;
}

export function FoodExclusions({ excludedFoods, onExclusionChange }: FoodExclusionsProps) {
  const t = useTranslations('food.exclusions');
  const [newExclusion, setNewExclusion] = useState<string>('');

  const handleAddExclusion = () => {
    if (!newExclusion.trim()) return;
    
    if (!excludedFoods.includes(newExclusion.trim())) {
      const updatedExclusions = [...excludedFoods, newExclusion.trim()];
      onExclusionChange(updatedExclusions);
    }
    
    setNewExclusion('');
  };

  const handleRemoveExclusion = (food: string) => {
    const updatedExclusions = excludedFoods.filter(item => item !== food);
    onExclusionChange(updatedExclusions);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={t('placeholder')}
          value={newExclusion}
          onChange={(e) => setNewExclusion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddExclusion()}
        />
        <Button onClick={handleAddExclusion}>
          {t('add')}
        </Button>
      </div>
      
      {excludedFoods.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {excludedFoods.map((food) => (
            <div 
              key={food} 
              className="bg-muted px-3 py-1 rounded-full flex items-center gap-1 text-sm"
            >
              <span>{food}</span>
              <button 
                onClick={() => handleRemoveExclusion(food)}
                className="text-muted-foreground hover:text-destructive ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      )}
    </div>
  );
}