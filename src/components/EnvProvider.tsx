'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { FeatureFlags, getFeatureFlags } from '@/lib/features';

// Create a context for feature flags
const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

/**
 * Hook to access feature flags
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within an EnvProvider');
  }
  return context;
}

interface EnvProviderProps {
  children?: ReactNode;
}

/**
 * Provider component for environment variables and feature flags
 */
export function EnvProvider({ children }: EnvProviderProps) {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    // Initialize feature flags
    setFeatureFlags(getFeatureFlags());
  }, []);

  // Don't render anything until feature flags are loaded
  if (!featureFlags) {
    return null;
  }

  return (
    <FeatureFlagsContext.Provider value={featureFlags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}