'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { isFeatureEnabled } from '@/lib/features';

// Context to track if reCAPTCHA is available
interface RecaptchaContextType {
  isEnabled: boolean;
}

const RecaptchaContext = createContext<RecaptchaContextType>({
  isEnabled: false,
});

// Hook to use reCAPTCHA context
export const useRecaptcha = () => useContext(RecaptchaContext);

interface RecaptchaProviderProps {
  children: ReactNode;
}

export function RecaptchaProvider({ children }: RecaptchaProviderProps) {
  const isEnabled = isFeatureEnabled('recaptcha');
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  
  // If reCAPTCHA is not enabled, just render children
  if (!isEnabled || !siteKey) {
    return (
      <RecaptchaContext.Provider value={{ isEnabled: false }}>
        {children}
      </RecaptchaContext.Provider>
    );
  }
  
  // If reCAPTCHA is enabled, wrap with provider
  return (
    <RecaptchaContext.Provider value={{ isEnabled: true }}>
      <GoogleReCaptchaProvider
        reCaptchaKey={siteKey}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'head',
        }}
      >
        {children}
      </GoogleReCaptchaProvider>
    </RecaptchaContext.Provider>
  );
} 