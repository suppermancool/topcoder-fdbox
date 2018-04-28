'use strict';
import stripeSDK from 'stripe';
import config from '../../config/environment';
import _ from 'lodash';

const stripe = stripeSDK(config.stripe.secretKey);

/**
 * Recursive helper to iterate /customers/list
 * to search fro specific customer with email
 * @param  {String} email   Email to check
 * @param  {[Object]} options Options to pass to `stripe.customers.list`
 * @return {Promise}  Promise that resolves with result
 */
const looper = function(email, options) {
  return stripe.customers.list(options)
    .then(customers => {
      const customer = _.find(customers.data, {email});
      if(customer) {
        console.log(`${email} is stripe customer`);
        return customer;
      }
      if(!customers.has_more) {
        console.log(`${email} is not stripe customer`);
        return false;
      }
      // There are more customers need to loop further
      options.starting_after = customers.data[customers.data.length - 1].id;
      return looper(email, options);
    });
};
/**
 * Check if stripe customer exists by email
 * @param  {String} email Email to check
 * @return {Promise} Promise that resolves with result
 */
export function stripeCustomerExists(email) {
  console.log(`Checking ${email} for existence in stripe`);
  return looper(email, { limit: 100 });
}

export default stripe;
