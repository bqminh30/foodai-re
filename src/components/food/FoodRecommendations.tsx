'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Weather, FoodRecommendation, Location } from '@/types';
import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/components/EnvProvider';
import { FoodDetails } from '@/components/food/FoodDetails';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecaptchaToken } from '@/services/recaptcha';

interface FoodRecommendationsProps {
  weather: Weather | null;
  excludedFoods?: string[];
  defaultNumberOfDiners?: number;
  defaultMealType?: string;
  specialRequirements?: string;
  location?: Location;
  onRecommendationsLoaded?: () => void;
}

export function FoodRecommendations({ weather, excludedFoods = [], defaultNumberOfDiners = 1, defaultMealType = 'single', specialRequirements = '', location, onRecommendationsLoaded }: FoodRecommendationsProps) {
  const t = useTranslations('food');
  const features = useFeatureFlags();
  const locale = useLocale();
  const [recommendations, setRecommendations] = useState<FoodRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [localNumberOfDiners, setLocalNumberOfDiners] = useState<number>(defaultNumberOfDiners);
  const [localMealType] = useState<string>(defaultMealType);
  const numberOfDiners = features.extendedSettings ? defaultNumberOfDiners : localNumberOfDiners;
  const mealType = features.extendedSettings ? defaultMealType : localMealType;
  
  // Store settings at initialization (Component mount / key change)
  const initialSettings = useRef({
    excludedFoods: [...excludedFoods],
    numberOfDiners,
    mealType,
    specialRequirements
  });
  
  // Don't need separate refs for each setting since we're preserving them all
  const { executeRecaptcha } = useRecaptchaToken({
    action: 'getRecommendations',
  });

  const fetchRecommendations = useCallback(async () => {
    // If weather is required but not provided, return early
    if (features.useWeatherForRecommendations && !weather) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let recaptchaToken = null;
      if (features.recaptcha) {
        try {
          recaptchaToken = await executeRecaptcha();
          if (!recaptchaToken) {
            console.warn('Failed to get reCAPTCHA token');
          }
        } catch (err) {
          console.error('reCAPTCHA execution failed:', err);
        }
      }
      
      // Use initial settings captured at component mount
      const requestBody: {
        weather?: Weather;
        excludedFoods?: string[];
        locale: string;
        numberOfDiners?: number;
        mealType?: string;
        specialRequirements?: string;
        recaptchaToken?: string;
      } = {
        locale,
        excludedFoods: features.foodExclusions ? initialSettings.current.excludedFoods : undefined,
        numberOfDiners: features.numberOfDiners && initialSettings.current.numberOfDiners > 1 ? initialSettings.current.numberOfDiners : undefined,
        mealType: features.mealTypeSelection ? initialSettings.current.mealType : undefined,
        specialRequirements: initialSettings.current.specialRequirements.trim() ? initialSettings.current.specialRequirements : undefined,
      };
      
      // Only include weather data if the feature is enabled and we have weather data
      if (features.useWeatherForRecommendations && weather) {
        requestBody.weather = weather;
      }
      
      if (features.recaptcha && recaptchaToken) {
        requestBody.recaptchaToken = recaptchaToken;
      }
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setRecommendations(data);
      
      // Notify parent that recommendations are loaded
      if (onRecommendationsLoaded) {
        onRecommendationsLoaded();
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      const errorMessage = err instanceof Error ? err.message : t('error');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [weather, features, locale, executeRecaptcha, t, onRecommendationsLoaded]);

  // Add a ref to track the previous weather for comparison
  const prevWeatherRef = useRef<Weather | null>(null);

  useEffect(() => {
    // When useWeatherForRecommendations is off, we should fetch recommendations on mount
    if (!features.useWeatherForRecommendations && !recommendations && !isLoading) {
      fetchRecommendations();
      return;
    }
    
    // Handle the case when useWeatherForRecommendations is on
    if (features.useWeatherForRecommendations) {
      // Only fetch if weather has changed
      const weatherChanged = weather && (!prevWeatherRef.current || 
        prevWeatherRef.current.temperature !== weather.temperature ||
        prevWeatherRef.current.condition !== weather.condition);
      
      if (weatherChanged) {
        fetchRecommendations();
        // Update the previous weather reference
        prevWeatherRef.current = { ...weather };
      } else if (!weather) {
        // If weather is required but not available, clear recommendations
        setRecommendations(null);
      }
    }
    
    setSelectedFood(null);
  }, [weather, fetchRecommendations, features.useWeatherForRecommendations, recommendations, isLoading]);

  const handleFoodSelect = (food: string) => {
    if (features.foodDetails) {
      setSelectedFood(food);
    }
  };

  if (isLoading) {
    return <LoadingSpinner namespace="food" />;
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-destructive">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={fetchRecommendations}
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (!weather) {
    // If weather is required but not available, show message
    if (features.useWeatherForRecommendations) {
      return (
        <div className="text-center p-4">
          <p className="text-muted-foreground">{t('no_weather')}</p>
        </div>
      );
    }
    // If weather is not required (feature is off), we should show recommendations or loading state
    if (isLoading) {
      return <LoadingSpinner namespace="food" />;
    }
    
    // Show recommendations if we have them
    if (recommendations) {
      return (
        <div className="space-y-4">
          {features.numberOfDiners && !features.extendedSettings && (
            <div className="mb-4">
              <Label htmlFor="numberOfDiners" className="mb-2 block">
                {t('number_of_diners')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="numberOfDiners"
                  type="number"
                  min="1"
                  max="20"
                  value={localNumberOfDiners}
                  onChange={(e) => setLocalNumberOfDiners(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  {localNumberOfDiners > 1 ? t('people') : t('person')}
                </span>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">{recommendations.reasoning}</p>
          
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recommendations.foods.map((food) => (
              <li key={food}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => handleFoodSelect(food)}
                >
                  {food}
                </Button>
              </li>
            ))}
          </ul>

          {selectedFood && features.foodDetails && (
            <div className="mt-4">
              <FoodDetails foodName={selectedFood} onBack={() => setSelectedFood(null)} location={location} />
            </div>
          )}
        </div>
      );
    }
    
    // Otherwise show loading/no recommendations message
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">{!recommendations ? t('no_recommendations') : t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {features.numberOfDiners && !features.extendedSettings && (
        <div className="mb-4">
          <Label htmlFor="numberOfDiners" className="mb-2 block">
            {t('number_of_diners')}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="numberOfDiners"
              type="number"
              min="1"
              max="20"
              value={localNumberOfDiners}
              onChange={(e) => setLocalNumberOfDiners(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              {localNumberOfDiners > 1 ? t('people') : t('person')}
            </span>
          </div>
        </div>
      )}
      
      {!recommendations ? (
        <div className="text-center p-4">
          <p className="text-muted-foreground">{t('no_recommendations')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{recommendations.reasoning}</p>
          
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recommendations.foods.map((food) => (
              <li key={food}>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => handleFoodSelect(food)}
                >
                  {food}
                </Button>
              </li>
            ))}
          </ul>

          {selectedFood && features.foodDetails && (
            <div className="mt-4">
              <FoodDetails foodName={selectedFood} onBack={() => setSelectedFood(null)} location={location} />
            </div>
          )}
        </>
      )}
    </div>
  );
}