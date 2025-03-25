'use client';

import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto py-2 px-4 flex justify-end items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  );
}