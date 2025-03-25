import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const safeLocale = locale || 'vi'; // Default to 'vi' if locale is undefined
  const defaultLocale = 'vi'; // Default locale for fallback
  
  try {
    // Try to load messages for the requested locale
    return {
      locale: safeLocale,
      messages: (await import(`../../messages/${safeLocale}.json`)).default,
      timeZone: 'Asia/Ho_Chi_Minh',
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${safeLocale}`, error);
    
    // If the requested locale is not available, try English as a common fallback
    if (safeLocale !== 'en' && safeLocale !== defaultLocale) {
      try {
        return {
          locale: 'en',
          messages: (await import('../../messages/en.json')).default,
          timeZone: 'Asia/Ho_Chi_Minh',
        };
      } catch (fallbackError) {
        console.error('Failed to load English fallback messages', fallbackError);
      }
    }
    
    // Ultimate fallback to default locale if neither requested nor English is available
    return {
      locale: defaultLocale,
      messages: (await import(`../../messages/${defaultLocale}.json`)).default,
      timeZone: 'Asia/Ho_Chi_Minh',
    };
  }
});