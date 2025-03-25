import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { notFound } from 'next/navigation';
import { Header } from '@/components/ui/header';
import type { Metadata } from 'next';
import "@/app/globals.css";
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EnvProvider } from '@/components/EnvProvider';
import { Footer } from '@/components/ui/footer';
import { RecaptchaProvider } from '@/services/recaptcha';

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(error);
    return {
      title: 'Weather Food Finder',
      description: 'Discover the perfect dishes to enjoy based on your local weather conditions',
    };
  }

  return {
    title: messages.app.title,
    description: messages.app.description,
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise <{
    locale: string;
  }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <EnvProvider>
          <RecaptchaProvider>
            <ErrorBoundary>
              <Header />
              <div className="pt-12 min-h-screen flex flex-col" suppressHydrationWarning>
                <div className="flex-grow">
                  {children}
                </div>
                <Footer />
              </div>
            </ErrorBoundary>
          </RecaptchaProvider>
        </EnvProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}