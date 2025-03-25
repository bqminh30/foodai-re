'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useFeatureFlags } from '@/components/EnvProvider';
import { FoodExclusions } from '@/components/food/FoodExclusions';
import { NumberOfDiners } from '@/components/food/NumberOfDiners';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MealTypeSelector } from './MealTypeSelector';
import { SpecialRequirements } from './SpecialRequirements';

interface ExtendedSettingsProps {
  excludedFoods: string[];
  onExclusionChange: (excludedFoods: string[]) => void;
  numberOfDiners: number;
  onNumberOfDinersChange: (numberOfDiners: number) => void;
  mealType?: string;
  onMealTypeChange?: (mealType: string) => void;
  specialRequirements?: string;
  onSpecialRequirementsChange?: (specialRequirements: string) => void;
  settingsChanged?: boolean;
  onUpdateRecommendations?: () => void;
}

export function ExtendedSettings({ 
  excludedFoods, 
  onExclusionChange, 
  numberOfDiners, 
  onNumberOfDinersChange,
  mealType = 'single',
  onMealTypeChange,
  specialRequirements = '',
  onSpecialRequirementsChange,
  settingsChanged = false,
  onUpdateRecommendations
}: ExtendedSettingsProps) {
  const t = useTranslations();
  const features = useFeatureFlags();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Store initial values to compare against current values
  const initialValuesRef = useRef({
    excludedFoods: [...excludedFoods],
    numberOfDiners,
    mealType,
    specialRequirements
  });
  
  // Determine if current settings differ from initial settings
  const [hasRealChanges, setHasRealChanges] = useState(false);
  
  useEffect(() => {
    // Update initial values ref when recommendations are refreshed (settingsChanged becomes false)
    if (!settingsChanged) {
      initialValuesRef.current = {
        excludedFoods: [...excludedFoods],
        numberOfDiners,
        mealType,
        specialRequirements
      };
      setHasRealChanges(false);
      return;
    }
    
    // Check if current values differ from initial values
    const excludedFoodsChanged = 
      initialValuesRef.current.excludedFoods.length !== excludedFoods.length ||
      !initialValuesRef.current.excludedFoods.every(food => excludedFoods.includes(food));
    
    const dinersChanged = initialValuesRef.current.numberOfDiners !== numberOfDiners;
    const mealTypeChanged = initialValuesRef.current.mealType !== mealType;
    const requirementsChanged = initialValuesRef.current.specialRequirements !== specialRequirements;
    
    const anyValueChanged = excludedFoodsChanged || dinersChanged || mealTypeChanged || requirementsChanged;
    
    setHasRealChanges(anyValueChanged);
    // Remove any automatic updates - user must click the button
  }, [excludedFoods, numberOfDiners, mealType, specialRequirements, settingsChanged]);
  
  // Check if any extended settings are enabled
  const hasExtendedSettings = features.numberOfDiners || 
    (features.mealTypeSelection && onMealTypeChange !== undefined) || 
    (features.specialRequirements && onSpecialRequirementsChange !== undefined);
  
  return (
    <Card className="bg-card rounded-lg p-4 shadow-sm">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-semibold">{t('food.settings.title')}</CardTitle>
        <CardDescription>{t('food.settings.description')}</CardDescription>
        
        {/* Update Recommendations button - Only shown when actual values differ from initial values */}
        {hasRealChanges && settingsChanged && onUpdateRecommendations && (
          <div className="mt-2">
            <div className="text-sm text-amber-600 dark:text-amber-400 mb-1 animate-pulse">
              <span className="inline-block mr-1">⚠️</span>
              {t('food.settings.changes_pending') || 'Settings changed. Update your recommendations?'}
            </div>
            <Button 
              variant="default" 
              className="w-full"
              onClick={onUpdateRecommendations}
            >
              {t('food.settings.update_recommendations') || 'Update Recommendations'}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Food exclusions section */}
        <div className="space-y-2">
          <h3 className="text-md font-medium">{t('food.exclusions.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('food.exclusions.description')}</p>
          <div className="mt-2">
            <FoodExclusions 
              excludedFoods={excludedFoods} 
              onExclusionChange={onExclusionChange} 
            />
          </div>
        </div>
        
        {/* Advanced settings toggle button */}
        {hasExtendedSettings && (
          <div className="pt-2">
            <Button 
              variant="ghost" 
              className="w-full justify-between text-sm font-medium text-muted-foreground hover:text-foreground" 
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <span>{t('food.settings.advanced') || 'More customization options'}</span>
              {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        )}
        
        {/* Advanced settings */}
        {showAdvancedSettings && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {features.numberOfDiners && (
              <NumberOfDiners
                numberOfDiners={numberOfDiners}
                onNumberOfDinersChange={onNumberOfDinersChange}
              />
            )}
            
            {features.mealTypeSelection && onMealTypeChange && (
              <MealTypeSelector
                mealType={mealType}
                onMealTypeChange={onMealTypeChange}
              />
            )}
            
            {features.specialRequirements && onSpecialRequirementsChange && (
              <SpecialRequirements
                specialRequirements={specialRequirements}
                onSpecialRequirementsChange={onSpecialRequirementsChange}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}