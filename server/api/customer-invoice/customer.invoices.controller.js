'use strict';

import stripe from '../../components/stripe';
import _ from 'lodash';
import { Promise } from 'bluebird';
import { invoiceToPDF } from '../../components/invoice';
import User from '../user/user.model';
import JSZip from 'jszip';
import moment from 'moment';

/**
 * Get all user invoices as zip file
 * @param req
 * @param res
 */
export function getInvoicesZip(req, res) {
  //initialize zip
  let zip = new JSZip();
  //get all customer invoices for specified period
  stripe.invoices.list({
    date: {
      gte: req.params.dateStart,
      lte: req.params.dateEnd
    }
  })
  .then(invoices => {
    if(invoices.data.length === 0) {
      throw new Error('No invoices found for selected period.');
    }
    //create hashmap of customer ID to invoice ID's
    let custMap = _.chain(invoices.data)
      .keyBy('id')
      .mapValues('customer')
      .reduce((result, value, key) => {
        (result[value] || (result[value] = [])).push(key);
        return result;
      }, {})
      .value();
    //create array of promises to lookup customer data
    let userPromises = [];
    let customerData = false;
    _.forEach(custMap, (custInvoices, custID) => {
      userPromises.push(User.findOne({'account.stripeCustomerId': custID}, {company: 1, address: 1, postcode: 1, city: 1, email: 1})
      .populate('enterprise', 'email company address postcode city')
      .then(user => {
        if(user) {
          customerData = true;
          _.forEach(custInvoices, invoiceID => {
            //match invoice ID in original invoice object, insert customer info
            let invoiceIndex = _.findIndex(invoices.data, o => o.id === invoiceID);
            if(invoiceIndex !== -1) {
              _.merge(invoices.data[invoiceIndex], {customer: user});
            }
          });
        }
        return;
      }));
    });

    return Promise.all(userPromises)
    .then(() => {
      if(!customerData) {
        throw new Error('No customer data found for invoices in selected period.');
      }
      return invoices.data;
    });
  })
  .then(invoicesData => {
    //create array of pdf promises to add to zip
    let zipPromises = [];
    _.forEach(invoicesData, curInvoice => {
      zipPromises.push(() => invoiceToPDF(res, req, curInvoice, {method: 'buffer'}).then(buffer =>
        zip.file(`${curInvoice.customer.company}/${curInvoice.id}.pdf`, buffer)
      )
      .catch(err => console.log('ERROR!', err)));
    });
    //generate each pdf, add to zip
    return Promise.each(zipPromises, pdf => pdf());
  })
  .then(() => {
    //send final zip file to browser
    const startDate = moment.unix(req.params.dateStart).utc()
      .format('YYYY-MM-DD');
    const endDate = moment.unix(req.params.dateEnd).utc()
      .format('YYYY-MM-DD');
    res.set('Content-Type', 'application/zip; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename=Customer_Invoices_${startDate}_${endDate}.zip`);

    const buffer = zip.generate({type: 'nodebuffer'});
    res.write(buffer, 'binary');
    res.end(null, 'binary');
  })
  .catch(error => {
    console.log('Error during invoice ZIP creation:', error);
    res.status(500);
    res.statusMessage = error;
    res.end();
  });
}
