'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Weather } from '@/types';
import { fetchWeatherData } from '@/services/weather';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import { CurrentWeather } from '@/components/weather/CurrentWeather';
import { HourlyForecast } from '@/components/weather/HourlyForecast';

interface WeatherDisplayProps {
  latitude?: number;
  longitude?: number;
  onWeatherLoaded?: (weather: Weather) => void;
}

export function WeatherDisplay({ latitude, longitude, onWeatherLoaded }: WeatherDisplayProps) {
  const t = useTranslations('weather');
  const locale = useLocale();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWeatherData() {
      if (!latitude || !longitude) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchWeatherData(latitude, longitude, locale);
        setWeather(data);
        
        // Notify parent component if callback is provided
        if (onWeatherLoaded) {
          onWeatherLoaded(data);
        }
      } catch (err) {
        setError(t('error'));
        console.error('Failed to fetch weather:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadWeatherData();
  }, [latitude, longitude, locale, onWeatherLoaded, t]);

  const handleRetry = () => {
    if (latitude && longitude) {
      setIsLoading(true);
      setError(null);
      fetchWeatherData(latitude, longitude, locale)
        .then(data => {
          setWeather(data);
          if (onWeatherLoaded) onWeatherLoaded(data);
        })
        .catch(err => {
          setError(t('error'));
          console.error('Failed to fetch weather:', err);
        })
        .finally(() => setIsLoading(false));
    }
  };

  if (isLoading) {
    return <LoadingSpinner namespace="weather" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} namespace="weather" />;
  }

  if (!weather) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">{t('no_data')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <CurrentWeather weather={weather} />
      {weather.hourlyForecast && <HourlyForecast forecast={weather.hourlyForecast} />}
    </div>
  );
}