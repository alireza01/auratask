interface I18nConfig {
  locales: string[];
  defaultLocale: string;
  prefixDefault: boolean;
  localeDetection: boolean;
  localeCookie: string;
  localeCookieOptions: {
    path: string;
    sameSite: 'lax' | 'strict' | 'none';
    secure: boolean;
  };
}

const i18nConfig: I18nConfig = {
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en',
  prefixDefault: false,
  localeDetection: true,
  localeCookie: 'NEXT_LOCALE',
  localeCookieOptions: {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}

export default i18nConfig 