'use strict';

import config from '../../config/environment';
import stripe from '../../components/stripe';
import handlers from './stripe.service';

/**
 * Validate and handle stripe webhooks
 * @param  {Object} req The request
 * @param  {Object} res The respnse
 */
export function handleEvent(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, config.stripe.endpointSecret);
    console.log('STRIPE_HOOK_HANDLER', event);
    if(handlers[event.type]) {
      return handlers[event.type](event, res);
    }
    console.log(`Event handler for ${event.type} not available`);
    res.sendStatus(200);
  } catch(e) {
    res.sendStatus(400);
  }
}
