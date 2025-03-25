'use client';

import React, { Component, ErrorInfo, JSX, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          <Button 
            className="mt-4" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide translations
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps): JSX.Element {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

// Custom hook for creating localized error messages
export function useErrorMessages() {
  const t = useTranslations('errors');
  
  return {
    locationError: {
      notFound: t('location.notFound'),
      permissionDenied: t('location.permissionDenied'),
      timeout: t('location.timeout'),
      unavailable: t('location.unavailable'),
      unknown: t('location.unknown')
    },
    weatherError: {
      fetchFailed: t('weather.fetchFailed'),
      invalidCoordinates: t('weather.invalidCoordinates'),
      serviceUnavailable: t('weather.serviceUnavailable'),
      unknown: t('weather.unknown')
    },
    aiError: {
      fetchFailed: t('ai.fetchFailed'),
      serviceUnavailable: t('ai.serviceUnavailable'),
      unknown: t('ai.unknown')
    },
    networkError: {
      offline: t('network.offline'),
      timeout: t('network.timeout'),
      unknown: t('network.unknown')
    }
  };
}