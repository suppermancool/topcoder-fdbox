'use strict';

import * as ctrl from '../../components/api-controller';
import stripe from '../../components/stripe';
import _ from 'lodash';
import { Promise } from 'bluebird';
import { invoiceToPDF } from '../../components/invoice';

/**
 * Get user invoice by id
 * @param  {Object} req The request
 * @param  {Object} res The respnse
 * @return {Promise}
 */
export function getInvoice(req, res) {
  return stripe.invoices.retrieve(req.params.id)
    .then(ctrl.respondWithResult(res))
    .catch(e => {
      res.status(e.statusCode || 500);
      res.json({
        error: e.message
      });
    });
}

/**
 * Gets invoices for a particular customer
 * @param  {Object} req The request
 * @param  {Object} res The response
 * @return {[type]}     Promise
 */
export function getInvoices(req, res) {
  let invoices;
  stripe.invoices.list({ customer: req.user.account.stripeCustomerId })
    .then(invs => {
      let subscriptionPromises = [];
      invoices = invs.data;

      _.each(invoices, inv => {
        subscriptionPromises.push(stripe.subscriptions.retrieve(inv.subscription));
      });

      return Promise.all(subscriptionPromises);
    })
    .then(subs => {
      let subscriptions = {};
      let custPromises = [];

      _.each(subs, sub => {
        subscriptions[sub.id] = sub;
      });

      _.each(invoices, inv => {
        inv.subscription = subscriptions[inv.subscription];
        custPromises.push(stripe.customers.retrieve(inv.customer));
      });

      return Promise.all(custPromises);
    })
    .then(custs => {
      _.each(custs, cust => {
        custs[cust.id] = cust;
      });

      _.each(invoices, inv => {
        inv.customer = custs[inv.customer];
      });

      return invoices;
    })
    .then(ctrl.respondWithResult(res))
    .catch(e => {
      res.status(e.statusCode || 500);
      res.json({
        error: e.message
      });
    });
}

/**
 * Generates the PDF invoice
 * @param  {Object} req The request
 * @param  {Object} res The response
 * @return {[type]}     Promise
 */
export function getInvoicePDF(req, res) {
  stripe.invoices.retrieve(req.params.id).then(invoice => invoiceToPDF(res, req, invoice))
  .catch(err => {
    console.log('PDF Generation Error: ');
    console.dir(err);
    res.status(err.statusCode || 500);
    res.json({
      error: 'Unable to generate PDF'
    });
  });
}
