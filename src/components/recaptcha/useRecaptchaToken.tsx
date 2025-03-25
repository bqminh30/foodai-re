'use client';

import { useState, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useRecaptcha } from '../../components/recaptcha/RecaptchaProvider';

interface UseRecaptchaTokenOptions {
  action?: string;
}

interface UseRecaptchaTokenResult {
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  executeRecaptcha: (action?: string) => Promise<string | null>;
}

/**
 * Hook for getting reCAPTCHA v3 tokens
 * @param options - Options for reCAPTCHA token generation
 * @returns Token, loading state, error, and execute function
 */
export function useRecaptchaToken(
  options: UseRecaptchaTokenOptions = {}
): UseRecaptchaTokenResult {
  const { action = 'submit' } = options;
  const { isEnabled } = useRecaptcha();
  const { executeRecaptcha: executeGoogleRecaptcha } = useGoogleReCaptcha() || {};
  
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const executeRecaptcha = useCallback(
    async (customAction?: string): Promise<string | null> => {
      // If reCAPTCHA is not enabled, return a placeholder token
      if (!isEnabled) {
        return 'disabled';
      }
      
      // If executeGoogleRecaptcha is not available, return null
      if (!executeGoogleRecaptcha) {
        console.warn('reCAPTCHA not initialized but feature is enabled');
        // Don't set error here, just return disabled token
        // This can help prevent errors when the feature flag changes
        return 'disabled';
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Execute reCAPTCHA and get token
        const recaptchaToken = await executeGoogleRecaptcha(customAction || action);
        setToken(recaptchaToken);
        
        return recaptchaToken;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to execute reCAPTCHA');
        setError(error);
        console.error('reCAPTCHA execution error:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [executeGoogleRecaptcha, isEnabled, action]
  );
  
  return {
    token,
    isLoading,
    error,
    executeRecaptcha,
  };
} 