'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  namespace?: string;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, namespace = 'common', className = 'p-4' }: ErrorDisplayProps) {
  const t = useTranslations(namespace);
  
  return (
    <div className={`text-center ${className}`}>
      <p className="text-destructive">{error}</p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={onRetry}
        >
          {t('retry')}
        </Button>
      )}
    </div>
  );
}