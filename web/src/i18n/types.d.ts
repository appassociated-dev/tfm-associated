import 'i18next';

import type commonEs from './locales/es/common.json';
import type authEs from './locales/es/auth.json';
import type membershipEs from './locales/es/membership.json';
import type treasuryEs from './locales/es/treasury.json';
import type dashboardEs from './locales/es/dashboard.json';
import type errorsEs from './locales/es/errors.json';
import type validationEs from './locales/es/validation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonEs;
      auth: typeof authEs;
      membership: typeof membershipEs;
      treasury: typeof treasuryEs;
      dashboard: typeof dashboardEs;
      errors: typeof errorsEs;
      validation: typeof validationEs;
    };
  }
}
