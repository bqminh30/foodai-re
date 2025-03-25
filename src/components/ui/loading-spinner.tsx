'use client';

import { useTranslations } from 'next-intl';

interface LoadingSpinnerProps {
  text?: string;
  namespace?: string;
  className?: string;
}

export function LoadingSpinner({ text, namespace = 'common', className = 'p-4 h-32' }: LoadingSpinnerProps) {
  const t = useTranslations(namespace);
  const loadingText = text || t('loading');
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-2">{loadingText}</p>
    </div>
  );
}