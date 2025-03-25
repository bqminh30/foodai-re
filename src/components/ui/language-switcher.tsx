'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SUPPORTED_LOCALES = ['en', 'vi', 'fr'];

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLocale = (newLocale: string) => {
    // Remove the current locale prefix if it exists
    const currentLocalePath = `/${locale}`;
    let newPath = pathname;
    
    if (pathname.startsWith(currentLocalePath)) {
      newPath = pathname.replace(currentLocalePath, '');
    }
    
    // If the path is empty after removing locale, set it to root
    if (!newPath) newPath = '/';
    
    // Add the new locale prefix only if it's not the default locale (vi)
    const localizedPath = newLocale === 'vi' ? newPath : `/${newLocale}${newPath}`;
    
    router.push(localizedPath);
  };

  // Get available locales that have translations
  const availableLocales = SUPPORTED_LOCALES.filter(code => {
    try {
      // Try to get the translation for this locale
      return t(code) !== undefined;
    } catch {
      // If translation doesn't exist, filter it out
      return code === locale; // Always include current locale
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="font-medium text-xs">
            {locale.toUpperCase()}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((code) => (
          <DropdownMenuItem 
            key={code}
            onClick={() => switchLocale(code)}
            className={locale === code ? 'font-bold' : ''}
          >
            {t(code) || code.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}