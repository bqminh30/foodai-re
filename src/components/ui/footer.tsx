'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations('footer');
  
  return (
    <footer className="mt-8 py-4 border-t">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        {t('author')} &copy; {currentYear} {t('copyright')}
      </div>
    </footer>
  );
}