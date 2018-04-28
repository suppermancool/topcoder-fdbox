'use strict';

import _ from 'lodash';
import pdf from 'html-pdf';
import pug from 'pug';
import moment from 'moment';
import path from 'path';
import { Promise } from 'bluebird';
import {defaultInvoiceData, defaultPdfOptions} from './config';
import User from '../../api/user/user.model';
import * as auth from '../../auth/auth.service';

/**
 * Converts a number to localised currency
 * @param {Number} num whole number given in cents to be converted
 * @return {String} localised currency string
 */
const convertToCurrency = num => {
  if(isNaN(num)) {
    return num;
  }
  return (num / 100).toLocaleString(defaultInvoiceData.localeString, {style: 'currency', currency: defaultInvoiceData.currency});
};
/**
 * Converts a date to localised date format
 * @param {Number} dateNum Date given in seconds since Unix epoch to be formatted
 * @return {String} localised date string
 */
const formatDate = dateNum => moment.unix(dateNum)
  .utc()
  .locale(defaultInvoiceData.language)
  .format(defaultInvoiceData.dateFormat);
/**
 * Gets client company data from mongo database
 * @param {Object} id customer id supplied by stripe invoice API call
 * @return {Object} User data object with client company data
 */
const getClientData = id => User.findOne({'account.stripeCustomerId': id }, {company: 1, address: 1, postcode: 1, city: 1, email: 1})
  .populate('enterprise', 'email company address postcode city');
/**
 * Compiles client company data and adds to invoice object
 * @param {Object} invoiceData Data object containing invoice data, usually supplied by stripe API call
 * @param {Object} req request object from client
 * @return {Object} invoice data object with added customer data
 */
const compileClientData = (invoiceData, req) =>
  new Promise((resolve, reject) => {
    if(typeof invoiceData.customer === 'string' && (!req.user || req.user.account.stripeCustomerId !== invoiceData.customer && auth.hasRole('admin'))) {
      return getClientData(invoiceData.customer).then(cData => {
        if(cData === null) {
          return reject(`Customer ${invoiceData.customer} not found in database!`);
        }
        return resolve(_.merge(invoiceData, {customer: cData}));
      });
    } else if(invoiceData.customer !== null && typeof invoiceData.customer === 'object') {
      resolve(invoiceData);
    } else if(req.user && req.user.account.stripeCustomerId === invoiceData.customer) {
      invoiceData.customer = {};
      invoiceData.customer.company = req.user.company;
      invoiceData.customer.address = req.user.address;
      invoiceData.customer.postcode = req.user.postcode;
      invoiceData.customer.city = req.user.city;
      invoiceData.email = invoiceData.email ? invoiceData.email : req.user.email;
      resolve(invoiceData);
    } else {
      return reject('Invalid Customer');
    }
  });
/**
 * Compiles and computes final invoice Object from multiple sources
 * @param {Object} invoiceData Data object containing invoice data, usually supplied by stripe API call
 * @return {Object} final invoice data object
 */
const compileInvoiceData = invoiceData => {
  let invoice = Object.assign({}, defaultInvoiceData, invoiceData);
  invoice.dateFormatted = formatDate(invoice.date);
  invoice.dueDateFormatted = invoice.dateFormatted;

  invoice.logoPath = invoice.companyLogo ? path.resolve('server/components/invoice/', invoice.companyLogo.toString()) : null;

  if(!invoice.items && invoice.lines && invoice.lines.data) {
    invoice.items = invoice.lines.data;
    delete invoice.lines;
  }

  if(invoice.items) {
    _.each(invoice.items, line => {
      if(line.type === 'subscription') {
        line.price = convertToCurrency(line.plan.amount);
      } else {
        line.price = convertToCurrency(line.amount);
      }
      line.amount = convertToCurrency(line.amount);

      if(!line.description && line.type === 'subscription') {
        line.description = line.quantity > 1 ? `${line.quantity} x ` : line.plan.name;
        if(line.period) {
          line.period.start = formatDate(line.period.start);
          line.period.end = formatDate(line.period.end);
          line.description += ` (${line.period.start} - ${line.period.end})`;
        }
      } else if(!line.description && line.type === 'sku') {
        line.description = line.quantity > 1 ? `${line.quantity} x ` : '';
      } else if(line.type === 'invoiceitem') {
        line.purchaseDate = formatDate(line.period.start);
        line.description = `${invoice.productLabel} ${line.description} (${line.purchaseDate})`;
      }
    });
  } else {
    invoice.items = {};
  }
  if(typeof invoice.total !== 'undefined' && typeof invoice.subtotal !== 'undefined') {
    invoice.total = convertToCurrency(invoice.total);
    invoice.subtotal = convertToCurrency(invoice.subtotal);
  } else {
    invoice.total = convertToCurrency(invoice.amount);
    invoice.subtotal = null;
  }
  invoice.tax = invoice.tax ? convertToCurrency(invoice.tax) : 0;
  invoice.taxPercent = invoice.tax_percent ? invoice.tax_percent : 0;
  return invoice;
};
/**
 * Generates an invoice PDF with supplied data
 * @param {Object} invoice invoice data object returned from Stripe API call
 * @param {Object} opts optional object with override parameters for html-pdf
 * @return {PDF} generated PDF file stream
 */
const generatePDF = (invoice, opts = {}) => {
  const pdfOptions = Object.assign({}, defaultPdfOptions, opts);
  const html = pug.renderFile(path.resolve(__dirname, 'templates/invoice.pug'), {
    invoice,
    cssResource: [
      `file://${path.resolve(__dirname, 'css/invoice.css')}`,
      `file://${path.resolve(__dirname, 'css/bootstrap.min.css')}`
    ]
  });

  const createResult = pdf.create(html, pdfOptions);
  if(opts.method === 'buffer') {
    const pdfToBuffer = Promise.promisify(Object.getPrototypeOf(createResult).toBuffer, { context: createResult });
    return pdfToBuffer();
  }

  const pdfToStream = Promise.promisify(Object.getPrototypeOf(createResult).toStream, { context: createResult });
  return pdfToStream();
};
/**
 * Main function called to convert Stripe invoice to PDF and send as response
 * @param {Object} sRes response object to return to client
 * @param {Object} sReq request object from client
 * @param {Object} invoiceData invoice data object returned from Stripe API call
 * @param {Object} opts optional object with override parameters for html-pdf
 * @return {PDF} generated PDF file
 */
export const invoiceToPDF = (sRes, sReq = {}, invoiceData = {}, opts = {}) => {
  invoiceData.date = invoiceData.created ? invoiceData.created : invoiceData.date;
  invoiceData.fileName = invoiceData.fileName ? invoiceData.fileName : `INVOICE_${moment.unix(invoiceData.date).utc()
    .format('YYYY-MM-DD')}`;
  return compileClientData(invoiceData, sReq).then(iData => {
    const invoice = compileInvoiceData(iData);
    return generatePDF(invoice, opts).then(resPDF => {
      if(opts.method === 'buffer') {
        return resPDF;
      }
      sRes.set('Content-Type', 'application/pdf; charset=utf-8');
      sRes.set('Content-Disposition', `attachment; filename=${invoiceData.fileName}.pdf`);
      resPDF.pipe(sRes);
    });
  });
};
