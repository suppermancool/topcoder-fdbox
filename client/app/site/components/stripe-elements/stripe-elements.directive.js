'use strict';

import angular from 'angular';

export default angular.module('fbdoxApp.stripe-elements', [])
.directive('stripeElements', () => ({
  restrict: 'A',
  scope: {
    stripe: '=',
    postalCode: '=',
    onChange: '&',
    callback: '&'
  },
  link: scope => {
    const elements = scope.stripe.elements({
      locale: 'de'
    });
    const style = {
      iconStyle: 'solid',
      style: {
        base: {
          iconColor: '#8898AA',
          color: '#555',
          lineHeight: '36px',
          fontWeight: 400,
          fontSize: '14px',
          '::placeholder': {
            color: '#c5c5c5',
          },
        },
        invalid: {
          iconColor: '#e85746',
          color: '#e85746',
        }
      },
      classes: {
        focus: 'is-focused',
        empty: 'is-empty',
      },
      hidePostalCode: true,
      value: {postalCode: scope.postalCode}
    };

    const card = elements.create('card', style);
    card.mount('#card-element');

    // Handle real-time validation errors from the card Element.
    card.on('change', event => {
      scope.onChange({event});
    });
    // Send data directly to stripe server to create a token (uses stripe.js)
    const createToken = () => {
      scope.stripe.createToken(card).then(event => {
        scope.onChange({event});
        if(event.token) {
          card.destroy();
          scope.callback();
        }
      });
    };

    scope.$on('StripeCreateToken', () => {
      createToken();
    });
  }
}))
.name;
