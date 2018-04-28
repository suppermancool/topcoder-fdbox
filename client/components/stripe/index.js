'use strict';

import angular from 'angular';

export function Stripe($window, appConfig) {
  'ngInject';

  return $window.Stripe(appConfig.stripe.publicKey);
}

export default angular.module('fbdoxApp.Stripe', [])
  .factory('Stripe', Stripe)
  .name;
