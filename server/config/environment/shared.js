'use strict';

const constants = require('../../config/constants');

exports = module.exports = {
  // Default User Preferences
  defaultUserPreferences: {
    standardFontSize: '11px',
    standardFontName: 'Arial'
  },
  // List of user roles
  userRoles: [
    constants.ENTERPRISE_USER, constants.ENTEPRISE, constants.ADMIN
  ],
  // Discounts available
  billingDiscounts: [
    {title: 'Free Account', value: 'freePLAN'} // Value need to be registered Stripe couponId
  ],
  // Coupons
  // those are used to provide bonuses for instance 'free access'
  // to subscriptions
  coupons: [
    {
      id: 'freePlan',
      currency: 'eur',
      duration: 'forever',
      percent_off: 100
    }
  ],
  // Subscription Plans available
  subscriptionPlans: [
    {
      id: 'subscriptionPlan-dafault',
      amount: 5000,
      currency: 'eur',
      interval: 'month',
      interval_count: 1,
      name: 'Monatliche grundgebühr'
    }
  ],
  defaultSubscriptionPlan: 0,
  subscriptionTaxPercentage: 20.0,
  // Stripe
  stripe: {
    publicKey: 'pk_test_8xED0uUOEplPOZm9ai0RPAdH',
    image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
    locale: 'de'
  },
  uploads: {
    public: '/assets/uploads',
    templates: 'templates',
    docs: 'docx'
  }

};
