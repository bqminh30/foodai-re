'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Weather } from '@/types';
import { getWeatherIcon } from '@/services/weather';

interface HourlyForecastProps {
  forecast: Weather['hourlyForecast'];
}

export function HourlyForecast({ forecast }: HourlyForecastProps) {
  const t = useTranslations('weather');
  const locale = useLocale();
  
  if (!forecast || forecast.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">{t('hourly_forecast')}</h4>
      <div className="grid grid-cols-6 gap-2 overflow-x-auto">
        {forecast.map((hour, index) => (
          <div key={index} className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
            <span className="text-xs">{new Date(hour.time).toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'})}</span>
            
            <div className="flex flex-col items-center">
              <span className="text-lg">{getWeatherIcon(hour.weatherCode)}</span>
              {/* <span className="text-xs text-muted-foreground">{hour.conditionText}</span> */}
            </div>
            <span className="text-medium font-medium">{hour.temperature}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
}