'use strict';

import * as ctrl from '../../components/api-controller';
import stripe from '../../components/stripe';
import _ from 'lodash';
import { Promise } from 'bluebird';
import { invoiceToPDF } from '../../components/invoice';

/**
 * Get user invoice for product orders by id
 * @param req
 * @param res
 */
export function getOrderInvoice(req, res) {
  return stripe.orders.retrieve(req.params.id)
    .then(ctrl.respondWithResult(res))
    .catch(e => {
      res.status(e.statusCode || 500);
      res.json({
        error: e.message
      });
    });
}

/**
 * Gets order invoices for a particular customer
 * @param  {Object} req The request
 * @param  {Object} res The response
 * @return {[type]}     Promise
 */
export function getOrderInvoices(req, res) {
  let invoices;
  stripe.orders.list({ customer: req.user.account.stripeCustomerId })
    .then(ordrs => {
      let custPromises = [];
      invoices = ordrs.data;

      _.each(invoices, inv => {
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
 * Get Order Invoice PDF
 * @param req
 * @param res
 */
export function getOrderInvoicePDF(req, res) {
  stripe.orders.retrieve(req.params.id).then(invoice => invoiceToPDF(res, req, invoice))
  .catch(err => {
    console.log('PDF Generation Error: ');
    console.dir(err);
    res.status(err.statusCode || 500);
    res.json({
      error: 'Unable to generate PDF'
    });
  });
}

