'use strict';

import angular from 'angular';

export default angular.module('fbdoxApp.stripe-elements', [])
.directive('stripeElements', () => ({
  restrict: 'A',
  scope: {
    stripe: '=',
    postalCode: '=',
    shouldDestroy: '=',
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

    const cardNumber = elements.create('cardNumber', style);
    cardNumber.mount('#card-number');

    const cardExpiry = elements.create('cardExpiry', style);
    cardExpiry.mount('#card-expiry');

    const cardCvc = elements.create('cardCvc', style);
    cardCvc.mount('#card-cvc');

    // Handle real-time validation errors from the card Element.
    cardNumber.on('change', event => {
      scope.onChange({event});
    });
    cardExpiry.on('change', event => {
      scope.onChange({event});
    });
    cardCvc.on('change', event => {
      scope.onChange({event});
    });

    // Send data directly to stripe server to create a token (uses stripe.js)
    const createToken = () => {
      scope.stripe.createToken(cardNumber, cardExpiry, cardCvc).then(event => {
        scope.onChange({event});
        if(event.token && scope.shouldDestroy) {
          cardNumber.destroy();
          cardExpiry.destroy();
          cardCvc.destroy();
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
