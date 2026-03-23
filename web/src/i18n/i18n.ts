import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEs from './locales/es/common.json';
import authEs from './locales/es/auth.json';
import membershipEs from './locales/es/membership.json';
import treasuryEs from './locales/es/treasury.json';
import dashboardEs from './locales/es/dashboard.json';
import errorsEs from './locales/es/errors.json';
import validationEs from './locales/es/validation.json';

export const NAMESPACES = [
  'common',
  'auth',
  'membership',
  'treasury',
  'dashboard',
  'errors',
  'validation',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  ns: [...NAMESPACES],
  defaultNS: 'common',
  resources: {
    es: {
      common: commonEs,
      auth: authEs,
      membership: membershipEs,
      treasury: treasuryEs,
      dashboard: dashboardEs,
      errors: errorsEs,
      validation: validationEs,
    },
  },
  interpolation: {
    escapeValue: false, // React ya escapa por defecto
  },
  react: {
    useSuspense: false, // Traducciones bundled, no async
  },
});

export default i18n;
