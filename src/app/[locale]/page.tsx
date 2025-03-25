'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFeatureFlags } from '@/components/EnvProvider';
import { Location, Weather } from '@/types';
import { WeatherDisplay } from '@/components/weather/WeatherDisplay';
import { LocationSelector } from '@/components/location/LocationSelector';
import { MapDisplay } from '@/components/map/MapDisplay';
import { FoodRecommendations } from '@/components/food/FoodRecommendations';
import { FoodExclusions } from '@/components/food/FoodExclusions';
import { ExtendedSettings } from '@/components/food/ExtendedSettings';
import { cn } from '@/lib/utils';

export default function Home() {
  const t = useTranslations();
  const features = useFeatureFlags();
  
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [excludedFoods, setExcludedFoods] = useState<string[]>([]);
  const [numberOfDiners, setNumberOfDiners] = useState<number>(1);
  const [mealType, setMealType] = useState<string>('single');
  const [specialRequirements, setSpecialRequirements] = useState<string>('');
  const [settingsChanged, setSettingsChanged] = useState<boolean>(false);
  const [hasRecommendations, setHasRecommendations] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  const handleLocationSelected = (selectedLocation: Location) => {
    setLocation(selectedLocation);
    setSettingsChanged(false);
  };
  
  const handleExclusionsChange = (newExcludedFoods: string[]) => {
    setExcludedFoods(newExcludedFoods);
    setSettingsChanged(hasRecommendations);
  };
  
  const handleNumberOfDinersChange = (newNumberOfDiners: number) => {
    setNumberOfDiners(newNumberOfDiners);
    setSettingsChanged(hasRecommendations);
  };
  
  const handleMealTypeChange = (newMealType: string) => {
    setMealType(newMealType);
    setSettingsChanged(hasRecommendations);
  };
  
  const handleSpecialRequirementsChange = (newSpecialRequirements: string) => {
    setSpecialRequirements(newSpecialRequirements);
    setSettingsChanged(hasRecommendations);
  };
  
  const handleSettingsUpdate = () => {
    setSettingsChanged(false);
    // Increment the key to force a refresh of the recommendations
    setRefreshKey(prev => prev + 1);
  };
  
  const handleRecommendationsLoaded = () => {
    setHasRecommendations(true);
  };
  
  // Check if we have data to display in the right panel
  const hasData = location || weather;

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('app.title')}</h1>
        <p className="text-lg">{t('app.description')}</p>
      </section>

      <div className="relative">
        {/* Animated layout container */}
        <div className={cn(
          "grid transition-all duration-500 ease-in-out",
          hasData ? "grid-cols-1 md:grid-cols-12 gap-6" : "grid-cols-1 max-w-md mx-auto"
        )}>
          {/* Location Section - animates from center to left */}
          <div className={cn(
            "space-y-6 transition-all duration-500",
            hasData ? "md:col-span-4" : "w-full"
          )}>
            {/* Location component */}
            <div className={cn(
              "bg-card rounded-lg p-4 shadow-sm transition-all duration-500",
              !hasData && "transform scale-105"
            )}>
              <h2 className="text-xl font-semibold mb-2">{t('location.title')}</h2>
              <p className="text-muted-foreground">{t('location.description')}</p>
              <div className="mt-4">
                <LocationSelector onLocationSelected={handleLocationSelected} />
              </div>
              
              {/* Extended Settings component */}
              {features.foodExclusions && (
                <div className="mt-6 pt-4 border-t border-border">
                  {features.extendedSettings ? (
                    <ExtendedSettings
                      excludedFoods={excludedFoods || []}
                      onExclusionChange={handleExclusionsChange}
                      numberOfDiners={numberOfDiners}
                      onNumberOfDinersChange={handleNumberOfDinersChange}
                      mealType={mealType}
                      onMealTypeChange={features.mealTypeSelection ? handleMealTypeChange : undefined}
                      specialRequirements={specialRequirements}
                      onSpecialRequirementsChange={handleSpecialRequirementsChange}
                      settingsChanged={settingsChanged}
                      onUpdateRecommendations={handleSettingsUpdate}
                    />
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-2">{t('food.exclusions.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('food.exclusions.description')}</p>
                      <div className="mt-2">
                        <FoodExclusions 
                          excludedFoods={excludedFoods || []} 
                          onExclusionChange={handleExclusionsChange} 
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Weather, Map and Food Recommendations Section */}
          {hasData && (
            <div className="md:col-span-8 space-y-6 transition-all duration-500 animate-in fade-in slide-in-from-right-10">
              {/* Weather and Map components side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weather component */}
                {location && features.useWeatherForRecommendations && (
                  <div className={cn(
                    "bg-card rounded-lg p-4 shadow-sm",
                    // If map is disabled, let weather take full width
                    !features.mapDisplay && "md:col-span-2"
                  )}>
                    <h2 className="text-xl font-semibold mb-2">{t('weather.title')}</h2>
                    <p className="text-muted-foreground">{t('weather.description')}</p>
                    <div className="mt-4">
                      <WeatherDisplay 
                        latitude={location?.latitude} 
                        longitude={location?.longitude} 
                        onWeatherLoaded={setWeather}
                      />
                    </div>
                  </div>
                )}

                {/* Map component */}
                {features.mapDisplay && location && (
                  <div className={cn(
                    "bg-card rounded-lg p-4 shadow-sm",
                    // If weather is disabled, let map take full width
                    !features.useWeatherForRecommendations && "md:col-span-2"
                  )}>
                    <h2 className="text-xl font-semibold mb-2">{t('map.title')}</h2>
                    <p className="text-muted-foreground">{t('map.description')}</p>
                    <div className="mt-4">
                      <MapDisplay location={location} />
                    </div>
                  </div>
                )}
              </div>

              {/* Food recommendations component */}
              {features.foodRecommendations && (
                // Only require weather if useWeatherForRecommendations is enabled
                (features.useWeatherForRecommendations ? (weather !== null) : (location !== null)) 
              ) && (
                <div className="bg-card rounded-lg p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-2">{t('food.title')}</h2>
                  <p className="text-muted-foreground">{t('food.description')}</p>
                  <div className="mt-4">
                    <FoodRecommendations 
                      key={refreshKey}
                      weather={features.useWeatherForRecommendations ? weather : null} 
                      excludedFoods={excludedFoods} 
                      defaultNumberOfDiners={numberOfDiners}
                      defaultMealType={mealType}
                      specialRequirements={specialRequirements}
                      location={location || undefined}
                      onRecommendationsLoaded={handleRecommendationsLoaded}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}