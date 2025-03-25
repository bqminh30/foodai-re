'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FoodInfo, Location } from '@/types';
import { useFeatureFlags } from '@/components/EnvProvider';
import { useRecaptchaToken } from '@/services/recaptcha';

interface FoodDetailsProps {
  foodName: string;
  onBack: () => void;
  location?: Location;
}

export function FoodDetails({ foodName, onBack }: FoodDetailsProps) {
  const t = useTranslations('food.details');
  const locale = useLocale();
  const features = useFeatureFlags();
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { executeRecaptcha } = useRecaptchaToken({
    action: 'getFoodDetails',
  });

  useEffect(() => {
    const fetchFoodDetails = async () => {
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
        
        const requestBody: {name: string, locale: string, recaptchaToken?: string} = {
          name: foodName,
          locale,
        };
        
        if (features.recaptcha && recaptchaToken) {
          requestBody.recaptchaToken = recaptchaToken;
        }
        
        const response = await fetch('/api/food-details', {
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
        setFoodInfo(data);
      } catch (err) {
        console.error('Failed to fetch food details:', err);
        const errorMessage = err instanceof Error ? err.message : t('error');
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFoodDetails();
  }, [foodName, t, locale, features.recaptcha, executeRecaptcha]);

  if (isLoading) {
    return <LoadingSpinner namespace="food.details" />;
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onBack}>
          {t('back')}
        </Button>
      </div>
    );
  }

  if (!foodInfo) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">{t('noInfo')}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onBack}>
          {t('back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-md space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold">{foodInfo.name}</h3>
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t('back')}
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <h4 className="font-medium">{t('description')}</h4>
          <p className="text-sm">{foodInfo.description}</p>
        </div>
        
        <div>
          <h4 className="font-medium">{t('ingredients')}</h4>
          <ul className="list-disc list-inside text-sm">
            {foodInfo.ingredients.map((ingredient: string, index: number) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-medium">{t('preparation')}</h4>
          <p className="text-sm">{foodInfo.preparation}</p>
        </div>
      </div>
    </div>
  );
}