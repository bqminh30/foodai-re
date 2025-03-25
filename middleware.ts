import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'vi', 'fr'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
  localeDetection: true
});

export const config = {
  matcher: ['/((?!api|_next|.*\..*).*)'],
};