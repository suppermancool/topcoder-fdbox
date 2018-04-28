'use strict';

import angular from 'angular';

export function StripeCheckout($window, appConfig, $rootScope) {
  'ngInject';

  return $window.StripeCheckout.configure({
    key: appConfig.stripe.publicKey,
    image: appConfig.stripe.image,
    locale: appConfig.stripe.locale,
    token: token => {
      // Emit the token
      $rootScope.$emit('StripeCheckoutToken', token);
    }
  });
}

export default angular.module('fbdoxApp.StripeCheckout', [])
  .factory('StripeCheckout', StripeCheckout)
  .name;
