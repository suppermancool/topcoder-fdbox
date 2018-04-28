'use strict';

import en from './i18n/en';
import de from './i18n/de';

export function routeConfig($routeProvider, $locationProvider, $translateProvider, tmhDynamicLocaleProvider) {
  'ngInject';

  tmhDynamicLocaleProvider.localeLocationPattern('../locales/angular-locale_{{locale}}.js');

  $routeProvider.otherwise({
    redirectTo: '/'
  });

  $locationProvider.html5Mode(true);
  $translateProvider.useSanitizeValueStrategy(null);

  // add translation table
  tmhDynamicLocaleProvider.defaultLocale('de');
  $translateProvider
    .translations('en', en)
    .translations('de', de)
    .preferredLanguage('de');
}
