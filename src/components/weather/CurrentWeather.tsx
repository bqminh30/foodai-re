'use client';

import { useTranslations } from 'next-intl';
import { Weather } from '@/types';
import { getWeatherIcon } from '@/services/weather';

interface CurrentWeatherProps {
  weather: Weather;
}

export function CurrentWeather({ weather }: CurrentWeatherProps) {
  const t = useTranslations('weather');
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium">{weather.location}</h3>
        <p className="text-3xl font-bold">{weather.temperature}°C</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{weather.conditionText}</span>
        </div>
        {weather.humidity !== undefined && (
          <p className="text-sm text-muted-foreground">{t('humidity')}: {weather.humidity}%</p>
        )}
        {weather.uvIndex !== undefined && (
          <p className="text-sm text-muted-foreground">{t('uv_index')}: {weather.uvIndex}</p>
        )}
      </div>
      <div className="text-4xl">
        {getWeatherIcon(parseInt(weather.condition))}
      </div>
    </div>
  );
}